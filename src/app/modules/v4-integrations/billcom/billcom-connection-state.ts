import { signal } from '@angular/core';

/**
 * Trigger counter incremented by V4IntegrationPanelComponent when the user
 * clicks "Connect Bill.com" from the Overview tab. V4BillcomSettingsComponent
 * watches this and opens its connect modal in response, so the modal can be
 * launched from outside the settings component.
 */
export const billcomConnectModalTrigger = signal(0);

/**
 * Live connection state for Bill.com, written by V4BillcomSettingsComponent
 * and read by V4IntegrationPanelComponent so the Overview tab's "Connect"
 * button can hide as soon as the settings tab confirms a connection.
 *
 * `null` means "no override; fall back to app.isConnected from the parent".
 */
export const billcomConnectedOverride = signal<boolean | null>(null);
