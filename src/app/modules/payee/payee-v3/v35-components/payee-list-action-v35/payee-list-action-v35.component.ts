import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ICellRendererParams } from '@ag-grid-community/core';
import { Subject, takeUntil, Subscription } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import {
  IPayeeData,
  IPayeeDropdown
} from 'src/app/modules/payee/payee-v2/model/payee';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatIconButton } from '@angular/material/button';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { environment } from 'src/environments/environment';
import { PayeeModalService } from 'src/app/shared/service/payee-modal/payee-modal.service';
import { MatTooltip } from '@angular/material/tooltip';
import { faArrowsRotate, faBuildingColumns, faGlobe, faPenToSquare, faTrash, faUser, IconDefinition } from '@fortawesome/pro-solid-svg-icons';
import { V3DataTableService } from '../../../../v3-data-table/services/v3-data-table.service';
import { PayeeDataV35Service } from '../../v35-services/payee-data-v35.service';

@Component({
  selector: 'app-payee-list-action-v35',
  templateUrl: './payee-list-action-v35.component.html',
  styleUrls: ['./payee-list-action-v35.component.scss'],
  standalone: true,
  imports: [
    FaIconComponent,
    MatIconButton,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    MatTooltip
  ]
})
export class PayeeListActionV35Component implements OnInit,OnDestroy {
  /** dependancy injection using inject method */
  private v3TableService = inject(V3DataTableService);
  private alertService = inject(AlertService);
  public payeeDataService = inject(PayeeDataV35Service);
  private payeeService = inject(PayeeService);
  private payeeModalService = inject(PayeeModalService);

  /** variables */
  params: ICellRendererParams & { type: 'action' };
  payeeUpdated: IPayeeDropdown;
  subscriptions: Subscription[] = [];
  actions:{name:string,id:string,icon:IconDefinition,tooltip?:string}[] = [
    {
      name: 'Edit',
      id: 'id_edit_payee',
      icon: faPenToSquare
    },
    {
      name: 'Delete',
      id: 'id_delete_payee',
      icon: faTrash
    },
    {
      name: 'Bank Accounts',
      id: 'id_bank_ac',
      icon: faBuildingColumns
    },
    {
      name: 'International Bank Accounts',
      id: 'id_international_ac',
      icon: faGlobe
    },
    {
      name:
        environment.env_id === 'compass' ? 'Vendor Summary' : 'Payee Summary',
      id: 'id_payee_summary',
      icon: faUser
    }
  ];

  payee: IPayeeData;
  destroy$ = new Subject();
  agInit(params: ICellRendererParams & { type: 'action' }): void {
    this.params = params;
    this.payee = params.data;
  }

  ngOnInit(): void {
    if (environment.env_id === 'compass') {
      this.actions.unshift({
        name: 'Update',
        id: 'id_update_payee',
        icon: faArrowsRotate,
        tooltip: 'Update this payee from Netsuite'
      });
    }
  }

  /**
   * @description this function will decide which function wants to be called based on the id
   * @param id  depends upon the id the corresponding function will be called
   */
  onCellActionClick(id: string) {
    switch (id) {
      case 'id_edit_payee':
        this.editPayee(this.params.data.encrypted_id);
        break;
      case 'id_delete_payee':
        this.deletePayee(this.params.data.encrypted_id);
        break;
      case 'id_bank_ac':
        this.payeeBankAccounts(this.params.data.encrypted_id);
        break;
      case 'id_international_ac':
        this.payeeInternationalAccounts(this.params.data.encrypted_id);
        break;
      case 'id_payee_summary':
        this.payeeSummary();
        break;
      case 'id_update_payee':
        this.updatePayee(this.params.data.encrypted_id);
        break;
      default:
    }
  }

  /**
   * @description select more tab and shows the selected payee details
   */
  payeeSummary() {
    this.payeeDataService.actionSignal.update(() => 'details');
    this.payeeDataService.payeeDataSignal.set(this.payeeDetailsFormat());
    this.payeeDataService.setPayeeView(true);
  }

  /**
   * @description select accounts tab and international sub tab and shows the selected payee interntional accounts
   */
  payeeInternationalAccounts(id: string) {
    this.v3TableService.defaultPayload.payeeId = id;
    setTimeout(() => {
      this.payeeDataService.actionSignal.update(() => 'international');
      this.payeeDataService.payeeDataSignal.set(this.payeeDetailsFormat());
      this.payeeDataService.setPayeeView(true);
    }, 1000);
  }

  /**
   * @description select accounts tab and domestic sub tab and shows the selected payee bank accounts
   */
  payeeBankAccounts(id: string) {
    this.payeeService.isFromGrid = true;
    this.payeeDataService.actionSignal.update(() => 'domestic');
    this.v3TableService.defaultPayload.payeeId = id;
    this.payeeDataService.payeeDataSignal.set(this.payeeDetailsFormat());
    this.payeeDataService.setPayeeView(true);
  }

  /**
   * @description payee delete confirmation
   * @param id
   */
  deletePayee(id: string) {
    const alertData = {
      content: 'Are you sure to delete this payee?',
      cancelMsg: 'No, cancel!',
      doneMsg: 'Yes, Delete it!'
    };
    const alert = this.alertService.confirmAlert(alertData);
    alert
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          this.onSingleDelAction(id);
        }
      });
  }

  /**
   * @description delete payee
   * @param itemId
   * @param warn
   */
  onSingleDelAction(itemId: string, warn: 1 | 0 = 0, confirmed: 1 | 0 = 0) {
    this.payeeService
      .deleteSinglePayee(itemId, warn,confirmed)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.v3TableService.refreshV3DataTable();
            this.alertService.successAlert({ content: 'Payee deleted.' });
          }
        },
        error: (err) => {
          this.handlePayeeError(itemId, err);
        }
      });
  }

  /**
   * @returns  the formated payee details with needed field names from ag grid
   */
  payeeDetailsFormat() {
    return {
      addressLine1: this.payee.payee_address_line_1,
      addressLine2: this.payee.payee_address_line_2,
      city: this.payee.payee_city,
      company: this.payee.payee_company_name,
      country: this.payee.payee_country,
      createdAt: this.payee.created_at,
      email: this.payee.payee_email,
      encryptedId: this.payee.encrypted_id,
      id: this.payee.id,
      name: this.payee.payee_name,
      nickName: this.payee.payee_nick_name,
      payeeTypeId: this.payee.payee_type_id,
      phone: this.payee.payee_phone,
      state: this.payee.payee_state,
      typeDetails: this.payee.type_details,
      zip: this.payee.payee_zip
    };
  }

  /**
   * @description confirmation to  delete after confirm delete and when the payee has the transaction data or the payee has included in any other records
   * @param itemId
   * @param err
   */
  handlePayeeError(
    itemId: string,
    err: { error: { errorCode: number; errorMsg: string } }
  ) {
    if (err.error?.errorCode === 123) {
      this.alertService.warningAlert({
        content: `Sorry ,You have a recurring mail check on this payee,You need to cancel all recurring
        service before delete this payee <a href='/manage/checkmailing/recurring'>click to see</a>`
      });
    } else if (err.error?.errorCode === 124) {
      const dRef = this.alertService.confirmAlert({
        content: err.error.errorMsg
      });

      dRef
        .afterClosed()
        .pipe(takeUntil(this.destroy$))

        .subscribe((res) => {
          if (res) {
            this.onSingleDelAction(itemId, 1);
          }
        });
    } else if (err.error?.errorCode === 126) {
    const dRef = this.alertService.confirmAlert({
      content: err.error.errorMsg
    });

    dRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))

      .subscribe((res) => {
        if (res) {
          this.onSingleDelAction(itemId, 1,1);
        }
      });
  }
  }

  /**
   * @description modal for editing existing payee
   * @param data
   */
  editPayee(data: string) {
    this.subscriptions.push(
      this.payeeModalService
        .openEditPayee(data, 'addPayeeModal', {
          edit: true,
          id: data,
          type: 'string'
        })
        .subscribe((payeeModal) => {
          if (payeeModal) {
            this.subscriptions.push(
              payeeModal.afterClosed().subscribe((res) => {
                if (res?.success) {
                  this.v3TableService.refreshV3DataTable();
                  this.payeeDataService.editedPayeeSignal.set(res);
                }
              })
            );
          }
        })
    );
  }

  /**
   * @description change the list view into grid view . select the details tab and shows the selected payee details
   */
  onViewClick() {
    this.payeeDataService.actionSignal.update(() => 'more');
    this.payeeDataService.payeeDataSignal.set(this.payeeDetailsFormat());
    this.payeeDataService.setPayeeView(true);
  }

  updatePayee(payeeId:string){
    this.payeeDataService.updateSignlePayeeFromNetSuit(payeeId);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
