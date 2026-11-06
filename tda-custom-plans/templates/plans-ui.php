<?php
if (!defined('ABSPATH')) exit;

$tda_plans   = tda_get_plans();
$tda_groups  = tda_get_price_groups();
$tda_user    = wp_get_current_user();
$tda_email   = $tda_user && $tda_user->exists() ? $tda_user->user_email : '';
$tda_first   = array_key_first($tda_groups);
$tda_features = [
    '180+ Exam-Style Practice Questions',
    'Real Knowledge Test Simulations',
    'Timed Practice Tests',
    'Exclusive Student Dashboard',
    'Ad-Free Learning Experience',
    'Access Anytime, Anywhere',
    'Unlimited Practice Attempts',
    'Detailed Performance Tracking',
];
?>
<div id="tda-plans">

    <!-- VEHICLE GROUP TABS -->
    <div class="tda-group-tabs" role="tablist">
        <?php foreach ($tda_groups as $group_key => $group) : ?>
            <button type="button" role="tab"
                class="tda-group-tab<?php echo $group_key === $tda_first ? ' is-active' : ''; ?>"
                data-group="<?php echo esc_attr($group_key); ?>"
                aria-selected="<?php echo $group_key === $tda_first ? 'true' : 'false'; ?>">
                <?php echo esc_html($group['label']); ?>
            </button>
        <?php endforeach; ?>
    </div>

    <?php foreach ($tda_groups as $group_key => $group) : ?>
    <!-- PRICING TABLE: <?php echo esc_html($group['label']); ?> -->
    <div class="tda-pricing-table<?php echo $group_key === $tda_first ? '' : ' tda-hidden'; ?>"
         data-group="<?php echo esc_attr($group_key); ?>">

        <?php foreach ($tda_plans as $plan_key => $plan) :
            $pricing = tda_get_plan_pricing($plan_key, $group_key);
            if (!$pricing) continue;
            $is_featured = !empty($plan['badge']);
            $is_trial    = $plan_key === 'trial';
        ?>
        <div class="tda-plan<?php echo $is_featured ? ' tda-popular' : ''; ?><?php echo $is_trial ? ' tda-trial' : ''; ?>">
            <?php if ($is_featured) : ?>
                <span class="tda-badge"><?php echo esc_html($plan['badge']); ?></span>
            <?php endif; ?>

            <h3><?php echo esc_html($plan['name']); ?></h3>
            <p class="<?php echo $is_featured ? 'tda-duration-30' : 'tda-duration'; ?>"><?php echo esc_html($plan['duration']); ?></p>

            <?php if ($pricing['final_cents'] < $pricing['actual_cents']) : ?>
                <p class="tda-actual-price"><del><?php echo esc_html(tda_format_money($pricing['actual_cents'])); ?></del></p>
            <?php endif; ?>

            <p class="tda-price"><?php echo esc_html(tda_format_money($pricing['final_cents'])); ?></p>

            <?php if ($pricing['base_pct'] || $pricing['early_pct']) : ?>
                <p class="tda-discount-note">
                    <?php
                    $notes = [];
                    if ($pricing['base_pct'])  $notes[] = $pricing['base_pct'] . '% off';
                    if ($pricing['early_pct']) $notes[] = 'extra ' . $pricing['early_pct'] . '% early bird';
                    echo esc_html(implode(' + ', $notes));
                    ?>
                </p>
            <?php else : ?>
                <p class="tda-discount-note">Try everything for 24 hours</p>
            <?php endif; ?>

            <ul class="tda-features">
                <?php foreach ($tda_features as $feature) : ?>
                    <li><i aria-hidden="true" class="icon icon-tick cst-icn"></i><?php echo esc_html($feature); ?></li>
                <?php endforeach; ?>
            </ul>

            <label class="tda-select">
                <button type="button" class="tda-select-plan"
                    data-plan="<?php echo esc_attr($plan_key); ?>"
                    data-group="<?php echo esc_attr($group_key); ?>"
                    data-label="<?php echo esc_attr($plan['name'] . ' – ' . $plan['duration'] . ' (' . tda_format_money($pricing['final_cents']) . ')'); ?>">
                    <?php echo esc_html($is_trial ? 'Start 24 Hour Trial' : 'Select ' . $plan['duration'] . ' Plan'); ?>
                </button>
            </label>
        </div>
        <?php endforeach; ?>

    </div>
    <?php endforeach; ?>

<!-- Popup -->
<div id="tda-popup-overlay"></div>

<div id="tda-popup" role="dialog" aria-modal="true" aria-labelledby="tda-selected-plan-text">
    <button type="button" id="tda-close-popup" aria-label="Close">×</button>

    <h3 id="tda-selected-plan-text"></h3>

    <!-- Province -->
    <div class="tda-step">
        <h4>Select Province</h4>
        <select id="tda-province-popup">
            <option value="">Select Province</option>
            <?php foreach (tda_get_provinces() as $province) : ?>
                <option value="<?php echo esc_attr($province); ?>"><?php echo esc_html(tda_province_label($province)); ?></option>
            <?php endforeach; ?>
        </select>
    </div>

    <!-- Vehicle (options depend on the selected tab) -->
    <div class="tda-step">
        <h4>Select Vehicle</h4>
        <?php foreach ($tda_groups as $group_key => $group) : ?>
            <div class="tda-vehicle-group" data-group="<?php echo esc_attr($group_key); ?>">
                <?php foreach ($group['vehicles'] as $vehicle) : ?>
                    <label>
                        <input type="radio" name="tda_vehicle" value="<?php echo esc_attr($vehicle); ?>" class="cst-r">
                        <?php echo esc_html(tda_vehicle_label($vehicle)); ?>
                        <small>(<?php echo esc_html(tda_classes_label($vehicle)); ?>)</small>
                    </label>
                <?php endforeach; ?>
            </div>
        <?php endforeach; ?>
    </div>

    <!-- Email -->
    <div class="tda-step">
        <h4>Email</h4>
        <input type="email" id="tda-email" placeholder="Enter your email"
            value="<?php echo esc_attr($tda_email); ?>" <?php echo $tda_email ? 'readonly' : ''; ?>>
    </div>

    <input type="hidden" id="tda-selected-plan" name="plan">
    <input type="hidden" id="tda-selected-group" name="group">

    <p id="tda-error" class="tda-error" role="alert"></p>

    <button type="button" id="tda-continue">Continue to Payment</button>
</div>

</div>
