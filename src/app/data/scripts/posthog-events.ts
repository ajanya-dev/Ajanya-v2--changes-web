/**
 * The single source of truth for which events are allowed to reach PostHog.
 *
 * The loader snippet's `before_send` hook drops every event whose name is not
 * in this list, so the project receives only the events the analytics spec
 * approves — no `$pageview`, `$autocapture`, `$rageclick`, `$web_vitals` or any
 * other SDK default.
 *
 * Adding a `capture()` call in PostHogService without adding its name here is
 * the one way to lose an event silently in production. PostHogService.capture()
 * warns when that happens, but only where debug logging is on.
 */

/**
 * The events currently enabled. PostHogService skips any event not listed here
 * — the capture and its person-profile update both — and `before_send` drops it
 * as a backstop. To enable an event again, uncomment its line.
 */
export const POSTHOG_APP_EVENTS: string[] = [
  // Signup and login
  'register_success',
  'user_login'
  // Disabled for now:
  // 'trial_period_started',
  // 'onboarding_selected_features',
  // 'business_verification_initiated',
  // 'business_verification_submitted',
  // 'business_verification_abandoned',
  // 'bank_setup_initiated',
  // 'bank_setup_abandoned',
  // 'bank_linked_failed',
  // 'transaction_initiated',
  // 'transaction_submitted',
  // 'transaction_abandoned'
];

/**
 * No SDK event is allowed through — the project is to receive the app's own
 * events and nothing else, so `$identify` and `$set` are dropped alongside
 * `$pageview` and the rest.
 *
 * Person profiles are not lost by this. `identify()` is still called on login
 * and signup, because it is what sets the distinct id and flips the SDK's
 * `$is_identified` flag — and under `person_profiles: 'identified_only'` that
 * flag is what lets an event be attributed to a person at all. Only the
 * `$identify` *event* is dropped on its way out; its local effect on the SDK
 * remains. The person properties it used to carry now ride on the app's own
 * events as `$set` / `$set_once` properties, which PostHog applies to the
 * profile at ingestion without a separate event.
 *
 * `$groupidentify` and `$create_alias` are absent for the same reason plus one
 * more: this app never calls `group()` or `alias()`.
 */
export const POSTHOG_IDENTITY_EVENTS: string[] = [];

/**
 * The two property names that carry person-profile updates on an ordinary
 * event. They are not event properties — PostHog consumes them during
 * ingestion and does not store them on the event — so they are kept on every
 * closed event alongside the ingestion keys rather than listed per event.
 */
export const POSTHOG_PERSON_PROPERTY_KEYS: string[] = ['$set', '$set_once'];

/** What `before_send` allows through; everything else is dropped. */
export const POSTHOG_ALLOWED_EVENTS: string[] = [
  ...POSTHOG_APP_EVENTS,
  ...POSTHOG_IDENTITY_EVENTS
];

/**
 * Closed property lists for events whose contract is a fixed set of keys.
 * `before_send` strips every other property from these events before they
 * leave the browser — the SDK's own `$` fields, super properties persisted by
 * older builds, anything — so PostHog receives the contract and nothing else.
 * Events not listed here are left untouched.
 *
 * `$set` and `$set_once` are not listed here and do not need to be: they are
 * kept on every closed event through POSTHOG_PERSON_PROPERTY_KEYS, and PostHog
 * strips them from the stored event itself, so they never widen the contract.
 */
export const POSTHOG_EVENT_PROPERTY_ALLOWLIST: Record<string, string[]> = {
  user_login: ['site_identifier', 'is_first_login', 'timestamp', 'last_login_at']
};

/**
 * Keys PostHog's ingestion needs to attribute an event to the right person and
 * session, kept even on a closed event. `$geoip_disable` is set by
 * `before_send` so the server does not add `$geoip_*` back after the strip.
 */
export const POSTHOG_INGEST_PROPERTY_KEYS: string[] = [
  'distinct_id',
  'token',
  '$lib',
  '$lib_version',
  '$insert_id',
  '$device_id',
  '$session_id',
  '$window_id',
  '$user_id',
  '$time',
  '$timestamp',
  '$process_person_profile',
  '$is_identified',
  '$sesid',
  '$geoip_disable'
];
