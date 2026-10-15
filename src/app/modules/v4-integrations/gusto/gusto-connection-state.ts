import { signal } from '@angular/core';

/**
 * Live connection state for Gusto, written by V4GustoSettingsComponent and
 * read by V4IntegrationPanelComponent so the Overview tab's "Connect" button
 * can hide as soon as the settings tab confirms a connection — without
 * waiting for the parent integrations page to refresh its cached status.
 *
 * `null` means "no override; fall back to app.isConnected from the parent".
 */
export const gustoConnectedOverride = signal<boolean | null>(null);
