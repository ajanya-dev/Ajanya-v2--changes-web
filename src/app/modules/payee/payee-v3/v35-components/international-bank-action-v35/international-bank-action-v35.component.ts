import { Component, OnDestroy, computed, inject, input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ICellRendererParams } from '@ag-grid-community/core';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { Subject, takeUntil } from 'rxjs';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatIconButton } from '@angular/material/button';
import { faCheck } from '@fortawesome/pro-solid-svg-icons';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { AddRecipientModalComponent } from 'src/app/modules/international-payment/modal/add-recipient-modal/add-recipient-modal.component';
import { V3DataTableService } from '../../../../v3-data-table/services/v3-data-table.service';
import { PayeeDataV35Service } from '../../v35-services/payee-data-v35.service';
import { IPayeeInterBank } from '../../../payee-v2/model/payee';

@Component({
  selector: 'app-dt-international-bank-action-v35',
  templateUrl: './international-bank-action-v35.component.html',
  styleUrls: ['./international-bank-action-v35.component.scss'],
  standalone: true,
  imports: [
    MatIconButton,
    MatMenuTrigger,
    FaIconComponent,
    MatMenu,
    MatMenuItem
  ]
})
export class DtInternationalBankActionV35Component implements OnDestroy {
  /** dependancy injection using inject method  */
  private v3TableService = inject(V3DataTableService);
  private dialogRef = inject(MatDialog);
  private alertService = inject(AlertService);
  private payeeService = inject(PayeeService);
  private payeeDataService = inject(PayeeDataV35Service);
  private walletService = inject(WalletService);

  faCheck = faCheck;

  /** variables */
  payeeIdSignal = computed(() => this.payeeDataService.payeeDataSignal()?.id);
  params: ICellRendererParams & { type: 'action' };
  destroy$ = new Subject();
  mode = input<'aggrid' | 'table'>('aggrid');
  rowData = input<IPayeeInterBank>();
  buttons = [
    {
      name: 'Edit',
      id: 'id_edit_button',
      icon: 'fa-solid fa-pen-to-square'
    },
    {
      name: 'Delete',
      id: 'id_delete_button',
      icon: 'fa fa-trash'
    },
    {
      name: 'Make As Default Account',
      id: 'id_default_account',
      icon: 'fa-solid fa-check'
    }
  ];

  /**
   * @description agInit called firstly and gives the the selected ag grid table row details
   * @param params selected row details here the international bank details
   */
  agInit(params: ICellRendererParams & { type: 'action' }): void {
    this.params = params;
  }

  /**
   * @description this function will decide which function wants to be called
   * @param id  depends upon the id the corresponding function will be called
   */
  onCellActionClick(id: string) {
    if (id === 'id_delete_button') {
      this.onDeleteRow(
        this.mode() === 'table' ? this.rowData()?.id : this.params.data.id
      );
    }
    if (id === 'id_edit_button') {
      this.openEditInternationalBankAccount(
        this.mode() === 'table' ? this.rowData()?.id : this.params.data.id
      );
    }
    if (id === 'id_default_account') {
      this.makeDefaultInternationalAccount(
        this.mode() === 'table' ? this.rowData()?.id : this.params.data.id
      );
    }
  }

  /**
   * @description To open the modal for delete the international bank
   * @param id  selected international bank id
   */
  onDeleteRow(id: string) {
    const alert = this.alertService.confirmAlert({
      content: 'Are you sure to delete ?'
    });
    alert.afterClosed().subscribe((result) => {
      if (result) {
        this.payeeService
          .DeletePayeeIPBank(id)
          .pipe(takeUntil(this.destroy$))
          .subscribe((response) => {
            if (response.success) {
              this.alertService.successAlert({
                title: 'Success',
                content: response.message
              });
              if (this.mode() === 'aggrid') {
                this.v3TableService.refreshV3DataTable();
              } else {
                this.payeeDataService.payeeBankTableActions.update((val) => ({
                  ...val,
                  refreshInterBank: true
                }));
              }
            }
          });
      }
    });
  }

  /**
   * @description To open the modal for editing the existing international bank
   * @param bankAcId  selected bank account id
   */
  openEditInternationalBankAccount(bankAcId?: string) {
    const payeeData = this.payeeDataService.payeeDataSignal();
    const dialogRef = this.dialogRef.open(AddRecipientModalComponent, {
      maxWidth: '95%',
      width: '700px',
      disableClose: true,
      data: {
        editMode: !!bankAcId,
        id: this.payeeIdSignal(),
        bankAcId: bankAcId ?? undefined,
        recipientId: payeeData?.id,
        payeeEmail: payeeData?.email,
        payeePhone: payeeData?.phone
      }
    });

    dialogRef.afterClosed().subscribe((response: { success: boolean }) => {
      if (response.success) {
        this.alertService.successAlert({
          title: 'Success',
          content: ` Bank account ${
            bankAcId ? 'updated' : 'added'
          } successfully`,
          close: true
        });
        if (this.mode() === 'aggrid') {
          this.v3TableService.refreshV3DataTable();
        } else {
          this.payeeDataService.payeeBankTableActions.update((val) => ({
            ...val,
            refreshInterBank: true
          }));
        }
      }
    });
  }

  makeDefaultInternationalAccount(id: string) {
    this.walletService.setDefaultBank({
      accountId: id,
      payeeId: this.payeeIdSignal() as string,
      type: this.rowData()?.account_type ?? ''
    }).pipe(takeUntil(this.destroy$)).subscribe((response) => {
      if (response.success) {
        this.alertService.successAlert({
          title: 'Success',
          content: response.message
        });

        if (this.mode() === 'aggrid') {
          this.v3TableService.refreshV3DataTable();
        } else {
          this.payeeDataService.payeeBankTableActions.update((val) => ({
            ...val,
            refreshInterBank: true
          }));
        }
      }
    });
  }

  /**
   * @descripiton unsubscribe the whole subscritions subscribed from this component
   * when the component is destroyed
   */
  ngOnDestroy() {
    this.destroy$.next(true);
  }
}
