<?php
/**
 * Plan + pricing configuration.
 *
 * This is the single source of truth for prices. The browser never sends a
 * price: the server looks it up here from the plan key + vehicle.
 */
if (!defined('ABSPATH')) exit;

/* Discounts (percent). Set TDA_EARLY_BIRD_DISCOUNT to 0 to end the early-bird offer. */
if (!defined('TDA_BASE_DISCOUNT'))       define('TDA_BASE_DISCOUNT', 27);
if (!defined('TDA_EARLY_BIRD_DISCOUNT')) define('TDA_EARLY_BIRD_DISCOUNT', 20);

/**
 * Plans shown on the pricing table, in display order.
 * 'days' is stored in wp_tda_payments.plan_days (trial = 1 day = 24 hours).
 */
function tda_get_plans() {
    return [
        'trial' => [
            'days'      => 1,
            'name'      => 'Trial',
            'duration'  => '24 Hours',
            'discounts' => false,   // trial is never discounted
            'badge'     => '',
        ],
        '9' => [
            'days'      => 9,
            'name'      => 'Quick Practice',
            'duration'  => '9 Days',
            'discounts' => true,
            'badge'     => '',
        ],
        '30' => [
            'days'      => 30,
            'name'      => 'Smart Practice',
            'duration'  => '30 Days',
            'discounts' => true,
            'badge'     => 'Best Value',
        ],
        '90' => [
            'days'      => 90,
            'name'      => 'Master Practice',
            'duration'  => '90 Days',
            'discounts' => true,
            'badge'     => '',
        ],
    ];
}

/**
 * Pricing groups. Actual (pre-discount) prices in dollars.
 * Car + motorcycle share one price list, commercial (truck) has its own.
 */
function tda_get_price_groups() {
    return [
        'car_moto' => [
            'label'    => 'Car & Motorcycle',
            'vehicles' => ['car', 'bike'],
            'prices'   => ['trial' => 49, '9' => 90, '30' => 120, '90' => 270],
        ],
        'commercial' => [
            'label'    => 'Commercial Vehicles',
            'vehicles' => ['truck'],
            'prices'   => ['trial' => 49, '9' => 120, '30' => 180, '90' => 360],
        ],
    ];
}

/** Frontend labels. Backend value stays "truck". */
function tda_vehicle_label($vehicle) {
    $labels = [
        'car'   => 'Car',
        'bike'  => 'Motorcycle',
        'truck' => 'Commercial',
    ];
    $vehicle = strtolower((string) $vehicle);
    return $labels[$vehicle] ?? ucfirst($vehicle);
}

function tda_province_label($province) {
    $labels = [
        'alberta'          => 'Alberta',
        'british_columbia' => 'British Columbia',
    ];
    $province = strtolower((string) $province);
    return $labels[$province] ?? ucwords(str_replace('_', ' ', $province));
}

function tda_price_group_for_vehicle($vehicle) {
    foreach (tda_get_price_groups() as $key => $group) {
        if (in_array($vehicle, $group['vehicles'], true)) {
            return $key;
        }
    }
    return null;
}

/**
 * Price breakdown in cents for a plan + price group.
 * Returns null for an unknown plan/group.
 *
 * Car 9 days: 9000 -> 27% off = 6570 -> 20% early bird = 5256 ($52.56)
 */
function tda_get_plan_pricing($plan_key, $group_key) {
    $plans  = tda_get_plans();
    $groups = tda_get_price_groups();

    if (!isset($plans[$plan_key], $groups[$group_key]['prices'][$plan_key])) {
        return null;
    }

    $plan         = $plans[$plan_key];
    $actual_cents = (int) round($groups[$group_key]['prices'][$plan_key] * 100);

    $base_pct  = $plan['discounts'] ? (int) TDA_BASE_DISCOUNT : 0;
    $early_pct = $plan['discounts'] ? (int) TDA_EARLY_BIRD_DISCOUNT : 0;

    // Integer maths so we never get 52.559999 style rounding.
    $discounted_cents = (int) round($actual_cents * (100 - $base_pct) / 100);
    $final_cents      = (int) round($actual_cents * (100 - $base_pct) * (100 - $early_pct) / 10000);

    return [
        'plan_key'         => $plan_key,
        'days'             => (int) $plan['days'],
        'actual_cents'     => $actual_cents,
        'discounted_cents' => $discounted_cents,
        'final_cents'      => $final_cents,
        'base_pct'         => $base_pct,
        'early_pct'        => $early_pct,
    ];
}

function tda_format_money($cents) {
    $cents = (int) $cents;
    return '$' . ($cents % 100 === 0 ? number_format($cents / 100) : number_format($cents / 100, 2));
}

/** Human plan label from stored plan_days. */
function tda_plan_label_from_days($days) {
    foreach (tda_get_plans() as $plan) {
        if ((int) $plan['days'] === (int) $days) {
            return $plan['name'] . ' (' . $plan['duration'] . ')';
        }
    }
    return (int) $days . ' Days';
}
