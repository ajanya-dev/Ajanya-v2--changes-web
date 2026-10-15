import { Component, DestroyRef, inject, Injector } from '@angular/core';
import { ICellRendererParams } from '@ag-grid-community/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { LucideAngularModule } from 'lucide-angular';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { IBankData } from 'src/app/models/bank';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { BankDataV35Service } from '../../../../bank-v3/v35-services/bank-data-v35.service';
import { CommonLayoutToggleV4Service } from 'src/app/shared/service/common/shared/common-layout/common-layout-toggle-v4.service';
import { EditBankAccountModalV4Component } from 'src/app/modules/user/user-v4/modals/edit-bank-account-modal-v4/edit-bank-account-modal-v4.component';
import { ChangeStartingNumberV4Component } from '../../../../bank-v4/v4-modals/change-starting-number-v4/change-starting-number-v4.component';
import { CloneCheckDesignV4Component } from '../../../../bank-v4/v4-modals/clone-check-design-v4/clone-check-design-v4.component';
import { AchAuthorizationFormV4Component } from '../../../../bank-v4/v4-modals/ach-authorization-form-v4/ach-authorization-form-v4.component';
import { CheckdesignCanvasService } from 'src/app/shared/service/check-design/checkdesign-canvas.service';

/**
 * @description V4 Cell renderer component for bank accounts table action column
 */
@Component({
  selector: 'app-bank-accounts-action-cell-v4',
  templateUrl: './bank-accounts-action-cell-v4.component.html',
  styleUrls: ['./bank-accounts-action-cell-v4.component.scss'],
  standalone: true,
  imports: [
    LucideAngularModule,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    MatTooltip
  ]
})
export class BankAccountsActionCellV4Component {
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private alertService = inject(V4AlertService);
  private bankAccountService = inject(BankAccountsService);
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private headerService = inject(HeaderService);
  private localStorageService = inject(LocalStorageService);
  public bankDataService = inject(BankDataV35Service);
  private commonLayoutToggleV4Service = inject(CommonLayoutToggleV4Service);
  private injector = inject(Injector);

  params: ICellRendererParams<IBankData>;
  bankData: IBankData;

  agInit(params: ICellRendererParams<IBankData>): void {
    this.params = params;
    this.bankData = params.data!;
  }

  refresh(): boolean {
    return false;
  }

  onViewClick() {
    const selectedRows = this.params.data;
    if (!selectedRows) {
      return;
    }
    this.bankDataService.selectBankAccount(selectedRows);
    this.commonLayoutToggleV4Service.gridView.set(true);
    this.commonLayoutToggleV4Service.navigateToDetail();
  }

  onEditRow() {
    const editBankModal = this.dialog.open(EditBankAccountModalV4Component, {
      maxWidth: '600px',
      width: '100%',
      panelClass: 'paddingless-modal-rounded',
      data: this.bankData
    });
    editBankModal
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) {
          this.v3DataTableService.refreshV3DataTable();
        }
      });
  }

  goToCheckDesign() {
    const currentPage = this.v3DataTableService.CurrentPage;
    this.localStorageService.setItem('selectedTablePage', currentPage);
    this.localStorageService.setItem(
      'isGridView',
      this.bankDataService.isGridView
    );
    window.location.href = `checkdesign/edit/${this.bankData.encrypted_bankacc_id}?returnUrl=${encodeURIComponent('/v4/manage/bank-accounts/index?selectPrev=true')}&from=v4`;
  }

  onDeleteRow() {
    const alertData = {
      content: 'Are you sure you want to delete this bank account?',
      cancelMsg: 'No, cancel!',
      doneMsg: 'Yes, Delete it!'
    };
    const alert = this.alertService.confirmAlert(alertData);
    alert
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          if (this.bankDataService.isAchPending(this.bankData, true)) {
            return;
          }
          this.deleteSingleBankAccount();
        }
      });
  }

  private deleteSingleBankAccount(confirmed: 0 | 1 = 0) {
    this.bankAccountService
      .deleteBankAccount(this.bankData.encrypted_bankacc_id, confirmed)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.dataTableService.setRefreshStatus(true);
            this.v3DataTableService.refreshV3DataTable();
            this.alertService.successAlert({
              content: 'Deleted'
            });
            this.headerService.refreshDynamicHeader.next(true);
          }
        },
        error: (err) => {
          if (err.error?.errorCode === 125) {
            this.onDeleteBank(err.error.errorMsg);
          } else if (err.error?.errorCode === 126) {
            const alert = this.alertService.confirmAlert({
              content: err.error.errorMsg,
              doneMsg: 'Continue',
              isCancel: true,
              cancelMsg: 'Cancel'
            });
            alert
              .afterClosed()
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe((res) => {
                if (res) {
                  this.deleteSingleBankAccount(1);
                }
              });
          }
        }
      });
  }

  private onDeleteBank(errorMsg: string) {
    const dRef = this.alertService.failedAlert({
      content: errorMsg,
      doneMsg: 'Ok',
      isCancel: true,
      cancelMsg: 'Cancel'
    });
    dRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) {
          this.bankAccountService
            .deleteBankAccountInfo({
              ids: [this.bankData.encrypted_bankacc_id]
            })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((result) => {
              if (result?.success) {
                this.dataTableService.setRefreshStatus(true);
                this.v3DataTableService.refreshV3DataTable();
                this.alertService.successAlert({
                  content: 'Deleted'
                });
                this.headerService.refreshDynamicHeader.next(true);
              }
            });
        }
      });
  }

  changeStartingNo() {
    const modal = this.dialog.open(ChangeStartingNumberV4Component, {
      maxWidth: '400px',
      width: '100%',
      panelClass: 'paddingless-modal-rounded',
      data: this.bankData
    });
    modal
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.v3DataTableService.refreshV3DataTable();
      });
  }

  onCloneDesignRow() {
    const cloneInjector = Injector.create({
      providers: [{ provide: CheckdesignCanvasService }],
      parent: this.injector
    });
    const dialogRef = this.dialog.open(CloneCheckDesignV4Component, {
      maxWidth: '450px',
      width: '100%',
      panelClass: 'paddingless-modal-rounded',
      data: this.bankData,
      injector: cloneInjector
    });
    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.v3DataTableService.refreshV3DataTable();
          this.dataTableService.setRefreshStatus(true);
        }
      });
  }

  achAuthorizationForm() {
    this.dialog.open(AchAuthorizationFormV4Component, {
      maxWidth: '600px',
      width: '100%',
      panelClass: 'paddingless-modal-rounded',
      data: this.bankData,
      disableClose: true,
    });
  }
}
