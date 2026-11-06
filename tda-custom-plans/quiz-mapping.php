<?php
/**
 * Province / vehicle -> licence class -> LearnPress quiz mapping,
 * access helpers, and LearnPress enrollment.
 */
if (!defined('ABSPATH')) exit;

/** Which licence classes each vehicle type unlocks. */
function tda_get_vehicle_classes() {
    return [
        'car'   => [5, 7],
        'bike'  => [6, 8],
        'truck' => [1, 2, 3, 4],   // shown as "Commercial" on the frontend
    ];
}

/** Quiz IDs per province per licence class. */
function tda_get_class_quiz_map() {
    return [
        'alberta' => [
            1 => [9760, 9801, 9843, 9885],
            2 => [9939, 9980, 10021, 10061, 10102],
            3 => [10940, 10958, 11000, 11040, 11081],
            4 => [10421, 10452, 10484, 10521, 10557],
            5 => [10280, 10321, 10393, 10827],
            6 => [10120, 10162, 10203, 10244],
            7 => [10362, 10598, 10799, 10858, 10899],
            8 => [10639, 10675, 10716, 10757],
        ],
        'british_columbia' => [
            1 => [5563, 5604, 5646, 5688],
            2 => [5742, 5824, 5864, 5905],
            3 => [7059, 7094, 7184, 7259, 7345],
            4 => [6224, 6255, 6287, 6324],
            5 => [6083, 6124, 6196, 6360, 6799],
            6 => [5923, 5965, 6006, 6047],
            7 => [6165, 6401, 6743, 6867, 6968],
            8 => [6442, 6478, 6559, 6651],
        ],
    ];
}

/**
 * Fallback course per province. Normally the course is looked up from the
 * quiz itself (LearnPress curriculum tables), so this is only used when a
 * quiz is not attached to any course.
 */
function tda_get_course_map() {
    return [
        'alberta'          => 94,   // /courses/alberta-paid-2/
        'british_columbia' => 0,    // looked up from the BC quizzes
    ];
}

function tda_get_provinces() {
    return array_keys(tda_get_class_quiz_map());
}

function tda_get_classes_for_vehicle($vehicle) {
    $map = tda_get_vehicle_classes();
    return $map[strtolower((string) $vehicle)] ?? [];
}

function tda_get_quiz_ids_for($province, $vehicle) {
    $province = strtolower((string) $province);
    $map      = tda_get_class_quiz_map();
    $ids      = [];
    foreach (tda_get_classes_for_vehicle($vehicle) as $class) {
        $ids = array_merge($ids, $map[$province][$class] ?? []);
    }
    return array_values(array_unique(array_map('intval', $ids)));
}

/** Every quiz ID that this plugin manages (all provinces, all classes). */
function tda_get_all_mapped_quiz_ids() {
    static $all = null;
    if ($all === null) {
        $all = [];
        foreach (tda_get_class_quiz_map() as $classes) {
            foreach ($classes as $ids) {
                $all = array_merge($all, $ids);
            }
        }
        $all = array_values(array_unique(array_map('intval', $all)));
    }
    return $all;
}

/** Course that a quiz belongs to, from the LearnPress curriculum tables. */
function tda_get_course_of_quiz($quiz_id) {
    $map = tda_get_quiz_course_lookup();
    return (int) ($map[(int) $quiz_id] ?? 0);
}

/** quiz_id => course_id for all mapped quizzes (cached 12h). */
function tda_get_quiz_course_lookup() {
    static $lookup = null;
    if ($lookup !== null) return $lookup;

    $lookup = get_transient('tda_quiz_course_lookup');
    if (is_array($lookup)) return $lookup;

    global $wpdb;
    $ids    = tda_get_all_mapped_quiz_ids();
    $lookup = [];
    if ($ids) {
        $in   = implode(',', array_map('intval', $ids));
        $rows = $wpdb->get_results(
            "SELECT si.item_id, s.section_course_id
             FROM {$wpdb->prefix}learnpress_section_items si
             INNER JOIN {$wpdb->prefix}learnpress_sections s ON s.section_id = si.section_id
             WHERE si.item_id IN ($in)"
        );
        foreach ((array) $rows as $row) {
            $lookup[(int) $row->item_id] = (int) $row->section_course_id;
        }
    }
    set_transient('tda_quiz_course_lookup', $lookup, $lookup ? 12 * HOUR_IN_SECONDS : 5 * MINUTE_IN_SECONDS);
    return $lookup;
}

// Curriculum edited -> rebuild the quiz/course lookup.
add_action('save_post_lp_course', function () {
    delete_transient('tda_quiz_course_lookup');
});

/** Courses whose curriculum is filtered per user (instructor hidden too). */
function tda_get_managed_course_ids() {
    $ids = array_filter(array_map('intval', tda_get_course_map()));
    $ids = array_merge($ids, array_values(tda_get_quiz_course_lookup()));
    return array_values(array_unique(array_filter($ids)));
}

/**
 * Province has quizzes AND a course we can enroll into.
 * Used to refuse checkout for a province we can't deliver.
 */
function tda_province_is_ready($province, $vehicle) {
    foreach (tda_get_quiz_ids_for($province, $vehicle) as $quiz_id) {
        if (tda_get_course_of_quiz($quiz_id)) return true;
    }
    $course_map = tda_get_course_map();
    return !empty($course_map[$province]);
}

/* ------------------------------------------------------------------
 * Access (based on paid, non-expired rows in wp_tda_payments)
 * ------------------------------------------------------------------ */

function tda_now_gmt() {
    return gmdate('Y-m-d H:i:s');
}

/** Paid rows that have not expired yet. */
function tda_get_active_grants($user_id) {
    static $cache = [];
    $user_id = (int) $user_id;
    if (!$user_id) return [];
    if (isset($cache[$user_id])) return $cache[$user_id];

    global $wpdb;
    $cache[$user_id] = (array) $wpdb->get_results(
        $wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}tda_payments
             WHERE user_id = %d AND payment_status = 'paid'
               AND expires_at IS NOT NULL AND expires_at > %s
             ORDER BY expires_at DESC",
            $user_id,
            tda_now_gmt()
        )
    );
    return $cache[$user_id];
}

/** Most recent paid row, active or not (null if the user never paid). */
function tda_get_latest_grant($user_id) {
    global $wpdb;
    return $wpdb->get_row(
        $wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}tda_payments
             WHERE user_id = %d AND payment_status = 'paid' AND expires_at IS NOT NULL
             ORDER BY expires_at DESC LIMIT 1",
            (int) $user_id
        )
    );
}

/** Quiz IDs the user can currently see / take. */
function tda_get_allowed_quiz_ids($user_id) {
    $ids = [];
    foreach (tda_get_active_grants($user_id) as $grant) {
        $ids = array_merge($ids, tda_get_quiz_ids_for($grant->province, $grant->vehicle_type));
    }
    return array_values(array_unique($ids));
}

/** Admins and LearnPress instructors always see everything. */
function tda_user_bypasses_restrictions($user_id = 0) {
    $user_id = $user_id ?: get_current_user_id();
    return $user_id && (user_can($user_id, 'manage_options') || user_can($user_id, 'edit_lp_courses'));
}

/* ------------------------------------------------------------------
 * LearnPress enrollment
 * ------------------------------------------------------------------ */

/**
 * Enroll the user in the course(s) holding the quizzes for this payment
 * and create the quiz user_items. Safe to run again on renewal: existing
 * rows are re-used and the course end_time is extended.
 */
function tda_assign_learnpress_items_after_payment($user_id, $payment) {
    global $wpdb;

    if (!function_exists('learn_press_get_user') && !class_exists('LearnPress')) {
        error_log('TDA: LearnPress not active');
        return;
    }

    $user_id  = (int) $user_id;
    $province = strtolower($payment->province);
    $vehicle  = strtolower($payment->vehicle_type);
    $quiz_ids = tda_get_quiz_ids_for($province, $vehicle);

    if (!$quiz_ids) {
        error_log("TDA: No quiz mapping for {$province} / {$vehicle}");
        return;
    }

    $table      = $wpdb->prefix . 'learnpress_user_items';
    $start_time = tda_now_gmt();   // LearnPress stores GMT
    $end_time   = $payment->expires_at;
    $course_map = tda_get_course_map();

    // Group quizzes by their course.
    $by_course = [];
    foreach ($quiz_ids as $quiz_id) {
        $course_id = tda_get_course_of_quiz($quiz_id) ?: (int) ($course_map[$province] ?? 0);
        if (!$course_id) {
            error_log("TDA: Quiz {$quiz_id} is not in any course, skipped");
            continue;
        }
        $by_course[$course_id][] = $quiz_id;
    }

    foreach ($by_course as $course_id => $course_quizzes) {

        // 1. Course user_item (create, or extend on renewal)
        $course_item = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT user_item_id, end_time FROM {$table}
                 WHERE user_id = %d AND item_id = %d AND item_type = 'lp_course'
                 ORDER BY user_item_id DESC LIMIT 1",
                $user_id,
                $course_id
            )
        );

        if (!$course_item) {
            $wpdb->insert($table, [
                'user_id'      => $user_id,
                'item_id'      => $course_id,
                'item_type'    => 'lp_course',
                'status'       => 'enrolled',
                'graduation'   => 'in-progress',
                'start_time'   => $start_time,
                'end_time'     => $end_time,
                'access_level' => 50,
                'ref_id'       => 0,
                'ref_type'     => 'manual',
                'parent_id'    => 0,
            ]);
            $course_item_id = (int) $wpdb->insert_id;
        } else {
            $course_item_id = (int) $course_item->user_item_id;
            // Only ever push the end date forward (another vehicle plan may run longer).
            if (empty($course_item->end_time) || strtotime($course_item->end_time) < strtotime($end_time)) {
                $wpdb->update($table, [
                    'end_time'   => $end_time,
                    'status'     => 'enrolled',
                    'graduation' => 'in-progress',
                ], ['user_item_id' => $course_item_id]);
            }
        }

        // 2. Quiz user_items (skip ones that already exist)
        foreach ($course_quizzes as $quiz_id) {
            $exists = $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT user_item_id FROM {$table}
                     WHERE user_id = %d AND item_id = %d AND item_type = 'lp_quiz'",
                    $user_id,
                    $quiz_id
                )
            );
            if ($exists) continue;

            $wpdb->insert($table, [
                'user_id'      => $user_id,
                'item_id'      => $quiz_id,
                'item_type'    => 'lp_quiz',
                'status'       => 'started',
                'graduation'   => 'in-progress',
                'start_time'   => $start_time,
                'access_level' => 50,
                'ref_id'       => $course_id,
                'ref_type'     => 'lp_course',
                'parent_id'    => $course_item_id,
            ]);
        }
    }

    error_log("TDA: LearnPress quizzes assigned for user {$user_id} ({$province}/{$vehicle})");
}
