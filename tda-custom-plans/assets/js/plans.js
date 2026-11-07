jQuery(function ($) {

    const $popup   = $('#tda-popup');
    const $overlay = $('#tda-popup-overlay');
    const $error   = $('#tda-error');

    if (!$popup.length) {
        return;
    }

    // Tabs: Car & Motorcycle / Commercial
    $('.tda-group-tab').on('click', function () {
        const group = $(this).data('group');
        $('.tda-group-tab').removeClass('is-active').attr('aria-selected', 'false');
        $(this).addClass('is-active').attr('aria-selected', 'true');
        $('.tda-pricing-table').addClass('tda-hidden')
            .filter('[data-group="' + group + '"]').removeClass('tda-hidden');
    });

    // Plan selected -> open popup
    $('.tda-select-plan').on('click', function (e) {
        e.preventDefault();

        const group = $(this).data('group');

        $('#tda-selected-plan').val($(this).data('plan'));
        $('#tda-selected-group').val(group);
        $('#tda-selected-plan-text').text($(this).data('label'));

        // Only show vehicles that belong to this price group.
        $('.tda-vehicle-group').hide().find('input').prop('checked', false);
        const $groupBox = $('.tda-vehicle-group[data-group="' + group + '"]').show();
        const $radios   = $groupBox.find('input[name="tda_vehicle"]');
        if ($radios.length === 1) {
            $radios.prop('checked', true); // Commercial has a single option
        }

        $error.text('');
        $popup.show();
        $overlay.show();
    });

    function closePopup() {
        $popup.hide();
        $overlay.hide();
    }
    $('#tda-close-popup').on('click', closePopup);
    $overlay.on('click', closePopup);

    // Continue -> create payment + Stripe Checkout, then redirect
    $('#tda-continue').on('click', function (e) {
        e.preventDefault();

        const $btn     = $(this);
        const plan     = $('#tda-selected-plan').val();
        const province = $('#tda-province-popup').val();
        const vehicle  = $popup.find('input[name="tda_vehicle"]:checked').val();
        const email    = $.trim($('#tda-email').val());

        if (!plan || !province || !vehicle || !email) {
            $error.text('Please complete all steps.');
            return;
        }

        $btn.prop('disabled', true).text('Redirecting to payment…');
        $error.text('');

        $.post(TDA.ajax_url, {
            action: 'tda_start_checkout',
            nonce: TDA.nonce,
            plan: plan,
            province: province,
            vehicle: vehicle,
            email: email
        }).done(function (res) {
            if (res.success && res.data.url) {
                window.location.href = res.data.url;
                return;
            }
            $error.text(res.data || 'Could not start payment. Please try again.');
            $btn.prop('disabled', false).text('Continue to Payment');
        }).fail(function () {
            $error.text('Could not start payment. Please try again.');
            $btn.prop('disabled', false).text('Continue to Payment');
        });
    });
});

// After payment: redirect to the dashboard
window.addEventListener('load', function () {

    if (window.location.pathname.replace(/\/$/, '') !== '/payment-success') {
        return;
    }

    let seconds = 5;
    const countdown = document.getElementById('countdown');

    const timer = setInterval(function () {
        seconds--;
        if (countdown) {
            countdown.textContent = seconds;
        }
        if (seconds <= 0) {
            clearInterval(timer);
            window.location.href = (window.TDA && TDA.my_tests_url) || '/lp-profile/';
        }
    }, 1000);
});
