import {
  Component,
  computed,
  inject,
  input,
  OnDestroy,
  OnInit
} from '@angular/core';
import { ICellRendererParams } from '@ag-grid-community/core';
import { finalize, Subscription } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { IBank } from 'src/app/models/bank';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatIconButton } from '@angular/material/button';
import { environment } from 'src/environments/environment';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  faCheck,
  faPenToSquare,
  faSync,
  faTrash
} from '@fortawesome/pro-solid-svg-icons';
import { NgClass } from '@angular/common';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';
import { V3DataTableService } from '../../../../v3-data-table/services/v3-data-table.service';
import { PayeeDataV35Service } from '../../v35-services/payee-data-v35.service';
import { IPayeeBank } from '../../../payee-v2/model/payee';

@Component({
  selector: 'app-dt-bank-action-button-v35',
  templateUrl: './bank-action-button-v35.component.html',
  styleUrls: ['./bank-action-button-v35.component.scss'],
  standalone: true,
  imports: [
    MatIconButton,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    MatTooltipModule,
    FontAwesomeModule,
    NgClass
  ]
})
export class DtBankActionButtonV35Component implements OnInit, OnDestroy {
  /** dependancy injection using inject method */
  private payeeService = inject(PayeeService);
  private alertService = inject(AlertService);
  private v3DataTableService = inject(V3DataTableService);
  private payeeDataService = inject(PayeeDataV35Service);
  private bankModalService = inject(BankModalService);

  /** variables */
  params: ICellRendererParams & { type: 'action' };
  subscriptions: Subscription[] = [];
  payeeIdSignal = computed(() => this.payeeDataService.payeeDataSignal()?.id);
  mode = input<'aggrid' | 'table'>('aggrid');
  rowData = input<IPayeeBank>();

  action = [
    {
      name: 'Edit',
      id: 'id_editRow',
      icon: faPenToSquare
    },
    {
      name: 'Delete',
      id: 'id_deleteRow',
      icon: faTrash
    },
    {
      name: 'Make As Default For DD',
      id: 'default_dd',
      icon: faCheck
    }
  ];

  ngOnInit(): void {
    if (environment.env_id === 'compass') {
      this.action.push({
        name: 'Sync',
        id: 'id_sync',
        icon: faSync
      });
    }
  }

  /**
   * @description agInit called firstly and gives the the selected ag grid table row details
   * @param params selected row details
   */
  agInit(params: ICellRendererParams & { type: 'action' }): void {
    this.params = params;
  }

  /**
   * @description this function will decide which function wants to be called
   * @param id  depends upon the id the corresponding function will be called
   */
  onCellActionClick(id: string) {
    switch (id) {
      case 'id_editRow':
        this.onEditRow(
          this.mode() === 'table' ? this.rowData() : this.params.data
        );
        break;
      case 'id_deleteRow':
        this.onDeleteRow(
          this.mode() === 'table' ? this.rowData()?.id : this.params.data.id
        );
        break;
      case 'default_dd':
        this.makeDefaultDDAccount(
          this.mode() === 'table' ? this.rowData()?.id : this.params.data.id
        );
        break;
      case 'id_sync':
        this.netsuiteSync(
          this.mode() === 'table' ? this.rowData()?.id : this.params.data.id
        );
        break;
      default:
    }
  }

  /**
   * @description to make the bank account as the default account
   * @param id bank id
   */
  makeDefaultDDAccount(id: string) {
    this.subscriptions.push(
      this.payeeService
        .setDefaultDDBankAcc({ bankId: id, payeeId: this.payeeIdSignal() })
        .subscribe((response) => {
          if (response.success) {
            this.alertService.successAlert({
              title: 'Success',
              content: response.message
            });
            if (this.mode() === 'aggrid') {
              this.v3DataTableService.refreshV3DataTable();
            } else {
              this.payeeDataService.payeeBankTableActions.update((val) => ({
                ...val,
                refreshBank: true
              }));
            }
          }
        })
    );
  }

  /**
   * @description To open the modal for editing the existing bank
   * @param selectedItem  selected bank account data
   */
  onEditRow(selectedItem: IBank) {
    if (this.bankModalService.isBankPermissionChecking()) return;
    this.subscriptions.push(
      this.bankModalService
        .openAddBankNormalModal({
          editMode: true,
          id: this.payeeIdSignal(),
          account: selectedItem
        })
        .subscribe((bankModal) => {
          if (bankModal) {
            this.subscriptions.push(
              bankModal.afterClosed().subscribe((result) => {
                if (result?.success) {
                  this.alertService.successAlert({
                    title: 'Success'
                  });
                  if (this.mode() === 'aggrid') {
                    this.v3DataTableService.refreshV3DataTable();
                  } else {
                    this.payeeDataService.payeeBankTableActions.update(
                      (val) => ({
                        ...val,
                        refreshBank: true
                      })
                    );
                  }
                }
              })
            );
          }
        })
    );
  }

  /**
   *
   * @description To delete an existing bank account
   * @param id selected bank accounts id
   */
  onDeleteRow(id: string) {
    const alert = this.alertService.confirmAlert({
      content: 'Are you sure you want to delete this bank account?'
    });
    alert.afterClosed().subscribe((res) => {
      if (res) {
        this.subscriptions.push(
          this.payeeService
            .deletePayeeBank(this.payeeIdSignal() ?? '', id)
            .subscribe((response) => {
              if (response.success) {
                this.alertService.successAlert({
                  title: 'Success',
                  content: response.message
                });
                if (this.mode() === 'aggrid') {
                  this.v3DataTableService.refreshV3DataTable();
                } else {
                  this.payeeDataService.payeeBankTableActions.update((val) => ({
                    ...val,
                    refreshBank: true
                  }));
                }
              }
            })
        );
      }
    });
  }

  /**
   * @description Sync payee bank account with netsuite.
   * pecially created for Compass enterprise customer.
   * @param {string} payeeBankId - Selected payee bank id.
   */
  netsuiteSync(payeeBankId: string): void {
    this.payeeDataService.isSyncBank.set(true);
    this.subscriptions.push(
      this.payeeService
        .syncWithNetSuite(payeeBankId)
        .pipe(
          finalize(() => {
            this.payeeDataService.isSyncBank.set(false);
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.alertService.successAlert({ content: 'Syncing Completed.' });
          }
        })
    );
  }

  /**
   * @descripiton unsubscribe the whole subscritions subscribed from this component
   * when the component is destroyed
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
