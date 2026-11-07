# TDA Custom Plans (v2.1)

WordPress plugin for thedriveracademy.ca: plan pricing table, Stripe Checkout,
account creation + welcome email, LearnPress quiz assignment by licence class,
per-user quiz visibility, and plan-expiry reminders.

## Install / update
1. Add to `wp-config.php` (keys are no longer stored in the plugin):
   ```php
   define('TDA_STRIPE_SECRET', 'sk_live_or_test_...');
   define('TDA_STRIPE_WEBHOOK_SECRET', 'whsec_...'); // recommended
   // define('TDA_CURRENCY', 'cad');                // default: usd
   // define('TDA_PLANS_PAGE_URL', 'https://thedriveracademy.ca/plans/'); // renew link, auto-detected otherwise
   ```
2. Upload the plugin folder **including `stripe-php-master/`** (not in git).
3. Stripe dashboard → Webhooks → endpoint `https://thedriveracademy.ca/wp-json/tda/v1/stripe-webhook`
   with events `checkout.session.completed` and `checkout.session.async_payment_succeeded`.
4. The DB table upgrade runs automatically on the next page load.

## Where to change things
| What | File |
|---|---|
| Prices, discounts (27% / 20% early bird), plan names | `plans-config.php` |
| Vehicle → classes, class → quiz IDs (AB + BC) | `quiz-mapping.php` |
| Welcome + reminder emails | `email-template.php` |
| Reminder timing (2 days) | `expiry-reminder.php` (`TDA_REMINDER_DAYS_BEFORE`) |
| Hide instructor / unassigned quizzes, course page redirect | `course-visibility.php` |
| "My Practice Tests" page `[tda_my_quizzes]`, profile expiry date | `my-quizzes.php` |

Vehicle is stored as `car`, `bike`, `truck`; the frontend shows Car, Motorcycle, Commercial.

## My Practice Tests page
A page **My Practice Tests** (`/my-practice-tests/`) with `[tda_my_quizzes]` is created
automatically. Customers only see the quizzes in their active plan(s) there. The paid
course landing pages (e.g. `/courses/alberta-paid-2/`) redirect customers to it; admins
and instructors can still open them. Quiz pages themselves keep working.

LearnPress course setting: keep **Block content when expired** off for the paid courses
(plan expiry is handled by this plugin). Setting the course Duration to 0 is fine too.
