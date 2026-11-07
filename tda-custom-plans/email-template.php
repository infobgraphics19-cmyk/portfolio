<?php
if (!defined('ABSPATH')) exit;

/** Format a GMT datetime from the DB in the site's timezone. */
function tda_format_gmt_date($gmt, $format = 'd M Y') {
    if (empty($gmt)) return 'N/A';
    return get_date_from_gmt($gmt, $format);
}

/** "Class 5, Class 7" for a vehicle type. */
function tda_classes_label($vehicle) {
    $classes = tda_get_classes_for_vehicle($vehicle);
    if (!$classes) return 'N/A';
    return implode(', ', array_map(function ($c) { return 'Class ' . $c; }, $classes));
}

function tda_email_button($url, $text) {
    return "<p><a href='" . esc_url($url) . "' style='display:inline-block;padding:10px 15px;background:#e53935;color:#fff;text-decoration:none;border-radius:5px;'>"
        . esc_html($text) . "</a></p>";
}

/**
 * Welcome / payment confirmation email (also used for renewals).
 */
function tda_send_payment_success_email($payment_id) {
    global $wpdb;

    $table = $wpdb->prefix . 'tda_payments';

    $payment = $wpdb->get_row(
        $wpdb->prepare("SELECT * FROM {$table} WHERE id = %d", $payment_id)
    );

    if (!$payment) {
        error_log('TDA EMAIL: Payment not found');
        return false;
    }

    $email   = $payment->email;
    $user_id = (int) $payment->user_id;

    $user = get_user_by('ID', $user_id);
    if (!$user) {
        error_log('TDA EMAIL: User not found');
        return false;
    }

    // Temp password exists only for accounts created by this payment.
    $temp_password = get_user_meta($user_id, 'tda_temp_password', true);
    $is_new_user   = !empty($temp_password);

    $username   = $user->user_login ?: 'N/A';
    $password   = $is_new_user ? $temp_password : 'Use your existing password';
    $start_date = tda_format_gmt_date($payment->paid_at ?: get_gmt_from_date($payment->created_at));
    $end_date   = tda_format_gmt_date($payment->expires_at);
    $province   = tda_province_label($payment->province);
    $vehicle    = tda_vehicle_label($payment->vehicle_type);
    $classes    = tda_classes_label($payment->vehicle_type);
    $plan_label = tda_plan_label_from_days($payment->plan_days);

    $login_url       = tda_get_my_quizzes_page_url();
    $change_pass_url = wp_lostpassword_url();

    $subject = $is_new_user
        ? 'Your Canada Driving Quiz Premium Plan is Active'
        : 'Your Canada Driving Quiz Plan has been Updated';

    $message = "
    <p>Hi Dear,</p>

    <p>Thank you for enrolling in our <strong>Canada Driving Quiz Premium Plan</strong> — you're now one step closer to passing your driving test with confidence!</p>

    <p><strong>Here are your login details:</strong></p>
    <p>🔐 Username: " . esc_html($username) . "</p>
    <p>🔑 Password: " . esc_html($password) . "</p>
    ";

    if ($is_new_user) {
        $message .= "
        <p>For security, we recommend updating your password after your first login:</p>
        <p><a href='" . esc_url($change_pass_url) . "'>Change Password</a></p>
        ";
    }

    $message .= "
    <p><strong>📅 Enrollment Details:</strong></p>
    <p>Plan: " . esc_html($plan_label) . "</p>
    <p>Date of Enrollment: " . esc_html($start_date) . "</p>
    <p>Plan Valid Until: " . esc_html($end_date) . "</p>
    <p>Province: " . esc_html($province) . "</p>
    <p>Vehicle: " . esc_html($vehicle) . "</p>
    <p>Assigned Quiz Class: " . esc_html($classes) . "</p>

    <p><strong>What You Can Do Now:</strong></p>
    <ul>
        <li>Access unlimited practice tests</li>
        <li>Track your progress in real-time</li>
        <li>Practice questions based on the official exam pattern</li>
        <li>Improve weak areas with smart insights</li>
    </ul>
    " . tda_email_button($login_url, 'Start Practicing Now') . "

    <p>If you have any questions or need support, feel free to reach out — we’re here to help you succeed.</p>

    <p>Wishing you the best on your driving journey!</p>

    <br>

    <p>Thanks,<br>
    The Driver’s Academy Team</p>
    ";

    $headers = ['Content-Type: text/html; charset=UTF-8'];
    $sent    = wp_mail($email, $subject, $message, $headers);

    if ($sent && $is_new_user) {
        delete_user_meta($user_id, 'tda_temp_password');
    }

    error_log('TDA EMAIL ' . ($sent ? 'SENT' : 'FAILED') . ' TO: ' . $email);

    return $sent;
}

/**
 * "Your plan expires in 2 days" reminder.
 */
function tda_send_expiry_reminder_email($payment) {
    $user = get_user_by('ID', (int) $payment->user_id);
    if (!$user) return false;

    $email      = $user->user_email ?: $payment->email;
    $end_date   = tda_format_gmt_date($payment->expires_at, 'd M Y, g:i A');
    $plan_label = tda_plan_label_from_days($payment->plan_days);
    $province   = tda_province_label($payment->province);
    $vehicle    = tda_vehicle_label($payment->vehicle_type);
    $classes    = tda_classes_label($payment->vehicle_type);
    $renew_url  = tda_get_plans_page_url();

    $subject = 'Your Canada Driving Quiz Plan Expires in 2 Days';

    $message = "
    <p>Hi Dear,</p>

    <p>Your <strong>Canada Driving Quiz Premium Plan</strong> is getting expired soon.</p>

    <p><strong>📅 Plan Details:</strong></p>
    <p>Plan: " . esc_html($plan_label) . "</p>
    <p>Province: " . esc_html($province) . "</p>
    <p>Vehicle: " . esc_html($vehicle) . " (" . esc_html($classes) . ")</p>
    <p>Expires On: <strong>" . esc_html($end_date) . "</strong></p>

    <p>Please renew your plan to keep using your practice tests seamlessly. When you renew for the same province and vehicle, the days left on your current plan are kept and the new plan is added on top.</p>
    " . tda_email_button($renew_url, 'Renew My Plan') . "

    <p>If you have any questions or need support, feel free to reach out — we’re here to help you succeed.</p>

    <br>

    <p>Thanks,<br>
    The Driver’s Academy Team</p>
    ";

    $headers = ['Content-Type: text/html; charset=UTF-8'];
    $sent    = wp_mail($email, $subject, $message, $headers);

    error_log('TDA REMINDER ' . ($sent ? 'SENT' : 'FAILED') . ' TO: ' . $email . ' (payment ' . $payment->id . ')');

    return $sent;
}
