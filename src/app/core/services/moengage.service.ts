import { Injectable, inject, OnDestroy, ErrorHandler, signal } from '@angular/core';
import { environment } from 'src/environments/environment';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { ScriptService } from 'src/app/core/services/script.service';
import { Subscription } from 'rxjs';

/**
 * Service for tracking events in MoEngage analytics
 */
@Injectable({
  providedIn: 'root'
})
export class MoEngageService implements OnDestroy {
  private localStorageService = inject(LocalStorageService);
  private errorHandler = inject(ErrorHandler);
  private scriptService = inject(ScriptService);
  private subscriptions: Subscription[] = [];

  bankInitiatedTime = signal<string | null>(null);

  /**
   * Resolves once MoEngage has emitted SDK_INITIALIZATION_COMPLETED. Delegates
   * to ScriptService so both services gate on the same lifecycle signal rather
   * than mere presence of the window.Moengage queue stub.
   * @returns Promise resolving true when MoEngage is fully initialized.
   */
  private isMoEngageReady(): Promise<boolean> {
    return this.scriptService.whenMoEngageReady();
  }

  /**
   * Gets the MoEngage instance
   * @returns MoEngage instance or undefined
   */
  private getMoEngageInstance(): any {
    return (window as any).Moengage;
  }

  private getCommonTrackingProperties(): {
    user_id: number;
    org_id?: string;
    org_name?: string;
    ts: string;
    site_identifier: string;
    platform: string;
  } | null {
    const userId = this.localStorageService.getItem('parentUserId')
      || this.localStorageService.getItem('userId');
    if (!userId) {
      return null;
    }

    const orgId =this.localStorageService.getItem('activeCompanyId') || this.localStorageService.getItem('moeOrgId')
    const orgName = this.localStorageService.getItem('activeCompanyName') || this.localStorageService.getItem('moeCompanyName');
    const siteIdentifier =
      environment.env_id === 'zilMoney' ? 'ZM' : 'OCW';

    return {
      user_id: userId,
      ...(orgId && { org_id: orgId }),
      ...(orgName && { org_name: orgName }),
      ts: this.getMoengageTimestamp(),
      site_identifier: siteIdentifier,
      platform: 'web'
    };
  }

  /**
   * Provides MoEngage compatible timestamp in ISO 8601 format
   * @returns ISO 8601 formatted timestamp string (e.g., "2020-05-31T16:33:35.123Z")
   */
  private getMoengageTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Tracks an event in MoEngage analytics
   * @param eventName - The name of the event
   * @param eventData - Additional data associated with the event
   */
  async trackEvent(eventName: string, eventData: Record<string, any> = {}): Promise<void> {
    if (
      !environment.production ||
      !environment?.ocw_trackers?.moEngage?.enabled ||
      !eventName
    ) {
      return;
    }

    if (!(await this.isMoEngageReady())) {
      return;
    }

    try {
      const commonProps = this.getCommonTrackingProperties();
      if (!commonProps) {
        return;
      }

      const moengageInstance = this.getMoEngageInstance();
      const eventDataWithCommon = {
        ...commonProps,
        ...eventData
      };
      moengageInstance?.track_event(eventName, eventDataWithCommon);
    } catch (error) {
      this.errorHandler.handleError(
        new Error(`MoEngageService: Error tracking event - ${error}`)
      );
    }
  }

  trackRegistrationSuccess(params: {
    email_hash: string;
    signup_source: string;
    registration_method: string;
    is_integration_signup: boolean;
    referral_code: string | null;
  }): void {
    this.trackEvent('register_success', {
      ...params
    });
  }

  trackUserLogin(params: {
    login_method: string;
    user_type: 'new_user' | 'existing_user';
    is_verified: boolean;
    is_two_factor_enabled: boolean;
    device_type: string;
    login_count: number | null;
    days_since_last_login: number | null;
  }): void {
    this.trackEvent('user_login', {
      ...params
    });
  }

  trackFeatureList(params: {
    features_needed: string[];
    total_features_selected: number;
    primary_feature: string;
    selection_duration_seconds: number;
    is_changed_selection:boolean;
  }): void {
    this.trackEvent('onboarding_selected_features', {
      ...params
    });
  }

  trackTrialPeriodStarted(params: {
    trial_start_date: string;
    trial_end_date: string;
    trial_duration_days: number;
    plan_type: string;
    trigger_point: string;
  }): void {
    this.trackEvent('trial_period_started', {
      ...params
    });
  }

  trackBankInitiation(params: {
    bank_add_method: 'instant' | 'manual';
    is_first_bank_attempt: boolean;
    bank_count_before: number;
  }): void {
    this.trackEvent('bank_setup_initiated', {
      ...params
    });
  }

  trackBusinessVerificationInitiated(params:{
    verification_type: string;
    is_first_attempt: boolean;
    attempt_number: number;
    persona_inquiry_id: string;
  }): void {
    this.trackEvent('business_verification_initiated', {
      ...params
    });
  }

  trackBankSetupAbandoned(params: {
    setup_duration_seconds: number;
    abandonment_reason: string;
    bank_selected: string | null;
    steps_completed: number;
    error_code: string | null;
    bank_selected_type: string | null;
    bank_add_method: 'instant' | 'manual';
  }): void {
    this.trackEvent('bank_setup_abandoned', {
      ...params
    });
  } 

  trackBusinessVerificationSubmitted(params:{
    verification_type: string;
    persona_inquiry_id: string;
    persona_status: string;
    form_duration_seconds: number;
    attempt_number: number;
    documents_submitted: number;
    is_resubmission: boolean;
  }): void {
    this.trackEvent('business_verification_submitted', {
      ...params
    });
  }

  trackWalletPaymentInitiation(params: {
    transaction_type: 'wallet_funding' | 'withdrawal' | 'internal_transfer';
    is_first_attempt: boolean;
    bank_count: number;
  }): void {
    this.trackEvent('transaction_initiated', {
      ...params
    });
  }

  trackTransactionSubmitted(params: {
    transaction_type: 'wallet_funding' | 'withdrawal' | 'internal_transfer';
    amount: string;
    currency: string;
    funding_method: 'ach' | 'wire' | 'other';
    form_duration_seconds: number;
    wallet_balance_before: string | null;
    bank_account_id: string | null;
    source_wallet_id: string | null;
    destination_wallet_id: string | null;
    is_first_transaction: boolean;
  }): void {
    this.trackEvent('transaction_submitted', {
      ...params
    });
  }

  trackTransactionAbandoned(params: {
    transaction_type: 'wallet_funding' | 'withdrawal' | 'internal_transfer';
    form_duration_seconds: number;
    amount_entered: string;
    funding_method: 'ach' | 'wire' | 'unknown';
    exit_step: 'amount_entry' | 'method_selection' | 'review_confirm' | 'unknown';
    exit_reason: 'user_exit' | 'session_expired' | 'error' | 'otp_verification';
    bank_account_id: string | null;
  }): void {
    this.trackEvent('transaction_abandoned', {
      ...params
    });
  }

  trackBusinessVerificationAbandoned(params:{
    verification_type: string;
    persona_inquiry_id: string;
    form_duration_seconds: number;
    attempt_number: number;
    abandonment_reason: string;
    exit_page: string;
  }): void {
    this.trackEvent('business_verification_abandoned', {
      ...params
    });
  }

  /**
   * Helper to map payment method to product_key
   * @param sourceType Payment source type
   * @param transferTypeCode Payment transfer type
   * @returns Product key for tracking
   */
  getProductKeyFromPayment(
    sourceType: string,
    transferTypeCode: string
  ): string {
    const productKeyMap: Record<string, string> = {
      check: 'check_print',
      checkMail: 'check_mail',
      ach: 'ach',
      wire: 'wire',
      internationalWire: 'wire',
      virtualCard: 'virtual_card',
      rtp: 'rtp',
      'same-ach': 'ach',
      check_print: 'check_print',
      check_email: 'echeck',
      'international-payment': 'wire'
    };

    return productKeyMap[transferTypeCode] || 'echeck';
  }

  /**
   * Helper to get rail from source and transfer type
   * @param sourceType Payment source type
   * @param transferTypeCode Payment transfer type
   * @returns Rail type for tracking
   */
  getRailFromPayment(sourceType: string, transferTypeCode: string): string {
    if (sourceType === 'WALLET' && transferTypeCode === 'ach') {
      return 'wallet_to_wallet';
    }

    if (sourceType === 'CARD') {
      return 'card_rail';
    }

    const railMap: Record<string, string> = {
      ach: 'ach',
      wire: 'wire',
      internationalWire: 'wire',
      rtp: 'rtp',
      check: 'check',
      checkMail: 'check',
      virtualCard: 'virtual_card',
      'same-ach': 'ach',
      check_email: 'check',
      'international-payment': 'wire'
    };

    return railMap[transferTypeCode] || 'ach';
  }

  amountToNotionalValue(amount: number): string {
    if (amount >= 0 && amount < 1000) {
      return 'Category A';
    } if (amount >= 1000 && amount < 5000) {
      return 'Category B';
    } if (amount >= 5000 && amount < 10000) {
      return 'Category C';
    } if (amount >= 10000 && amount < 50000) {
      return 'Category D';
    } 
      return 'Category E';
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
