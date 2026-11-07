<?php
/**
 * "My Practice Tests" page: [tda_my_quizzes]
 *
 * Lists only the quizzes included in the user's active plan(s), grouped by
 * licence class. The LearnPress course landing page redirects here, so
 * customers never see the full course / instructor.
 */
if (!defined('ABSPATH')) exit;

add_shortcode('tda_my_quizzes', 'tda_render_my_quizzes');

// Create the page on first run after install/update.
add_action('init', function () {
    if (!get_option('tda_my_quizzes_page_id')) {
        tda_ensure_my_quizzes_page();
    }
}, 20);

/** URL of the page holding [tda_my_quizzes] (created automatically). */
function tda_get_my_quizzes_page_url() {
    if (defined('TDA_MY_QUIZZES_PAGE_URL')) return TDA_MY_QUIZZES_PAGE_URL;

    $page_id = (int) get_option('tda_my_quizzes_page_id');
    if ($page_id && get_post_status($page_id) === 'publish') {
        return get_permalink($page_id);
    }
    return site_url('/lp-profile/');
}

/** Create the "My Practice Tests" page once (runs on plugin upgrade). */
function tda_ensure_my_quizzes_page() {
    $page_id = (int) get_option('tda_my_quizzes_page_id');
    if ($page_id && get_post_status($page_id)) return $page_id;

    global $wpdb;
    $page_id = (int) $wpdb->get_var(
        "SELECT ID FROM {$wpdb->posts}
         WHERE post_type = 'page' AND post_status = 'publish'
           AND post_content LIKE '%[tda_my_quizzes%' LIMIT 1"
    );

    if (!$page_id) {
        $page_id = wp_insert_post([
            'post_type'    => 'page',
            'post_status'  => 'publish',
            'post_title'   => 'My Practice Tests',
            'post_name'    => 'my-practice-tests',
            'post_content' => '[tda_my_quizzes]',
        ]);
    }

    if ($page_id && !is_wp_error($page_id)) {
        update_option('tda_my_quizzes_page_id', (int) $page_id);
    }
    return (int) $page_id;
}

/** Link to a quiz inside its course (LearnPress URL format). */
function tda_get_quiz_link($quiz_id, $course_id) {
    if ($course_id && class_exists('\LearnPress\Models\CourseModel')) {
        $course = \LearnPress\Models\CourseModel::find($course_id, true);
        if ($course) return $course->get_item_link($quiz_id, 'lp_quiz');
    }
    if ($course_id && function_exists('learn_press_get_course')) {
        $course = learn_press_get_course($course_id);
        if ($course && method_exists($course, 'get_item_link')) return $course->get_item_link($quiz_id);
    }
    return get_permalink($quiz_id);
}

/** Latest LearnPress attempt status for a quiz: [label, css class]. */
function tda_get_quiz_status($user_id, $quiz_id) {
    global $wpdb;
    $row = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT status, graduation FROM {$wpdb->prefix}learnpress_user_items
             WHERE user_id = %d AND item_id = %d AND item_type = 'lp_quiz'
             ORDER BY user_item_id DESC LIMIT 1",
            $user_id,
            $quiz_id
        )
    );

    if ($row && $row->status === 'completed') {
        if ($row->graduation === 'passed') return ['Passed', 'passed'];
        if ($row->graduation === 'failed') return ['Failed', 'failed'];
        return ['Completed', 'completed'];
    }
    return ['Not attempted', 'new'];
}

function tda_render_my_quizzes() {
    if (!is_user_logged_in()) {
        return '<div class="tda-myq"><p class="tda-myq-notice">Please <a href="' . esc_url(wp_login_url(get_permalink())) . '">log in</a> to see your practice tests.</p></div>';
    }

    $user_id = get_current_user_id();
    $grants  = tda_get_active_grants($user_id);

    ob_start();
    echo '<div class="tda-myq">';

    if (!$grants) {
        $latest = tda_get_latest_grant($user_id);
        $msg    = $latest
            ? 'Your plan expired on <strong>' . esc_html(tda_format_gmt_date($latest->expires_at, 'd M Y, g:i A')) . '</strong>. Renew your plan to continue practicing.'
            : 'You don’t have an active plan yet.';
        echo '<div class="tda-myq-notice">' . $msg . '</div>';
        echo '<p><a class="tda-myq-btn" href="' . esc_url(tda_get_plans_page_url()) . '">' . ($latest ? 'Renew My Plan' : 'Choose a Plan') . '</a></p>';
        echo '</div>';
        return ob_get_clean();
    }

    // One block per province + vehicle (a user may hold several plans).
    $seen = [];
    foreach ($grants as $grant) {
        $key = $grant->province . '|' . $grant->vehicle_type;
        if (isset($seen[$key])) continue;   // grants are ordered by expiry DESC: first = latest end
        $seen[$key] = true;

        $map     = tda_get_class_quiz_map()[$grant->province] ?? [];
        $classes = tda_get_classes_for_vehicle($grant->vehicle_type);
        ?>
        <section class="tda-myq-plan">
            <header class="tda-myq-plan-head">
                <h2><?php echo esc_html(tda_province_label($grant->province) . ' – ' . tda_vehicle_label($grant->vehicle_type)); ?></h2>
                <p>
                    <?php echo esc_html(tda_plan_label_from_days($grant->plan_days)); ?> ·
                    Valid until <strong><?php echo esc_html(tda_format_gmt_date($grant->expires_at, 'd M Y, g:i A')); ?></strong>
                </p>
            </header>

            <?php foreach ($classes as $class) :
                $quiz_ids = $map[$class] ?? [];
                if (!$quiz_ids) continue;
            ?>
                <h3 class="tda-myq-class">Class <?php echo (int) $class; ?></h3>
                <ul class="tda-myq-list">
                    <?php foreach ($quiz_ids as $i => $quiz_id) :
                        if (get_post_status($quiz_id) !== 'publish') continue;
                        $course_id = tda_get_course_of_quiz($quiz_id);
                        [$status, $status_class] = tda_get_quiz_status($user_id, $quiz_id);
                    ?>
                        <li class="tda-myq-item">
                            <span class="tda-myq-title"><?php echo esc_html(get_the_title($quiz_id)); ?></span>
                            <span class="tda-myq-status tda-myq-status--<?php echo esc_attr($status_class); ?>"><?php echo esc_html($status); ?></span>
                            <a class="tda-myq-btn" href="<?php echo esc_url(tda_get_quiz_link($quiz_id, $course_id)); ?>">
                                <?php echo $status_class === 'new' ? 'Start Test' : 'Practice Again'; ?>
                            </a>
                        </li>
                    <?php endforeach; ?>
                </ul>
            <?php endforeach; ?>
        </section>
        <?php
    }

    echo '</div>';
    return ob_get_clean();
}

/* ------------------------------------------------------------------
 * LearnPress profile: show the plan expiry as "Expiration time"
 * (LearnPress otherwise uses the course "Duration" setting, e.g. 10 weeks).
 * ------------------------------------------------------------------ */
add_filter('learnPress/user-item/expiration-time', function ($expire, $duration, $user_item) {
    if (!is_object($user_item) || ($user_item->item_type ?? '') !== 'lp_course') return $expire;
    if (!tda_is_managed_course((int) $user_item->item_id)) return $expire;

    $latest = tda_get_latest_grant((int) $user_item->user_id);
    $end    = $latest ? $latest->expires_at : ($user_item->end_time ?? '');

    return ($end && class_exists('LP_Datetime')) ? new LP_Datetime($end) : $expire;
}, 20, 3);
