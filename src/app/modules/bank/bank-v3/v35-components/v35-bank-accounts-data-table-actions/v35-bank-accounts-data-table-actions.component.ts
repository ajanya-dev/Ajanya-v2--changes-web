import { Component, OnDestroy, inject } from '@angular/core';
import { ICellRendererParams } from '@ag-grid-community/core';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { MatDialog } from '@angular/material/dialog';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { IBankData } from 'src/app/models/bank';
import { Router } from '@angular/router';
import { Subscription, take } from 'rxjs';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import {
  IconPrefix,
  IconName,
  IconLookup
} from '@fortawesome/fontawesome-svg-core';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { EditBankAccountModalComponent } from '../../../bank-v2/modals/edit-bank-account-modal/edit-bank-account-modal.component';
import { ChangeStartingNumberComponent } from '../../../bank-v2/modals/change-starting-number/change-starting-number.component';
import { BankDataV35Service } from '../../v35-services/bank-data-v35.service';
import { CloneCheckDesignComponent } from '../../../bank-v2/modals/clone-check-design/clone-check-design.component';
import { NgFor } from '@angular/common';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatIconButton } from '@angular/material/button';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';

/**
 * @description Cell renderer component for bank accounts table single row actions
 */
@Component({
  selector: 'app-v35-bank-accounts-data-table-actions',
  templateUrl: './v35-bank-accounts-data-table-actions.component.html',
  styleUrls: ['./v35-bank-accounts-data-table-actions.component.scss'],
  standalone: true,
  imports: [
    FaIconComponent,
    MatIconButton,
    MatMenuTrigger,
    MatMenu,
    NgFor,
    MatMenuItem
  ]
})
export class V35BankAccountsDataTableActionsComponent implements OnDestroy {
  /**
   * @description Dependancy injection using inject method
   */
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private dialog = inject(MatDialog);
  private alertService = inject(AlertService);
  private bankAccountService = inject(BankAccountsService);
  private router = inject(Router);
  public bankDataService = inject(BankDataV35Service);
  private headerService = inject(HeaderService);
  private localStorageService = inject(LocalStorageService);


  /* Variables */
  commonTransactionTableRowData: ICellRendererParams<IBankData>;

  actions: {
    name: string;
    id: string;
    icon: string;
    faIcon: [IconPrefix, IconName] | IconLookup;
  }[] = [
    {
      name: 'Edit',
      id: 'id_editRow',
      icon: 'fa fa-edit',
      faIcon: ['fas', 'edit']
    },
    {
      name: 'Edit Design',
      id: 'id_edit_design_row',
      icon: 'fa fa-pencil',
      faIcon: ['fas', 'pencil']
    },
    {
      name: 'Delete',
      id: 'id_delete_row',
      icon: 'fa fa-trash',
      faIcon: ['fas', 'trash']
    },
    {
      name: 'Change Starting Number',
      id: 'id_change_starting_number',
      icon: 'fa fa-exchange',
      faIcon: ['fas', 'exchange']
    },
    {
      name: 'Clone Design',
      id: 'id_clone_design_row',
      icon: 'fa fa-clone',
      faIcon: ['fas', 'clone']
    },
    {
      name: 'ACH Authorization Form',
      id: 'id_ach_authorization_form',
      icon: 'fa-ballot-check fal ',
      faIcon: ['fas', 'ballot-check']
    }
  ];

  subscriptions: Subscription[] = [];

  /**
   * @description agInit called firstly and gives the the selected ag grid table row details
   * @param params Selected row details. Here the bank accounts details
   */
  agInit(params: ICellRendererParams<IBankData>) {
    if (params.data) {
      this.commonTransactionTableRowData = params;
    }
  }

  /**
   * @description Decides which fuction wants to be called by action params
   * @param action The action id @type string
   * @returns
   */
  onCellActionClick(action: string) {
    const selectedRows = this.commonTransactionTableRowData.data;

    if (!selectedRows) {
      return;
    }

    if (selectedRows?.is_neo_bank) {
      this.dataTableService.setActionButtonDisable(true, [
        '',
        'id_edit_design_row',
        '',
        '',
        '',
        ''
      ]);
    } else {
      this.dataTableService.setActionButtonDisable(true, [
        '',
        '',
        '',
        '',
        '',
        ''
      ]);
    }

    switch (action) {
      case 'id_editRow':
        this.onEditRow(selectedRows);
        break;
      case 'id_edit_design_row':
        this.goToCheckDesign(selectedRows);
        break;
      case 'id_delete_row':
        this.onDeleteRow(selectedRows);
        break;
      case 'id_change_starting_number':
        this.changeStartingNo(selectedRows);
        break;
      case 'id_clone_design_row':
        this.onCloneDesignRow(selectedRows);
        break;
      case 'id_ach_authorization_form':
        this.achAutherizationForm(selectedRows);
        break;
      default:
    }
  }

  /**
   * @description Edit selected row
   * @param val Bank account details
   */
  onEditRow(val: IBankData) {
    const editBankModal = this.dialog.open(EditBankAccountModalComponent, {
      // Open modal
      maxWidth: '510px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      data: val
    });
    editBankModal.afterClosed().subscribe((res) => {
      if (res) {
        this.v3DataTableService.refreshV3DataTable();
      }
    });
  }

  /**
   * @description Navigate into check design page of selected row
   * @param selectedRow Bank account details
   */
  goToCheckDesign(selectedRow: IBankData) {
    const currentPage = this.v3DataTableService.CurrentPage;
    this.localStorageService.setItem('selectedTablePage',currentPage);
    this.localStorageService.setItem('isGridView',this.bankDataService.isGridView);
    window.location.href = `checkdesign/edit/${selectedRow.encrypted_bankacc_id}?from=v3`;
  }

  /**
   * @description Delete selected row
   * @param val Bank account details
   */
  onDeleteRow(val: IBankData) {
    const arr: string[] = [];
    arr.push(val.encrypted_bankacc_id);
    const data = {
      ids: arr
    };

    const message = { title: 'Confirm'};
    const response = this.alertService.confirmAlert(message);
    response.afterClosed().subscribe((result) => {
      if (result) {
        if (this.bankDataService.isAchPending(val)) {
          return;
        }
        this.deleteSingleBankAccount(val, data);
      }
    });
  }

  /**
   * @description Deletes a single bank account. When the API responds with
   * errorCode 126 (deletion needs explicit confirmation), a confirm alert is
   * shown and, on confirmation, the same API is re-called with confirmed = 1.
   * @param val - The bank row being deleted.
   * @param data - The encrypted ids payload, reused for the errorCode 125 flow.
   * @param confirmed - Confirmation flag sent to the API (0 by default, 1 after the 126 confirm).
   */
  private deleteSingleBankAccount(
    val: IBankData,
    data: { ids: string[] },
    confirmed = 0
  ) {
    this.subscriptions.push(
      this.bankAccountService
        .deleteBankAccount(val.encrypted_bankacc_id, confirmed)
        .subscribe(
          (res) => {
            if (res.success) {
              this.dataTableService.setRefreshStatus(true);
              const datas = {
                content: 'Deleted',
                close: true,
                timeout: 1500
              };
              this.v3DataTableService.refreshV3DataTable();
              this.alertService.successAlert(datas);
              this.headerService.refreshDynamicHeader.next(true);
            }
          },
          (err) => {
            if (err.error.errorCode === 125) {
              this.onDeleteBank(data, err.error.errorMsg);
            } else if (err.error.errorCode === 126) {
              const alert = this.alertService.confirmAlert({
                content: err.error.errorMsg,
                doneMsg: 'Continue',
                isCancel: true,
                cancelMsg: 'Cancel'
              });
              alert
                .afterClosed()
                .pipe(take(1))
                .subscribe((res) => {
                  if (res) {
                    this.deleteSingleBankAccount(val, data, 1);
                  }
                });
            }
          }
        )
    );
  }

  /**
   * @description Delete bank which the bank have active payments link or records
   * @param data Object with a field 'ids' contains the selected bank ids
   */
  onDeleteBank(data: { ids: string[] }, errorMsg: string) {
    const deleted = this.alertService.confirmAlert({
      content: errorMsg,
      doneMsg: 'Ok',
      isCancel: true,
      cancelMsg: 'Cancel'
    });
    deleted.afterClosed().subscribe((res) => {
      if (res) {
        this.subscriptions.push(
          this.bankAccountService
            .deleteBankAccountInfo(data)
            .subscribe((result) => {
              if (result?.success) {
                this.dataTableService.setRefreshStatus(true);
                const alertData = {
                  content: 'Deleted',
                  close: true,
                  timeout: 1500
                };
                this.v3DataTableService.refreshV3DataTable();
                this.alertService.successAlert(alertData);
                this.headerService.refreshDynamicHeader.next(true);
              }
            })
        );
      }
    });
  }

  /**
   * @description Change starting number  of selected bank's check
   * @param val Bank account details
   */
  changeStartingNo(val: IBankData) {
    const checkNumberModal = this.dialog.open(ChangeStartingNumberComponent, {
      // open modal
      maxWidth: '400px',
      width: '95%',
      disableClose: false,
      autoFocus: false,
      data: val,
      panelClass: 'chekNoModal'
    });
    checkNumberModal.afterClosed().subscribe(() => {
      this.v3DataTableService.refreshV3DataTable();
    });
  }

  /**
   * @description Clone design of selected row
   * @param val Bank account details
   */
  onCloneDesignRow(val: IBankData) {
    const dialogRef = this.dialog.open(CloneCheckDesignComponent, {
      maxWidth: '450px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      data: val as IBankData
    });

    dialogRef.afterClosed().subscribe((_result) => {
      if (_result) {
        this.v3DataTableService.refreshV3DataTable();
        this.dataTableService.setRefreshStatus(true);
      }
    });
  }

  /**
   * @description Navigate into ach authorization form
   * @param val Bank account details
   */
  achAutherizationForm(val: IBankData) {
    this.router.navigate(
      ['/manage/bankingAch/auth-form/ach-authorization-form'],
      { queryParams: { ba: val.encrypted_bankacc_id } }
    );
  }

  onViewButtonClick() {
    const selectedRows = this.commonTransactionTableRowData.data;
    if (!selectedRows) {
      return;
    }
    this.bankDataService.selectBankAccount(selectedRows);
    this.bankDataService.toggleView({ gridView: true });
  }

  /**
   * @description TrackBy and ngFor together allow Angular to detect the specific node element that needs to change or be added instead of rebuilding the whole array
   * @param index
   * @returns
   */
  trackByIndex(index: number) {
    return index;
  }

  /**
   * @description Unsubscribe all subscriptions when the component destroys
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }
}
