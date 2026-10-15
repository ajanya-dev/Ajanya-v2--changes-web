import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Inject,
  ViewEncapsulation,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  type AbstractControl,
  type FormControl,
  type FormGroup
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { Subject, debounceTime, finalize } from 'rxjs';
import {
  Check,
  Info,
  LoaderCircle,
  LucideAngularModule,
  Plus,
  RefreshCw
} from 'lucide-angular';

import type { IReceiveCheckDetails } from 'src/app/modules/receive-payments/model/ReceivePayment';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { V4DatePickerComponent } from 'src/app/shared/V4/v4-date-picker/v4-date-picker.component';
import { CheckPreviewV4Component } from 'src/app/shared/V4/for-side-drawer/check-preview-v4/check-preview-v4.component';
import { V4SignatureUploadPanelComponent } from 'src/app/modules/payments-v4/send-payment/components/modals/signature-upload-panel/v4-signature-upload-panel.component';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { CheckDesignService } from 'src/app/shared/service/check-design/check-design.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { Utils } from 'src/app/data/utils';
import { BankCheckService } from '../../bank/services/bank-check.service';
import { buildCheckPreviewPayload } from '../../shared/services/payment-confirm.service';
import { SendStateService } from '../../shared/services/send-state.service';

export interface ICheckDetailsModalData {
  form: FormGroup;
  payeeName: string;
  amount: string;
}

@Component({
  selector: 'app-check-details-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    MatTooltip,
    CommonInputFieldV4Component,
    V4ControlMessageComponent,
    V4DatePickerComponent,
    CheckPreviewV4Component
  ],
  templateUrl: './check-details-modal.component.html',
  styleUrl: './check-details-modal.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckDetailsModalComponent {
  readonly RefreshIcon = RefreshCw;
  readonly InfoIcon = Info;
  readonly CheckIcon = Check;
  readonly PlusIcon = Plus;
  readonly LoaderIcon = LoaderCircle;

  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly alertService = inject(V4AlertService);
  private readonly checkService = inject(CheckService);
  private readonly checkDesignService = inject(CheckDesignService);
  private readonly bankAccountService = inject(BankAccountsService);
  private readonly sendStateService = inject(SendStateService);
  private readonly bankCheckService = inject(BankCheckService);

  readonly isBankSource = this.sendStateService.sourceId() === 'bankaccount';
  readonly isWalletSource = this.sendStateService.sourceId() === 'wallet';

  /**
   * Print is the one check method where the payee email is optional — the wallet
   * form gives it `optionalEmail` there and `requiredEmail` everywhere else
   * (wallet-payment.service `applyMethodValidators`). The marker follows suit.
   */
  readonly emailRequired = computed(
    () => this.sendStateService.methodId() !== 'check_print'
  );

  readonly checkPreviewResp = signal<Record<string, any> | null>(null);
  readonly checkPreviewLoading = signal(false);
  readonly previewFormTick = signal(0);

  readonly bankHasSignature = signal<boolean | null>(null);
  readonly signatureBusy = signal(false);
  private readonly bankEncryptedId = signal<string | null>(null);
  private lastSignatureBankId: string | null = null;
  private readonly designSettled = signal(false);
  private readonly previewSettled = signal(false);

  readonly signatureResolved = computed(
    () => this.hasSignature() || (this.designSettled() && this.previewSettled())
  );

  private readonly previewTrigger$ = new Subject<void>();

  constructor(
    private readonly ref: MatDialogRef<CheckDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) readonly data: ICheckDetailsModalData
  ) {
    const bump = () => this.previewFormTick.update((n) => n + 1);

    for (const name of ['checkNumber', 'issueDate', 'memo']) {
      this.control(name)
        ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(bump);
    }
    this.sendStateService.coreForm.controls.amount.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(bump);

    // Every source draws a cheque, so every source fetches one. The controls a
    // card and a wallet do not have are simply absent here, not a reason to
    // skip the fetch — which is what left their preview blank.
    this.previewTrigger$
      .pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadCheckPreview());

    const push = () => this.previewTrigger$.next();
    for (const name of [
      'checkNumber',
      'issueDate',
      'memo',
      'noAmount',
      'noSign',
      'noPayee',
      'noDate'
    ]) {
      this.control(name)
        ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(push);
    }
    this.sendStateService.coreForm.controls.amount.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(push);

    // The signature lives on the bank account, so only that rail has one to ask
    // about.
    if (this.isBankSource) {
      this.loadSignatureStatus();
    }

    bump();
    this.previewTrigger$.next();
  }

  get form(): FormGroup {
    return this.data.form;
  }

  control(name: string): FormControl | null {
    return (this.data.form.controls[name] as FormControl) ?? null;
  }

  asControl(name: string): AbstractControl | undefined {
    return this.data.form.controls[name] ?? undefined;
  }

  closeCheckModal(): void {
    this.ref.close();
  }

  showScheduleDate(): boolean {
    return (
      this.isBankSource &&
      this.bankCheckService.isScheduled() &&
      !!this.control('scheduleDate')
    );
  }

  getMinScheduleDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  /** Whatever the preview was drawn from says about a signature. */
  private previewHasSignature(): boolean {
    const tpl = this.checkPreviewResp()?.['design']?.templateSignature;
    return typeof tpl === 'string' ? tpl.trim().length > 0 : !!tpl;
  }

  /**
   * Either source seeing one is enough. They are keyed differently — the design
   * endpoint by the account's encrypted id, the preview by whatever the payment
   * is drawn on — so a lookup that missed answers the same as an account with no
   * signature, and the cheque on screen was signed while the warning beside it
   * said it could not be sent.
   */
  hasSignature(): boolean {
    if (this.previewHasSignature()) {
      return true;
    }
    return this.bankHasSignature() ?? false;
  }

  readonly checkPreviewData = computed<IReceiveCheckDetails | null>(() => {
    this.previewFormTick();
    const f = this.data.form.getRawValue() as Record<string, any>;
    const info = this.sendStateService.payeeDetails()?.payee_information;
    const amount = this.sendStateService.coreForm.controls.amount.value ?? '';
    const formAddress = [
      info?.payee_address_line_1,
      info?.payee_city,
      info?.payee_state,
      info?.payee_zip
    ]
      .map((part) => (part ?? '').trim())
      .filter(Boolean)
      .join(', ');
    const formPayeeName =
      info?.payee_nick_name || info?.payee_name || this.data.payeeName || '';

    const resp = this.checkPreviewResp();
    const resolved = resp?.['resolved'];
    const design = resp?.['design'];

    if (resp && resolved) {
      const rp = resolved.payee ?? {};
      return {
        chequeSerialNumber: String(resolved.serialNo ?? f['checkNumber'] ?? ''),
        chequeIssueDate: resolved.issueDate ?? f['issueDate'] ?? '',
        chequeAmount: String(resolved.amount ?? amount),
        chequeMemo: resolved.memo ?? f['memo'] ?? '',
        address: rp.addressOneLine ?? formAddress,
        payeeName: rp.name ?? formPayeeName,
        payeeAddressLine1: rp.addressLine1 ?? info?.payee_address_line_1 ?? '',
        payeeZip: rp.zip ?? info?.payee_zip ?? '',
        bankName: design?.bankName ?? '',
        amounyInWords: resolved.amountInWords ?? ''
      } as unknown as IReceiveCheckDetails;
    }

    return {
      chequeSerialNumber: String(f['checkNumber'] ?? ''),
      chequeIssueDate: f['issueDate'] ?? '',
      chequeAmount: String(amount),
      chequeMemo: f['memo'] ?? '',
      address: formAddress,
      payeeName: formPayeeName,
      payeeAddressLine1: info?.payee_address_line_1 ?? '',
      payeeZip: info?.payee_zip ?? '',
      bankName: '',
      amounyInWords: ''
    } as unknown as IReceiveCheckDetails;
  });

  readonly checkPreviewTemplateJson = computed<string | null>(() => {
    const d = this.checkPreviewResp()?.['design']?.checkDesign;
    if (!d) {
      return null;
    }
    return typeof d === 'string' ? d : JSON.stringify(d);
  });

  refreshCheckPreview(): void {
    // Redraw what the form says, and re-ask for the design behind it. Every
    // source has one; only the bank rail used to fetch it, so the button was a
    // no-op on a card or a wallet.
    this.previewFormTick.update((n) => n + 1);
    this.loadCheckPreview();
  }

  openAddSignature(): void {
    if (this.signatureBusy()) {
      return;
    }
    const encId = this.bankEncryptedId();
    if (!encId) {
      this.alertService.warningAlert({
        content:
          'Unable to load this bank account. Please reselect the account and try again.'
      });
      return;
    }
    this.signatureBusy.set(true);
    this.checkDesignService
      .getCustomRestriction()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (!response?.success) {
            this.signatureBusy.set(false);
            return;
          }
          const dialogRef = this.dialog.open(V4SignatureUploadPanelComponent, {
            maxWidth: '690px',
            width: '93%',
            panelClass: 'paddingless-modal-rounded',
            minHeight: '410px',
            disableClose: true
          });
          dialogRef.afterClosed().subscribe((signImg) => {
            if (!signImg) {
              this.signatureBusy.set(false);
              return;
            }
            this.bankAccountService
              .addSignature(
                encId,
                signImg.existSign ? signImg.existSign : signImg.signatureUrl
              )
              .pipe(
                finalize(() => this.signatureBusy.set(false)),
                takeUntilDestroyed(this.destroyRef)
              )
              .subscribe({
                next: (res) => {
                  if (!res) {
                    return;
                  }
                  this.alertService.successAlert({
                    content: 'Signature added successfully',
                    close: true
                  });
                  this.bankHasSignature.set(true);
                  this.loadSignatureStatus();
                  this.loadCheckPreview();
                },
                error: (err) => {
                  this.alertService.warningAlert({
                    content: err?.error?.errorMsg ?? 'Failed to add signature'
                  });
                }
              });
          });
        },
        error: () => this.signatureBusy.set(false)
      });
  }

  private bankAccountId(): string | undefined {
    return this.sendStateService.coreForm.controls.bankAc.value?.id;
  }

  private loadSignatureStatus(): void {
    if (!this.isBankSource) {
      return;
    }
    const bankId = this.bankAccountId();
    if (!bankId) {
      this.designSettled.set(true);
      return;
    }
    if (bankId !== this.lastSignatureBankId) {
      this.lastSignatureBankId = bankId;
      this.bankHasSignature.set(null);
      this.designSettled.set(false);
    }

    const designId = this.bankEncryptedId() ?? bankId;
    this.checkDesignService
      .getDesign(designId)
      .pipe(
        finalize(() => this.designSettled.set(true)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          const design = res?.data as Record<string, any> | undefined;
          if (design?.['bankAccountId']) {
            this.bankEncryptedId.set(String(design['bankAccountId']));
          }
          const tpl = design?.['templateSignature'];
          this.bankHasSignature.set(
            typeof tpl === 'string' ? tpl.trim().length > 0 : !!tpl
          );
        },
        error: () => this.bankHasSignature.set(null)
      });
  }

  private loadCheckPreview(): void {
    // The cheque is drawn on whichever source is paying, not always a bank
    // account — a card and a wallet each keep their id under their own name.
    const source = this.sendStateService.checkPreviewSource();
    if (!source?.sourceId) {
      this.previewSettled.set(true);
      return;
    }

    const f = this.data.form.getRawValue() as Record<string, any>;
    const rawAmount = this.sendStateService.coreForm.controls.amount.value ?? '';
    const amount = f['noAmount']
      ? undefined
      : Number(String(rawAmount).replace(/[$,]/g, '')) || undefined;

    const serialNo =
      f['checkNumber'] != null ? String(f['checkNumber']) : undefined;

    const payload = buildCheckPreviewPayload({
      ...source,
      payeeId: this.sendStateService.coreForm.controls.payee.value?.id,
      amount,
      issueDate: f['noDate'] ? undefined : this.ymd(f['issueDate']),
      serialNo,
      memo: f['memo'] || undefined,
      processWithout: [
        f['noAmount'] && 'amount',
        f['noPayee'] && 'payee',
        f['noSign'] && 'signature',
        f['noDate'] && 'date'
      ].filter(Boolean) as string[]
    });
    if (!payload) {
      this.previewSettled.set(true);
      return;
    }

    this.checkPreviewLoading.set(true);
    this.checkService
      .getCheckPreviewData(payload)
      .pipe(
        finalize(() => {
          this.checkPreviewLoading.set(false);
          this.previewSettled.set(true);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          const data = (res?.data ?? null) as Record<string, any> | null;
          this.checkPreviewResp.set(data);
          // The preview answers with the id the design endpoint wants, which is
          // not the one the form holds. Keeping it means the signature lookup
          // asks about the right account from here on.
          const encrypted = (data?.['design'] as Record<string, any>)?.[
            'bankAccountId'
          ];
          if (encrypted) {
            this.bankEncryptedId.set(String(encrypted));
          }
        },
        error: () => this.checkPreviewResp.set(null)
      });
  }

  private ymd(value: string | Date | null | undefined): string | undefined {
    if (!value) {
      return undefined;
    }
    return (
      Utils.toLocalYmd(value) ?? (typeof value === 'string' ? value : undefined)
    );
  }
}
