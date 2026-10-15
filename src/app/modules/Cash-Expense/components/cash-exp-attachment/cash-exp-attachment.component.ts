import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChange
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CashExpenseService } from 'src/app/shared/service/cashExpense/cash-expense.service';
import { OpenAttachmentModalComponent } from 'src/app/modules/check/modal/open-attachment-modal/open-attachment-modal.component';
import { ICashexpenseAttachments } from 'src/app/modules/Cash-Expense/model/CashExpense';
import { NgIf, NgFor } from '@angular/common';

@Component({
  selector: 'app-cash-exp-attachment',
  templateUrl: './cash-exp-attachment.component.html',
  styleUrls: ['./cash-exp-attachment.component.scss'],
  standalone: true,
  imports: [NgIf, NgFor]
})
export class CashExpAttachmentComponent implements OnChanges, OnDestroy {
  @Input() cashExpenseId: any;
  @Input() fromModal = false;
  subscriptions: Subscription[] = [];

  cashExpenseAttachmentData: ICashexpenseAttachments[] = [];
  constructor(
    private _cashExpenseService: CashExpenseService,
    private alertService: AlertService,
    private dialog: MatDialog
  ) {}

  ngOnChanges(changes: { [property: string]: SimpleChange }) {
    const cashExpenseId: SimpleChange = changes.cashExpenseId;
    this.cashExpenseId = cashExpenseId.currentValue;

    if (cashExpenseId !== undefined) this.loadAttachments();
  }

  loadAttachments() {
    this.subscriptions.push(
      this._cashExpenseService
        .getCashExpenseAttachment(this.cashExpenseId)
        .subscribe((res) => {
          if (res.success == true) this.cashExpenseAttachmentData = res.data;
        })
    );
  }

  onDeleteAttachment(id: string) {
    const attachmentId = id;
    const alert = this.openConfirmAlert();
    this.subscriptions.push(
      alert.afterClosed().subscribe((res) => {
        if (res) {
          this.subscriptions.push(
            this._cashExpenseService
              .deleteCashexpenseAttachment(this.cashExpenseId, attachmentId)
              .subscribe((res) => {
                if (res.success == true) {
                  this.openSuccessAlert();
                  for (const [
                    i,
                    value
                  ] of this.cashExpenseAttachmentData.entries()) {
                    if (value.encrypted_id == attachmentId)
                      this.cashExpenseAttachmentData.splice(i, 1);
                  }
                }
              })
          );
        }
      })
    );
  }

  openAttachment(id: any, openInModal: boolean) {
    const attachmentId = id;
    this.subscriptions.push(
      this._cashExpenseService
        .openCashExpenseAttachment(this.cashExpenseId, attachmentId)
        .subscribe((res: any) => {
          if (res.success == true) {
            const link = res.data;
            const ext = link.split('.').pop(); // To get the extention

            const fileExtention = ext.substring(0, 3);
            if (openInModal && (fileExtention ?? '').toLowerCase() == 'pdf') {
              this.openAttachmentModal(link);
              return;
            }

            window.open(link);
          }
        })
    );
  }

  openAttachmentModal(link: any) {
    this.dialog.open(OpenAttachmentModalComponent, {
      maxWidth: '1100px',
      width: '95%',
      height: '90%',
      data: { link: link }
    });
  }

  identify(index: number, item: any) {
    return item.id;
  }

  openConfirmAlert() {
    const data = {
      title: 'Confirm',
      content: 'Are you sure you want to delete this cash expense attachment?',
      cancelMsg: 'No, Cancel!',
      doneMsg: 'Yes, Delete it!'
    };
    return this.alertService.confirmAlert(data);
  }

  openSuccessAlert() {
    const data = {
      title: 'Success!',
      content: 'Attachment deleted',
      close: true
    };
    return this.alertService.successAlert(data);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
