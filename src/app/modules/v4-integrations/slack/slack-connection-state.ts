import { signal } from '@angular/core';

/**
 * Writable signal that the Slack settings component publishes so the
 * panel Overview tab can reflect a fresh connection state without waiting
 * for the parent integrations page to re-fetch.
 *
 * `null` = no override (use the value from the parent page).
 */
export const slackConnectedOverride = signal<boolean | null>(null);
