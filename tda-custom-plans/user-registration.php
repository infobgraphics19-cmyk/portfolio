<?php
if (!defined('ABSPATH')) exit;

/**
 * Create (or find) the WordPress user for a payment and link it.
 *
 * @return int user ID, or 0 on failure
 */
function tda_handle_user_after_payment($payment_id) {
    global $wpdb;
    $table = $wpdb->prefix . 'tda_payments';

    $payment = $wpdb->get_row(
        $wpdb->prepare("SELECT * FROM {$table} WHERE id = %d", $payment_id)
    );

    if (!$payment) return 0;

    // Logged-in purchase: already linked to the account.
    $user_id = (int) $payment->user_id;
    if ($user_id && get_user_by('ID', $user_id)) {
        return $user_id;
    }

    $email = $payment->email;
    $user  = get_user_by('email', $email);

    if (!$user) {
        $password = wp_generate_password(12, true);
        $user_id  = wp_create_user($email, $password, $email);

        if (is_wp_error($user_id)) {
            error_log('TDA USER: ' . $user_id->get_error_message());
            return 0;
        }

        wp_update_user([
            'ID'   => $user_id,
            'role' => 'subscriber',
        ]);

        // Read (and deleted) by the welcome email.
        update_user_meta($user_id, 'tda_temp_password', $password);
    } else {
        $user_id = $user->ID;
    }

    $wpdb->update($table, ['user_id' => $user_id], ['id' => $payment_id]);

    return (int) $user_id;
}
