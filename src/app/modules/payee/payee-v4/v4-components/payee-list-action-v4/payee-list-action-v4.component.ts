import { Component, DestroyRef, inject } from '@angular/core';
import { ICellRendererParams } from '@ag-grid-community/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { IPayeeData } from 'src/app/modules/payee/payee-v2/model/payee';
import { LucideAngularModule } from 'lucide-angular';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { PayeeModalService } from 'src/app/shared/service/payee-modal/payee-modal.service';
import { V3DataTableService } from '../../../../v3-data-table/services/v3-data-table.service';
import { PayeeDataV35Service } from '../../../payee-v3/v35-services/payee-data-v35.service';

@Component({
  selector: 'app-payee-list-action-v4',
  templateUrl: './payee-list-action-v4.component.html',
  styleUrls: ['./payee-list-action-v4.component.scss'],
  standalone: true,
  imports: [
    LucideAngularModule,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    MatTooltip
  ]
})
export class PayeeListActionV4Component {
  private destroyRef = inject(DestroyRef);
  private v3TableService = inject(V3DataTableService);
  private alertService = inject(V4AlertService);
  public payeeDataService = inject(PayeeDataV35Service);
  private payeeService = inject(PayeeService);
  private payeeModalService = inject(PayeeModalService);

  params: ICellRendererParams & { type: 'action' };
  payee: IPayeeData;

  agInit(params: ICellRendererParams & { type: 'action' }): void {
    this.params = params;
    this.payee = params.data;
  }

  refresh(): boolean {
    return false;
  }

  onViewClick() {
    this.payeeDataService.actionSignal.update(() => 'more');
    this.payeeDataService.payeeDataSignal.set(this.payeeDetailsFormat());
    this.payeeDataService.setPayeeView(true);
  }

  editPayee() {
    const id = this.params.data.encrypted_id;
    this.payeeModalService
      .openEditPayee(
        id,
        'addPayeeModal',
        {
          edit: true,
          id,
          type: 'string'
        },
        true
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payeeModal) => {
        if (payeeModal) {
          payeeModal
            .afterClosed()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((res) => {
              if (res?.success) {
                this.v3TableService.refreshV3DataTable();
                this.payeeDataService.editedPayeeSignal.set(res);
              }
            });
        }
      });
  }

  deletePayee() {
    const id = this.params.data.encrypted_id;
    const alertData = {
      content: 'Are you sure to delete this payee?',
      cancelMsg: 'No, cancel!',
      doneMsg: 'Yes, Delete it!'
    };
    const alert = this.alertService.confirmAlert(alertData);
    alert
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) {
          this.onSingleDelAction(id);
        }
      });
  }

  private onSingleDelAction(itemId: string, warn: 1 | 0 = 0, confirmed: 1 | 0 = 0) {
    this.payeeService
      .deleteSinglePayee(itemId, warn, confirmed)
      .pipe(takeUntilDestroyed(this.destroyRef))
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

  private handlePayeeError(
    itemId: string,
    err: { error: { errorCode: number; errorMsg: string } }
  ) {
    if (err.error?.errorCode === 123) {
      this.alertService.warningAlert({
        content: `Sorry, You have a recurring mail check on this payee. You need to cancel all recurring
        service before delete this payee <a href='/manage/checkmailing/recurring'>click to see</a>`
      });
    } else if (err.error?.errorCode === 124) {
      const dRef = this.alertService.confirmAlert({
        content: err.error.errorMsg
      });
      dRef
        .afterClosed()
        .pipe(takeUntilDestroyed(this.destroyRef))
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
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((res) => {
          if (res) {
            this.onSingleDelAction(itemId, 1, 1);
          }
        });
    }
  }

  private payeeDetailsFormat() {
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
}
