import { signal } from '@angular/core';

/**
 * Live connection state for QuickBooks Payroll, written by
 * V4QuickbooksPayrollSettingsComponent and read by V4IntegrationPanelComponent
 * so the Overview tab's "Connect" button reflects a connection without waiting
 * for the parent integrations page to refresh its cached status.
 *
 * `null` means "no override; fall back to app.isConnected from the parent".
 */
export const quickbooksPayrollConnectedOverride = signal<boolean | null>(null);
