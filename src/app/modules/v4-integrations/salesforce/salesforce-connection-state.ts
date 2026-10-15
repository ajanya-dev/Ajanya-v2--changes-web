import { signal } from '@angular/core';

/**
 * Live connection state for Salesforce, written by V4SalesforceSettingsComponent
 * and read by V4IntegrationPanelComponent so the Overview tab's "Connect" button
 * can hide as soon as the settings tab confirms a connection — without
 * waiting for the parent integrations page to refresh its cached status.
 *
 * `null` means "no override; fall back to app.isConnected from the parent".
 */
export const salesforceConnectedOverride = signal<boolean | null>(null);
