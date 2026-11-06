<?php
/**
 * Plugin Name: TDA Custom Plans
 * Description: Custom plan system (24h trial, 9, 30, 90 days) with Stripe Checkout, LearnPress quiz assignment and expiry reminders.
 * Version: 2.0
 * Author: Kishan
 */

if (!defined('ABSPATH')) exit;

/* -----------------------------
 * Constants
 * ----------------------------- */
define('TDA_PLANS_VERSION', '2.0');
define('TDA_PLANS_DB_VERSION', '2.0');
define('TDA_PLANS_URL', plugin_dir_url(__FILE__));
define('TDA_PLANS_PATH', plugin_dir_path(__FILE__));

/*
 * Stripe keys live in wp-config.php (NOT in the plugin):
 *
 *   define('TDA_STRIPE_SECRET', 'sk_live_...');
 *   define('TDA_STRIPE_WEBHOOK_SECRET', 'whsec_...');   // recommended
 *   define('TDA_CURRENCY', 'cad');                       // optional, default usd
 */
if (!defined('TDA_CURRENCY')) define('TDA_CURRENCY', 'usd');

require_once TDA_PLANS_PATH . 'plans-config.php';
require_once TDA_PLANS_PATH . 'quiz-mapping.php';
require_once TDA_PLANS_PATH . 'user-registration.php';
require_once TDA_PLANS_PATH . 'email-template.php';
require_once TDA_PLANS_PATH . 'expiry-reminder.php';
require_once TDA_PLANS_PATH . 'course-visibility.php';

function tda_load_stripe() {
    if (!defined('TDA_STRIPE_SECRET') || !TDA_STRIPE_SECRET) {
        throw new Exception('TDA_STRIPE_SECRET is not defined in wp-config.php');
    }
    if (!class_exists('\Stripe\Stripe')) {
        require_once TDA_PLANS_PATH . 'stripe-php-master/init.php';
    }
    \Stripe\Stripe::setApiKey(TDA_STRIPE_SECRET);
}

add_action('admin_notices', function () {
    if (current_user_can('manage_options') && (!defined('TDA_STRIPE_SECRET') || !TDA_STRIPE_SECRET)) {
        echo '<div class="notice notice-error"><p><strong>TDA Custom Plans:</strong> add <code>define(\'TDA_STRIPE_SECRET\', \'sk_...\');</code> to wp-config.php — checkout is disabled until then.</p></div>';
    }
});

/* -----------------------------
 * Enqueue Scripts & Styles
 * ----------------------------- */
add_action('wp_enqueue_scripts', function () {
    wp_enqueue_style('tda-plans-css', TDA_PLANS_URL . 'assets/css/plans.css', [], TDA_PLANS_VERSION);

    wp_enqueue_script('tda-plans-js', TDA_PLANS_URL . 'assets/js/plans.js', ['jquery'], TDA_PLANS_VERSION, true);

    wp_localize_script('tda-plans-js', 'TDA', [
        'ajax_url' => admin_url('admin-ajax.php'),
        'nonce'    => wp_create_nonce('tda_plans_nonce'),
    ]);
});

/* -----------------------------
 * DB Creation / upgrade
 * ----------------------------- */
register_activation_hook(__FILE__, function () {
    tda_create_payment_table();
    if (!wp_next_scheduled('tda_expiry_reminder_event')) {
        wp_schedule_event(time() + 300, 'hourly', 'tda_expiry_reminder_event');
    }
});

register_deactivation_hook(__FILE__, function () {
    wp_clear_scheduled_hook('tda_expiry_reminder_event');
});

// Runs the upgrade when files are replaced without re-activating the plugin.
add_action('plugins_loaded', function () {
    if (get_option('tda_plans_db_version') !== TDA_PLANS_DB_VERSION) {
        tda_create_payment_table();
    }
});

function tda_create_payment_table() {
    global $wpdb;
    $table_name      = $wpdb->prefix . 'tda_payments';
    $charset_collate = $wpdb->get_charset_collate();

    // dbDelta needs two spaces after PRIMARY KEY.
    $sql = "CREATE TABLE $table_name (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        user_id BIGINT UNSIGNED NULL,
        email VARCHAR(190) NOT NULL,
        plan_days INT NOT NULL,
        plan_price DECIMAL(10,2) NOT NULL,
        province VARCHAR(100) NULL,
        vehicle_type VARCHAR(50) NULL,
        payment_status VARCHAR(20) DEFAULT 'pending',
        payment_gateway VARCHAR(50) DEFAULT 'stripe',
        transaction_id VARCHAR(190) NULL,
        stripe_session_id VARCHAR(190) NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        paid_at DATETIME NULL,
        expires_at DATETIME NULL,
        reminder_sent TINYINT(1) NOT NULL DEFAULT 0,
        PRIMARY KEY  (id),
        KEY user_id (user_id),
        KEY payment_status (payment_status),
        KEY expires_at (expires_at)
    ) $charset_collate;";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta($sql);
    update_option('tda_plans_db_version', TDA_PLANS_DB_VERSION);
}

/* -----------------------------
 * Shortcode [tda_plans]
 * ----------------------------- */
add_shortcode('tda_plans', 'tda_render_plans');
function tda_render_plans() {
    // Remember where the plans page is (for the renew link in emails).
    if (is_page() && (int) get_option('tda_plans_page_id') !== get_queried_object_id()) {
        update_option('tda_plans_page_id', get_queried_object_id(), false);
    }

    ob_start();
    include TDA_PLANS_PATH . 'templates/plans-ui.php';
    return ob_get_clean();
}

/* -----------------------------
 * AJAX: Create payment record + Stripe Checkout session
 * ----------------------------- */
add_action('wp_ajax_tda_start_checkout', 'tda_start_checkout');
add_action('wp_ajax_nopriv_tda_start_checkout', 'tda_start_checkout');

function tda_start_checkout() {
    check_ajax_referer('tda_plans_nonce', 'nonce');

    global $wpdb;
    $table = $wpdb->prefix . 'tda_payments';

    $plan_key = sanitize_key(wp_unslash($_POST['plan'] ?? ''));
    $province = sanitize_key(wp_unslash($_POST['province'] ?? ''));
    $vehicle  = sanitize_key(wp_unslash($_POST['vehicle'] ?? ''));
    $email    = sanitize_email(wp_unslash($_POST['email'] ?? ''));

    // Logged-in users always buy for their own account.
    $user_id = get_current_user_id();
    if ($user_id) {
        $email = wp_get_current_user()->user_email;
    }

    if (!in_array($vehicle, ['car', 'bike', 'truck'], true)) {
        wp_send_json_error('Please select a vehicle.');
    }
    if (!in_array($province, tda_get_provinces(), true)) {
        wp_send_json_error('Please select a province.');
    }
    if (!is_email($email)) {
        wp_send_json_error('Please enter a valid email address.');
    }
    if (!tda_province_is_ready($province, $vehicle)) {
        wp_send_json_error('Plans for ' . tda_province_label($province) . ' are not available yet.');
    }

    $pricing = tda_get_plan_pricing($plan_key, tda_price_group_for_vehicle($vehicle));
    if (!$pricing) {
        wp_send_json_error('Invalid plan.');
    }

    $inserted = $wpdb->insert($table, [
        'user_id'        => $user_id ?: null,
        'email'          => $email,
        'plan_days'      => $pricing['days'],
        'plan_price'     => $pricing['final_cents'] / 100,
        'province'       => $province,
        'vehicle_type'   => $vehicle,
        'payment_status' => 'pending',
        'created_at'     => current_time('mysql'),
    ]);

    if (!$inserted) {
        error_log('TDA CHECKOUT: insert failed: ' . $wpdb->last_error);
        wp_send_json_error('Could not start checkout. Please try again.');
    }

    $payment_id = (int) $wpdb->insert_id;
    $plan       = tda_get_plans()[$plan_key];

    try {
        tda_load_stripe();

        $session = \Stripe\Checkout\Session::create([
            'mode'                 => 'payment',
            'payment_method_types' => ['card'],
            'customer_email'       => $email,
            'client_reference_id'  => (string) $payment_id,
            'line_items'           => [[
                'price_data' => [
                    'currency'     => TDA_CURRENCY,
                    'product_data' => [
                        'name'        => $plan['name'] . ' – ' . $plan['duration'],
                        'description' => tda_province_label($province) . ' · ' . tda_vehicle_label($vehicle)
                            . ' (' . tda_classes_label($vehicle) . ')',
                    ],
                    'unit_amount'  => $pricing['final_cents'],
                ],
                'quantity'   => 1,
            ]],
            'success_url' => site_url('/payment-success/?session_id={CHECKOUT_SESSION_ID}'),
            'cancel_url'  => site_url('/payment-cancel/'),
            'metadata'    => ['payment_id' => $payment_id],
            'payment_intent_data' => [
                'metadata' => ['payment_id' => $payment_id],
            ],
        ]);
    } catch (Exception $e) {
        error_log('TDA CHECKOUT: Stripe error: ' . $e->getMessage());
        $wpdb->update($table, ['payment_status' => 'failed'], ['id' => $payment_id]);
        wp_send_json_error('Payment could not be started. Please try again.');
    }

    $wpdb->update($table, ['stripe_session_id' => $session->id], ['id' => $payment_id]);

    wp_send_json_success([
        'payment_id' => $payment_id,
        'url'        => $session->url,
    ]);
}

/* -----------------------------
 * Fulfillment (shared by webhook + success page)
 * ----------------------------- */

/**
 * Verify a Checkout Session (fetched from Stripe, never trusted from the
 * browser) and fulfil its payment.
 */
function tda_fulfill_checkout_session($session) {
    global $wpdb;
    $table = $wpdb->prefix . 'tda_payments';

    $payment_id = (int) ($session->metadata->payment_id ?? 0);
    if (!$payment_id) {
        error_log('TDA: payment_id missing in session ' . $session->id);
        return false;
    }

    if ($session->payment_status !== 'paid') {
        error_log("TDA: session {$session->id} not paid yet ({$session->payment_status})");
        return false;
    }

    $payment = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$table} WHERE id = %d", $payment_id));
    if (!$payment) {
        error_log("TDA: payment {$payment_id} not found");
        return false;
    }

    $expected = (int) round($payment->plan_price * 100);
    if ((int) $session->amount_total < $expected) {
        error_log("TDA: amount mismatch for payment {$payment_id}: paid {$session->amount_total}, expected {$expected}");
        return false;
    }

    return tda_complete_payment($payment_id, $session->payment_intent ?: $session->id);
}

/**
 * Mark paid, create user, set expiry, enroll in LearnPress, send email.
 * Runs exactly once per payment, whichever of webhook / redirect gets here first.
 */
function tda_complete_payment($payment_id, $transaction_id) {
    global $wpdb;
    $table = $wpdb->prefix . 'tda_payments';

    // Atomic claim: only one request can move pending -> paid.
    $claimed = $wpdb->query(
        $wpdb->prepare(
            "UPDATE {$table}
             SET payment_status = 'paid', transaction_id = %s, paid_at = %s
             WHERE id = %d AND payment_status IN ('pending', 'failed')",
            $transaction_id,
            tda_now_gmt(),
            $payment_id
        )
    );

    if ($claimed !== 1) {
        return true; // already fulfilled
    }

    error_log('TDA PAYMENT CONFIRMED FOR ID: ' . $payment_id);

    // 1. Create / link user
    $user_id = tda_handle_user_after_payment($payment_id);
    if (!$user_id) {
        error_log("TDA: could not create user for payment {$payment_id}");
        return false;
    }

    $payment = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$table} WHERE id = %d", $payment_id));

    // 2. Expiry. Renewal of the same province+vehicle continues from the current end date.
    $current_end = $wpdb->get_var(
        $wpdb->prepare(
            "SELECT MAX(expires_at) FROM {$table}
             WHERE user_id = %d AND province = %s AND vehicle_type = %s
               AND payment_status = 'paid' AND id <> %d",
            $user_id,
            $payment->province,
            $payment->vehicle_type,
            $payment_id
        )
    );
    $base       = max(time(), $current_end ? strtotime($current_end . ' UTC') : 0);
    $expires_at = gmdate('Y-m-d H:i:s', $base + (int) $payment->plan_days * DAY_IN_SECONDS);

    $wpdb->update($table, ['expires_at' => $expires_at], ['id' => $payment_id]);
    $payment->expires_at = $expires_at;

    // 3. LearnPress course + quizzes
    tda_assign_learnpress_items_after_payment($user_id, $payment);

    // 4. Confirmation email
    tda_send_payment_success_email($payment_id);

    do_action('tda_payment_completed', $payment_id, $user_id);

    return true;
}

/* -----------------------------
 * Stripe Webhook
 * URL: /wp-json/tda/v1/stripe-webhook
 * Events: checkout.session.completed, checkout.session.async_payment_succeeded
 * ----------------------------- */
add_action('rest_api_init', function () {
    register_rest_route('tda/v1', '/stripe-webhook', [
        'methods'             => ['GET', 'POST'],
        'callback'            => 'tda_stripe_webhook',
        'permission_callback' => '__return_true',
    ]);
});

function tda_stripe_webhook(WP_REST_Request $request) {

    if ($request->get_method() === 'GET') {
        return ['status' => 'webhook active'];
    }

    try {
        tda_load_stripe();
    } catch (Exception $e) {
        error_log('TDA WEBHOOK: ' . $e->getMessage());
        return new WP_REST_Response(['error' => 'not configured'], 500);
    }

    $payload = $request->get_body();

    if (defined('TDA_STRIPE_WEBHOOK_SECRET') && TDA_STRIPE_WEBHOOK_SECRET) {
        try {
            $event = \Stripe\Webhook::constructEvent(
                $payload,
                $request->get_header('stripe_signature'),
                TDA_STRIPE_WEBHOOK_SECRET
            );
        } catch (Exception $e) {
            error_log('TDA WEBHOOK: bad signature: ' . $e->getMessage());
            return new WP_REST_Response(['error' => 'invalid signature'], 400);
        }
    } else {
        $event = json_decode($payload);
    }

    if (empty($event->type)) {
        return new WP_REST_Response(['error' => 'invalid event'], 400);
    }

    if (!in_array($event->type, ['checkout.session.completed', 'checkout.session.async_payment_succeeded'], true)) {
        return ['ignored' => true];
    }

    try {
        // Always re-fetch from Stripe: the payload itself is never trusted.
        $session = \Stripe\Checkout\Session::retrieve($event->data->object->id);
        $ok      = tda_fulfill_checkout_session($session);
    } catch (Exception $e) {
        error_log('TDA WEBHOOK: ' . $e->getMessage());
        return new WP_REST_Response(['error' => 'processing failed'], 500);
    }

    return ['status' => $ok ? 'success' : 'skipped'];
}

/* -----------------------------
 * Success page redirect (?session_id=cs_...)
 * ----------------------------- */
add_action('init', function () {

    if (empty($_GET['session_id']) || wp_doing_ajax() || is_admin()) {
        return;
    }

    $session_id = sanitize_text_field(wp_unslash($_GET['session_id']));
    if (strpos($session_id, 'cs_') !== 0) {
        return;
    }

    try {
        tda_load_stripe();
        $session = \Stripe\Checkout\Session::retrieve($session_id);
        tda_fulfill_checkout_session($session);
    } catch (Exception $e) {
        error_log('TDA SUCCESS ERROR: ' . $e->getMessage());
    }
});
