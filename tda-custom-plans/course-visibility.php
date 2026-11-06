<?php
/**
 * Frontend restrictions on the paid courses (e.g. /courses/alberta-paid-2/):
 *  - hide the instructor
 *  - hide quizzes that are not part of the user's active plan(s)
 *  - block opening those quizzes by URL
 *  - show an "expired, please renew" notice
 *
 * Admins and LearnPress instructors see everything.
 */
if (!defined('ABSPATH')) exit;

function tda_is_managed_course($course_id) {
    return in_array((int) $course_id, tda_get_managed_course_ids(), true);
}

/** Should this quiz be hidden / blocked for the current user? */
function tda_quiz_is_hidden_for_current_user($quiz_id, $course_id = 0) {
    $quiz_id = (int) $quiz_id;

    if (tda_user_bypasses_restrictions()) return false;

    $managed = in_array($quiz_id, tda_get_all_mapped_quiz_ids(), true)
        || ($course_id && tda_is_managed_course($course_id))
        || tda_is_managed_course(tda_get_course_of_quiz($quiz_id));

    if (!$managed) return false;

    return !in_array($quiz_id, tda_get_allowed_quiz_ids(get_current_user_id()), true);
}

/** Current single course being viewed (course page or one of its items). */
function tda_current_course_id() {
    if (!is_singular('lp_course')) return 0;
    $id = (int) get_queried_object_id();
    return tda_is_managed_course($id) ? $id : 0;
}

/* ------------------------------------------------------------------
 * Curriculum: remove items and empty sections (LearnPress 4.2.7+)
 * ------------------------------------------------------------------ */

add_filter('learn-press/course/html-course-item', function ($parts, $courseModel, $userModel, $item) {
    if (isset($item->item_type, $item->item_id)
        && $item->item_type === 'lp_quiz'
        && tda_quiz_is_hidden_for_current_user($item->item_id, $courseModel ? $courseModel->get_id() : 0)) {
        return [];
    }
    return $parts;
}, 20, 4);

add_filter('learn-press/course/html-section-item', function ($parts, $courseModel, $userModel, $section_item) {
    if (!$courseModel || !tda_is_managed_course($courseModel->get_id()) || tda_user_bypasses_restrictions()) {
        return $parts;
    }

    $items   = $section_item->items ?? [];
    $visible = 0;
    foreach ($items as $item) {
        if ($item->item_type !== 'lp_quiz' || !tda_quiz_is_hidden_for_current_user($item->item_id, $courseModel->get_id())) {
            $visible++;
        }
    }

    if ($visible === 0) return [];   // whole section belongs to other classes

    // Fix the "N Items" counter.
    if (isset($parts['header']) && $visible !== count($items)) {
        $parts['header'] = preg_replace(
            '#(<div class="section-count-items">)(.*?)(</div>)#s',
            '${1}' . sprintf(_n('%d Item', '%d Items', $visible, 'learnpress'), $visible) . '${3}',
            $parts['header'],
            1
        );
    }
    return $parts;
}, 20, 4);

// "Plan expired / no plan" notice above the curriculum.
add_filter('learn-press/course/html-curriculum', function ($parts, $courseModel) {
    if (!$courseModel || !tda_is_managed_course($courseModel->get_id()) || tda_user_bypasses_restrictions()) {
        return $parts;
    }
    $notice = tda_get_access_notice_html();
    if ($notice && isset($parts['wrapper'])) {
        $parts['wrapper'] .= $notice;
    }
    return $parts;
}, 20, 2);

function tda_get_access_notice_html() {
    $user_id = get_current_user_id();
    if ($user_id && tda_get_active_grants($user_id)) return '';

    $renew = esc_url(tda_get_plans_page_url());
    $latest = $user_id ? tda_get_latest_grant($user_id) : null;

    if ($latest) {
        $msg = sprintf(
            'Your plan expired on %s. <a href="%s">Renew your plan</a> to continue practicing.',
            esc_html(tda_format_gmt_date($latest->expires_at)),
            $renew
        );
    } else {
        $msg = sprintf('<a href="%s">Choose a plan</a> to unlock your practice tests.', $renew);
    }

    return '<div class="tda-access-notice learn-press-message warning">' . $msg . '</div>';
}

/* ------------------------------------------------------------------
 * Block opening a hidden quiz directly
 * ------------------------------------------------------------------ */

add_filter('learnpress/course/item/can-view', function ($view, $item, $user) {
    if (!is_object($item) || !method_exists($item, 'get_id')) return $view;

    $item_id = (int) $item->get_id();
    if (get_post_type($item_id) !== 'lp_quiz') return $view;

    if (tda_quiz_is_hidden_for_current_user($item_id)) {
        $view->flag    = false;
        $view->key     = 'tda_not_in_plan';
        $view->message = wp_strip_all_tags(tda_get_access_notice_html())
            ?: 'This practice test is not included in your plan.';
    }
    return $view;
}, 20, 3);

// Hard stop for older templates that don't use can-view: redirect back to the course.
add_action('template_redirect', function () {
    $course_id = tda_current_course_id();
    if (!$course_id) return;

    $item_slug = get_query_var('course-item');
    if (!$item_slug) return;

    $quiz = get_page_by_path($item_slug, OBJECT, 'lp_quiz');
    if ($quiz && tda_quiz_is_hidden_for_current_user($quiz->ID, $course_id)) {
        wp_safe_redirect(get_permalink($course_id));
        exit;
    }
}, 20);

/* ------------------------------------------------------------------
 * Hide instructor
 * ------------------------------------------------------------------ */

add_filter('learn-press/course-tabs', function ($tabs, $courseModel = null) {
    $course_id = $courseModel && method_exists($courseModel, 'get_id') ? $courseModel->get_id() : get_the_ID();
    if (tda_is_managed_course($course_id)) {
        unset($tabs['instructor']);
    }
    return $tabs;
}, 20, 2);

add_filter('learn-press/course/instructor-html', function ($parts, $course) {
    if ($course && method_exists($course, 'get_id') && tda_is_managed_course($course->get_id())) {
        return [];
    }
    return $parts;
}, 20, 2);

/*
 * CSS fallback: covers older LearnPress templates, theme overrides and
 * curriculum loaded by AJAX.
 */
add_action('wp_head', function () {
    $course_id = tda_current_course_id();
    if (!$course_id) return;

    $selectors = [
        '.course-instructor', '.meta-item-instructor', '.course-nav-tab-instructor',
        '.course-tab-panel-instructor', '#tab-instructor-input', '.lp-course-author',
        '.course-author', '.instructor-item', '.course-meta .instructor',
    ];

    if (!tda_user_bypasses_restrictions()) {
        $allowed = tda_get_allowed_quiz_ids(get_current_user_id());
        $quiz_ids = array_unique(array_merge(
            tda_get_all_mapped_quiz_ids(),
            tda_get_course_quiz_ids($course_id)
        ));
        foreach (array_diff($quiz_ids, $allowed) as $qid) {
            $qid = (int) $qid;
            $selectors[] = ".course-item[data-item-id=\"{$qid}\"]";
            $selectors[] = ".course-item[data-id=\"{$qid}\"]";
            $selectors[] = ".course-item-{$qid}";
        }
    }

    echo '<style id="tda-course-visibility">' . implode(',', $selectors) . '{display:none !important;}</style>';
});

// Hide sections left empty after hiding their quizzes (older templates).
add_action('wp_footer', function () {
    if (!tda_current_course_id() || tda_user_bypasses_restrictions()) return;
    ?>
<script>
(function () {
    function tdaHideEmptySections() {
        document.querySelectorAll('.course-section, li.section').forEach(function (section) {
            var items = section.querySelectorAll('.course-item');
            if (!items.length) return;
            var visible = Array.prototype.some.call(items, function (el) {
                return window.getComputedStyle(el).display !== 'none';
            });
            if (!visible) section.style.display = 'none';
        });
    }
    var pending = false;
    function schedule() {
        if (pending) return;
        pending = true;
        setTimeout(function () { pending = false; tdaHideEmptySections(); }, 200);
    }
    document.addEventListener('DOMContentLoaded', schedule);
    // Curriculum can be loaded by AJAX.
    if (window.MutationObserver) {
        new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
    }
})();
</script>
    <?php
}, 99);

/** All quiz IDs in a course's curriculum. */
function tda_get_course_quiz_ids($course_id) {
    global $wpdb;
    return array_map('intval', (array) $wpdb->get_col(
        $wpdb->prepare(
            "SELECT si.item_id
             FROM {$wpdb->prefix}learnpress_section_items si
             INNER JOIN {$wpdb->prefix}learnpress_sections s ON s.section_id = si.section_id
             WHERE s.section_course_id = %d AND si.item_type = 'lp_quiz'",
            (int) $course_id
        )
    ));
}
