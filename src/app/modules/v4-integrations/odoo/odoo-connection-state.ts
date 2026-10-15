import { signal } from '@angular/core';

/**
 * Live connection state for Odoo, written by V4OdooSettingsComponent and the
 * connect modal, and read by V4IntegrationPanelComponent so the Overview tab's
 * "Connect" button can hide as soon as a connection is confirmed — without
 * waiting for the parent integrations page to refresh its cached status.
 *
 * `null` means "no override; fall back to app.isConnected from the parent".
 */
export const odooConnectedOverride = signal<boolean | null>(null);
