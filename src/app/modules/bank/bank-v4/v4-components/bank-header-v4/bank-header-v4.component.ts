import {
  Component,
  DestroyRef,
  computed,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { MatDialog } from '@angular/material/dialog';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonLayoutToggleV4Service } from 'src/app/shared/service/common/shared/common-layout/common-layout-toggle-v4.service';
import { PositivePayService } from 'src/app/shared/service/positive-pay/positive-pay.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { BankDataV35Service } from 'src/app/modules/bank/bank-v3/v35-services/bank-data-v35.service';
import { UpdatedImportedBanksModalComponent } from 'src/app/modules/bank/bank-v2/modals/updated-imported-banks-modal/updated-imported-banks-modal.component';
import { ImportBankAccountV4Component } from 'src/app/modules/bank/bank-v4/v4-modals/import-bank-account-v4/import-bank-account-v4.component';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { environment } from 'src/environments/environment';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import { IV4HeaderAction } from 'src/app/shared/V4/v4-page-header/v4-page-header.model';

@Component({
  standalone: true,
  selector: 'app-bank-header-v4',
  imports: [
    CommonModule,
    LucideAngularModule,
    MatTooltipModule,
    V4PageHeaderComponent
  ],
  templateUrl: './bank-header-v4.component.html',
  styleUrls: ['./bank-header-v4.component.scss']
})
export class BankHeaderV4Component {
  private commonLayoutToggleV4Service = inject(CommonLayoutToggleV4Service);
  private positivePayService = inject(PositivePayService);
  private alertService = inject(V4AlertService);
  private bankDataService = inject(BankDataV35Service);
  private bankAccountService = inject(BankAccountsService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private breakpointObserver = inject(BreakpointObserver);
  private destroyRef = inject(DestroyRef);

  isGridView = this.commonLayoutToggleV4Service.gridView;
  isCompact = signal(false);
  env = environment;

  constructor() {
    this.breakpointObserver
      .observe(['(max-width: 1130px)'])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => this.isCompact.set(result.matches));
  }

  private readonly menuItems = [
    { id: 'import', name: 'Import Bank Account', lucideIcon: 'download' },
    ...(environment.env_id === 'compass'
      ? [{ id: 'update', name: 'Update' }]
      : [])
  ];

  readonly headerActions = computed<IV4HeaderAction[]>(() => [
    {
      id: 'positive-pay',
      text: 'Positive Pay',
      style: 'navy',
      lucideIcon: 'info',
      isAddIcon: true,
      icon: ['fas', 'info'],
      toolTip:
        "Positive Pay is a fraud prevention service that, through our platform, automatically informs your bank about the checks or ACH payments you issue. When your customer submits a payment, your bank cross-verifies the details against what you provided. If they don't match, the bank will not process the payment, preventing unauthorized transactions (e.g., altered or forged checks, or unapproved ACH pulls). To use Positive Pay, ask your bank to activate it. Once set up, our system automatically coordinates with your bank. There may be a small fee associated with this service, but it secures your transactions."
    },
    this.menuItems.length > 1
      ? {
          id: 'menu',
          text: '',
          style: 'navy',
          lucideIcon: 'ellipsis-vertical',
          menu: this.menuItems
        }
      : {
          id: 'import',
          text: '',
          style: 'navy',
          lucideIcon: 'download',
          toolTip: 'Import Bank Account'
        },
    {
      id: 'new',
      text: this.isCompact() ? '' : 'New Bank Account',
      style: 'primary',
      lucideIcon: 'plus',
      toolTip: this.isCompact() ? '' : 'Add or connect a new bank account'
    }
  ]);

  onAction(id: string | number): void {
    if (id === 'positive-pay') this.positivePay();
    if (id === 'import') this.importBankAccounts();
    if (id === 'update') this.updateBankAccount();
    if (id === 'new') this.bankAccountService.requestNewBankAccount$.next();
  }

  viewToggle(isGrid: boolean): void {
    this.commonLayoutToggleV4Service.gridView.set(isGrid);
  }

  positivePay(): void {
    if (
      !this.bankDataService.bankAccountsSignal()?.length &&
      !this.bankDataService.accountLoadingSignal()
    ) {
      this.alertService.warningAlert({
        title: 'Error',
        content:
          'Please add/connect your bank account and try to setup Positive Pay.',
        isCancel: true
      });
      return;
    }

    this.positivePayService
      .checkPositivePayPermission()
      .pipe(
        catchError((err) => {
          if (!err.error.success && err.error.errorCode === 121) {
            this.router.navigateByUrl('/v4/manage/positivepay/restrictions');
          }
          return of(false);
        })
      )
      .subscribe((res) => {
        if (res.success) {
          this.router.navigateByUrl('/v4/manage/positivepay/index');
        }
      });
  }

  importBankAccounts(): void {
    this.dialog
      .open(ImportBankAccountV4Component, {
        maxWidth: '95vw',
        width: '600px',
        disableClose: true,
        autoFocus: false,
        panelClass: 'paddingless-modal-rounded'
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.bankDataService.setAccounts(undefined);
          this.bankDataService.setTotalBankAccountsCount();
        }
      });
  }

  updateBankAccount(): void {
    this.dialog
      .open(UpdatedImportedBanksModalComponent, {
        disableClose: true,
        width: '700px'
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.bankDataService.setAccounts(undefined);
          this.bankDataService.setTotalBankAccountsCount();
        }
      });
  }
}
