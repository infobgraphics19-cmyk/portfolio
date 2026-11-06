<?php
/**
 * Hourly cron: email users whose plan expires within the next 2 days.
 */
if (!defined('ABSPATH')) exit;

if (!defined('TDA_REMINDER_DAYS_BEFORE')) define('TDA_REMINDER_DAYS_BEFORE', 2);

add_action('tda_expiry_reminder_event', 'tda_run_expiry_reminders');

// Make sure the event exists even if the plugin was updated without re-activation.
add_action('init', function () {
    if (!wp_next_scheduled('tda_expiry_reminder_event')) {
        wp_schedule_event(time() + 300, 'hourly', 'tda_expiry_reminder_event');
    }
});

function tda_run_expiry_reminders() {
    global $wpdb;
    $table = $wpdb->prefix . 'tda_payments';

    $now    = tda_now_gmt();
    $window = gmdate('Y-m-d H:i:s', time() + TDA_REMINDER_DAYS_BEFORE * DAY_IN_SECONDS);

    /*
     * - paid, not reminded yet, expiring inside the window
     * - plan longer than the reminder window (no reminder for the 24h trial)
     * - not already renewed (no later paid row for same user/province/vehicle)
     */
    $rows = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT p.* FROM {$table} p
             WHERE p.payment_status = 'paid'
               AND p.reminder_sent = 0
               AND p.user_id IS NOT NULL
               AND p.plan_days > %d
               AND p.expires_at > %s
               AND p.expires_at <= %s
               AND NOT EXISTS (
                   SELECT 1 FROM {$table} p2
                   WHERE p2.user_id = p.user_id
                     AND p2.province = p.province
                     AND p2.vehicle_type = p.vehicle_type
                     AND p2.payment_status = 'paid'
                     AND p2.expires_at > p.expires_at
               )
             LIMIT 50",
            TDA_REMINDER_DAYS_BEFORE,
            $now,
            $window
        )
    );

    foreach ((array) $rows as $row) {
        // Mark first so a slow/failed mail never causes repeated emails.
        $claimed = $wpdb->query(
            $wpdb->prepare(
                "UPDATE {$table} SET reminder_sent = 1 WHERE id = %d AND reminder_sent = 0",
                $row->id
            )
        );
        if ($claimed !== 1) continue;

        tda_send_expiry_reminder_email($row);
    }
}

/** URL of the page holding [tda_plans] (used for the renew button). */
function tda_get_plans_page_url() {
    if (defined('TDA_PLANS_PAGE_URL')) {
        return TDA_PLANS_PAGE_URL;
    }

    // Saved automatically when the [tda_plans] shortcode renders on a page.
    $page_id = (int) get_option('tda_plans_page_id');

    if (!$page_id || get_post_status($page_id) !== 'publish') {
        global $wpdb;
        $page_id = (int) $wpdb->get_var(
            "SELECT ID FROM {$wpdb->posts}
             WHERE post_status = 'publish' AND post_type = 'page'
               AND post_content LIKE '%[tda_plans%'
             ORDER BY ID ASC LIMIT 1"
        );
        if ($page_id) update_option('tda_plans_page_id', $page_id, false);
    }

    $url = $page_id ? get_permalink($page_id) : home_url('/');
    return apply_filters('tda_plans_page_url', $url);
}
