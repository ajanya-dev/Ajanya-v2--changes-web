import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef
} from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { catchError, debounceTime, finalize, of, tap } from 'rxjs';
import { IBankData } from 'src/app/models/bank';
import { Provider } from 'src/app/shared/yodlee/components/connect-your-bank/yodlee-bank-model';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { MicroDepositModalV4Component } from 'src/app/modules/user/user-v4/modals/micro-deposit-modal-v4/micro-deposit-modal-v4.component';
import { CommonOnInitService } from 'src/app/shared/service/common-onInit/common-on-init.service';
import { VerificationMessageService } from 'src/app/shared/service/auth/verification-message.service';

export interface VerifyInstantlyModalData {
  bankData: IBankData;
}

type ModalStep = 'connect' | 'success' | 'error';

@Component({
  selector: 'app-verify-instantly-modal-v4',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, CommonButtonV4Component, ReactiveFormsModule],
  template: `
    <div class="verify-modal-container">
      <!-- Header -->
      <div
        class="flex justify-between px-6 py-4 bg-v4-secondary-background-color border-b border-v4-border-color"
      >
        <div class="flex flex-col">
          <h1
            class="text-xl font-semibold text-v4-main-text-color font-funnel m-0"
          >
            Verify Instantly
          </h1>
          <h2 class="text-xs text-v4-subtle-text-color m-0">
            @if (step() === 'connect') {
              Connect your bank to verify your account
            } @else if (step() === 'success') {
              Verification complete
            } @else {
              Verification failed
            }
          </h2>
        </div>
        <button
          (click)="close()"
          class="w-9 h-9 rounded-lg hover:bg-v4-tertiary-background-color cursor-pointer flex justify-center items-center border-0 bg-transparent"
        >
          <lucide-icon name="x" [size]="18" class="text-v4-subtle-text-color" />
        </button>
      </div>

      <!-- Step indicators -->
      @if (step() !== 'error') {
        <div
          class="flex border-b border-v4-border-color bg-v4-secondary-background-color"
        >
          <button
            class="step-tab flex-1 py-3 text-xs font-medium border-0 bg-transparent cursor-default"
            [class.step-active]="step() === 'connect'"
            [class.step-completed]="step() === 'success'"
          >
            <span class="step-number">1</span>
            Connect Bank
          </button>
          <button
            class="step-tab flex-1 py-3 text-xs font-medium border-0 bg-transparent cursor-default"
            [class.step-active]="step() === 'success'"
          >
            <span class="step-number">2</span>
            Finish
          </button>
        </div>
      }

      <!-- Body -->
      <div class="modal-body bg-v4-tertiary-background-color font-peridot">
        @if (step() === 'connect') {
          @if (!isBankSelected()) {
            <!-- Bank search & selection -->
            <div class="p-6">
              <p class="text-sm text-v4-secondary-text-color mb-4">
                Select your bank account from the list below and login with your
                bank credentials.
              </p>

              <!-- Search input -->
              <div class="mb-4">
                <div
                  class="flex items-center gap-2 px-3 py-2 rounded-lg border border-v4-border-color bg-v4-primary-background-color"
                >
                  <lucide-icon
                    name="search"
                    [size]="16"
                    class="text-v4-subtle-text-color flex-shrink-0"
                  />
                  <input
                    [formControl]="searchControl"
                    type="search"
                    maxlength="70"
                    placeholder="Search for your bank or institution"
                    (input)="removeWhitespace($event)"
                    class="w-full border-0 bg-transparent text-sm text-v4-main-text-color outline-none placeholder:text-v4-subtle-text-color"
                  />
                </div>
              </div>

              <!-- Bank list -->
              <div
                class="bank-list-container"
                [class.opacity-30]="searching()"
                [class.pointer-events-none]="searching()"
              >
                @if (!isSearchResult()) {
                  <!-- Grid view for popular banks -->
                  <div class="grid grid-cols-3 gap-3">
                    @for (bank of yodleeBanks(); track bank.id) {
                      <button
                        class="bank-grid-item"
                        (click)="onSelectBank(bank.id)"
                      >
                        <img
                          [src]="bank.logo"
                          [alt]="bank.name"
                          class="max-h-8 max-w-full object-contain"
                        />
                      </button>
                    }
                  </div>
                } @else {
                  <!-- List view for search results -->
                  <div class="flex flex-col">
                    @for (bank of yodleeBanks(); track bank.id) {
                      <button
                        class="bank-list-item"
                        (click)="onSelectBank(bank.id)"
                      >
                        <img
                          [src]="bank.favicon"
                          [alt]="bank.name"
                          class="w-5 h-5 flex-shrink-0 object-contain"
                        />
                        <div class="flex flex-col min-w-0">
                          <span
                            class="text-sm font-medium text-v4-main-text-color truncate"
                            >{{ bank.name }}</span
                          >
                          <span
                            class="text-xs text-v4-subtle-text-color truncate"
                            >{{ bank.baseUrl }}</span
                          >
                        </div>
                      </button>
                    } @empty {
                      @if (!searching() && !isChangedSearchValue()) {
                        <div class="text-sm text-v4-subtle-text-color py-4">
                          <span>We didn't find any result for</span>
                          <span class="pl-1 font-medium text-v4-main-text-color"
                            >"{{ searchControl.value }}"</span
                          >
                          <br />
                          <span
                            >You may need to search for a different financial
                            institution.</span
                          >
                        </div>
                      }
                    }
                  </div>
                }
              </div>

              @if (searching()) {
                <div class="flex justify-center py-6">
                  <lucide-icon
                    name="loader-circle"
                    [size]="24"
                    class="text-v4-subtle-text-color spin-animation"
                  />
                </div>
              }
            </div>
          } @else {
            <!-- Yodlee iframe -->
            <div class="iframe-container">
              @if (urlSafe()) {
                <iframe
                  class="w-full h-full border-0"
                  [src]="urlSafe()"
                  (load)="onIframeLoad()"
                ></iframe>
              }
              @if (!iframeLoaded()) {
                <div
                  class="absolute inset-0 flex items-center justify-center bg-v4-tertiary-background-color"
                >
                  <lucide-icon
                    name="loader-circle"
                    [size]="32"
                    class="text-v4-subtle-text-color spin-animation"
                  />
                </div>
              }
            </div>
          }
        } @else if (step() === 'success') {
          <div class="text-center py-12 px-6">
            <div
              class="w-20 h-20 bg-v4-badge-success-bg-color rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <lucide-icon
                name="check-circle-2"
                [size]="48"
                class="text-v4-badge-success-text-color"
              />
            </div>
            <h3
              class="text-2xl font-bold text-v4-main-text-color mb-2 font-funnel"
            >
              Congratulations!
            </h3>
            <p class="text-sm text-v4-secondary-text-color mb-2">
              Your bank account has been verified successfully.
            </p>
            <p class="text-xs text-v4-subtle-text-color mb-6">
              Your bank account is now verified and ready for transactions.
            </p>
            <app-common-button-v4
              [type]="{ style: 'primary', name: 'main' }"
              [text]="'Done'"
              (clickEvent)="closeAfterSuccess()"
            />
          </div>
        } @else if (step() === 'error') {
          <div class="text-center py-12 px-6">
            <div
              class="w-20 h-20 bg-v4-badge-error-bg-color rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <lucide-icon
                name="x"
                [size]="48"
                class="text-v4-badge-error-text-color"
              />
            </div>
            <h3
              class="text-2xl font-bold text-v4-main-text-color mb-2 font-funnel"
            >
              Oops!
            </h3>
            <p class="text-sm text-v4-secondary-text-color mb-2">
              We couldn't verify your bank account
            </p>
            <p class="text-xs text-v4-subtle-text-color mb-6">
              @if (errorMessage()) {
                {{ errorMessage() }}
              } @else {
                Sorry we couldn't verify your bank account online with the given
                data. Please try verifying the bank account manually.
              }
            </p>
            <div class="flex justify-center gap-3">
              <app-common-button-v4
                [type]="{ style: 'outline', name: 'main' }"
                [text]="'Verify Manually'"
                (clickEvent)="verifyManually()"
              />
              <app-common-button-v4
                [type]="{ style: 'primary', name: 'main' }"
                [text]="'Retry'"
                (clickEvent)="retry()"
              />
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .verify-modal-container {
        display: flex;
        flex-direction: column;
        max-height: 80vh;
      }

      .modal-body {
        flex: 1;
        overflow-y: auto;
        min-height: 300px;
      }

      .step-tab {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        color: var(--v4-subtle-text-color);
        transition: all 0.2s ease;
      }

      .step-tab.step-active {
        color: var(--v4-common-blue-color);
        border-bottom: 2px solid var(--v4-common-blue-color);
      }

      .step-tab.step-completed {
        color: var(--v4-common-green-color);
      }

      .step-number {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        font-size: 11px;
        font-weight: 600;
        border: 1.5px solid currentColor;
      }

      .step-active .step-number {
        background-color: var(--v4-common-blue-color);
        border-color: var(--v4-common-blue-color);
        color: white;
      }

      .step-completed .step-number {
        background-color: var(--v4-common-green-color);
        border-color: var(--v4-common-green-color);
        color: white;
      }

      .bank-grid-item {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 60px;
        padding: 8px;
        border-radius: 8px;
        border: 1px solid var(--v4-border-color);
        background-color: var(--v4-primary-background-color);
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .bank-grid-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        border-color: var(--v4-common-blue-color);
      }

      .bank-list-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        border: none;
        border-bottom: 1px solid var(--v4-border-color);
        background: transparent;
        cursor: pointer;
        text-align: left;
        transition: background-color 0.15s ease;
      }

      .bank-list-item:hover {
        background-color: var(--v4-badge-neutral-bg-color);
      }

      .bank-list-item:last-child {
        border-bottom: none;
      }

      .bank-list-container {
        max-height: 300px;
        overflow-y: auto;
      }

      .iframe-container {
        position: relative;
        height: 480px;
      }

      .spin-animation {
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `
  ]
})
export class VerifyInstantlyModalV4Component implements OnInit {
  private dialogRef = inject(
    MatDialogRef<VerifyInstantlyModalV4Component>
  );
  private modalData: VerifyInstantlyModalData = inject(MAT_DIALOG_DATA);
  private dialog = inject(MatDialog);
  private sanitizer = inject(DomSanitizer);
  private bankAccService = inject(BankAccountsService);
  private headerService = inject(HeaderService);
  private localStorageService = inject(LocalStorageService);
  private alertService = inject(V4AlertService);
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private destroyRef = inject(DestroyRef);
  private commonOnInitService = inject(CommonOnInitService);
  private verificationMessageService = inject(VerificationMessageService);

  step = signal<ModalStep>('connect');
  errorMessage = signal<string | null>(null);

  // Bank search
  searchControl = new FormControl('');
  yodleeBanks = signal<Provider[]>([]);
  isSearchResult = signal(false);
  searching = signal(false);
  isChangedSearchValue = signal(false);

  // Iframe
  isBankSelected = signal(false);
  urlSafe = signal<SafeResourceUrl | null>(null);
  iframeLoaded = signal(false);

  private yodleeUrl = '';
  private uuId = '';

  ngOnInit(): void {
    if (!this.isEmailAndPhoneVerified()) {
      const ref = this.alertService.warningAlert({
        content: this.verificationMessageService.getVerificationMessage(),
        doneMsg: 'Verify Now',
        isCancel: true,
        cancelMsg: 'Cancel'
      });
      ref.afterClosed().subscribe((res) => {
        if (res) {
          this.dialogRef.close();
          this.commonOnInitService.openEmailPhoneVerificationModal();
        } else {
          this.dialogRef.close();
        }
      });
      return;
    }

    this.getUrl();
    this.loadInitialBanks();
    this.setupSearchListener();
  }

  private isEmailAndPhoneVerified(): boolean {
    const verificationDetails =
      this.localStorageService.getItem('gettingStartedData');
    return verificationDetails?.verification !== 0;
  }

  /** Fetch Yodlee iframe base URL */
  private getUrl(): void {
    const bankData = this.modalData.bankData;
    const routingNumber =
      bankData.bank_routing_number || (bankData as any).routingNumber || '';
    const bankName =
      bankData.bank_name || (bankData as any).bankName || '';

    const data = {
      routingNumber,
      verifyType: 1,
      k: bankName,
      pk: bankData.pk
    };

    this.bankAccService
      .instantVerification(data)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((err) => {
          if (!err?.error?.success) {
            this.alertService.warningAlert({
              content: err?.error?.errorMsg || 'Verification failed'
            });
            this.dialogRef.close();
          }
          return of(null);
        })
      )
      .subscribe((res) => {
        if (res) {
          this.yodleeUrl = res.url;
        }
      });
  }

  /** Load initial popular banks */
  private loadInitialBanks(): void {
    this.searching.set(true);
    this.bankAccService
      .getYodleeBanks('initial')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.searching.set(false);
          this.isChangedSearchValue.set(false);
        })
      )
      .subscribe({
        next: (res) => {
          this.isSearchResult.set(false);
          if (res?.success && res.data?.provider) {
            const providers = res.data.provider.slice(0, 13);
            providers.splice(11, 1);
            this.yodleeBanks.set(providers);
          } else {
            this.yodleeBanks.set([]);
          }
        }
      });
  }

  /** Setup debounced search listener */
  private setupSearchListener(): void {
    this.searchControl.valueChanges
      .pipe(
        tap(() => this.isChangedSearchValue.set(true)),
        debounceTime(500),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((value) => {
        if (value && value.length === 1 && value === ' ') return;
        this.searching.set(true);
        if (value && value.length > 0) {
          this.searchBanks(value);
        } else {
          this.loadInitialBanks();
        }
      });
  }

  /** Search banks by term */
  private searchBanks(term: string): void {
    this.bankAccService
      .getYodleeBanks('search', term)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.searching.set(false);
          this.isChangedSearchValue.set(false);
        })
      )
      .subscribe({
        next: (res) => {
          this.isSearchResult.set(true);
          if (res?.success && res.data?.provider) {
            this.yodleeBanks.set(res.data.provider);
          } else {
            this.yodleeBanks.set([]);
          }
        }
      });
  }

  /** Select a bank and load Yodlee iframe */
  onSelectBank(id: number): void {
    if (!this.yodleeUrl) return;
    this.urlSafe.set(
      this.sanitizer.bypassSecurityTrustResourceUrl(
        `${this.yodleeUrl}&provider_id=${id}`
      )
    );
    this.iframeLoaded.set(false);
    this.isBankSelected.set(true);
  }

  onIframeLoad(): void {
    this.iframeLoaded.set(true);
  }

  /** Handle PostMessage from Yodlee iframe */
  @HostListener('window:message', ['$event'])
  onMessage(e: MessageEvent): void {
    if (
      !['https://ocwapi.com', 'https://staging.ocwapi.com/'].includes(e.origin)
    ) {
      return;
    }

    // User closed Yodlee window
    if (
      Object.prototype.hasOwnProperty.call(e.data, 'status') &&
      e.data.status === 'USER_CLOSE_ACTION'
    ) {
      this.isBankSelected.set(false);
      return;
    }

    if (e.data.success === true && e.data.session_token !== '') {
      this.uuId = e.data.session_token;
      this.getVerifiedBankAccounts();
    } else {
      this.step.set('error');
    }
  }

  /** Verify bank accounts after Yodlee returns session token */
  private getVerifiedBankAccounts(): void {
    this.bankAccService
      .yodleeGetBankDetails(this.uuId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.step.set('error');
          return of(null);
        })
      )
      .subscribe((res) => {
        if (res?.data) {
          this.checkAccountExist(res.data);
        }
      });
  }

  /** Check if verified account matches the bank account number */
  private checkAccountExist(data: any): void {
    let accountsArray: any[] = [];

    if (data.verified) {
      const verifiedAccounts = data.verifiedAccounts;
      accountsArray = Object.keys(verifiedAccounts).map(
        (key) => verifiedAccounts[key]
      );
    } else if (data.bankAccounts) {
      accountsArray = data.bankAccounts;
    }

    if (accountsArray.length > 0) {
      const match = accountsArray.find(
        (account: any) =>
          account.accountNumber ===
          this.modalData.bankData.bank_account_account_number
      );

      if (match) {
        this.onVerificationSuccess();
      } else {
        this.errorMessage.set(
          "We couldn't find your account in your bank. Please check your account number and try again."
        );
        this.step.set('error');
      }
    }
  }

  /** Handle successful verification */
  private onVerificationSuccess(): void {
    this.step.set('success');
    this.bankAccService.bancAcEvents.next({
      message: 'Bank Account Verified'
    });
    this.headerService.refreshDynamicHeader.next(true);
    this.v3DataTableService.refreshV3DataTable();
    this.dataTableService.setRefreshStatus(true);

    const gettingStarted =
      this.localStorageService.getItem('gettingStartedData');
    if (gettingStarted) {
      gettingStarted.bankAccount = 2;
      this.localStorageService.setItem('gettingStartedData', gettingStarted);
    }
  }

  /** Trim leading whitespace from search input */
  removeWhitespace(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cleaned = input.value.replace(/^\s+/, '');
    input.value = cleaned;
    this.searchControl.setValue(cleaned, { emitEvent: false });
  }

  retry(): void {
    this.step.set('connect');
    this.errorMessage.set(null);
    this.isBankSelected.set(false);
    this.iframeLoaded.set(false);
    this.urlSafe.set(null);
    this.loadInitialBanks();
    this.getUrl();
  }

  verifyManually(): void {
    this.dialogRef.close();
    this.dialog
      .open(MicroDepositModalV4Component, {
        maxWidth: '510px',
        width: '100%',
        disableClose: true,
        autoFocus: false,
        data: this.modalData.bankData
      })
      .afterClosed()
      .subscribe(() => {
        this.v3DataTableService.refreshV3DataTable();
        this.dataTableService.setRefreshStatus(true);
      });
  }

  closeAfterSuccess(): void {
    this.dialogRef.close({ success: true });
  }

  close(): void {
    this.dialogRef.close();
  }
}
