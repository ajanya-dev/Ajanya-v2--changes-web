import {
  IConfirmAlert,
  IWarningAlert,
  ISuccessAlert
} from '../../../../models/alert';
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
import { CheckService } from 'src/app/shared/service/check/check.service';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { OpenAttachmentModalComponent } from '../../modal/open-attachment-modal/open-attachment-modal.component';
import { CheckAddAttachmentCommonModalComponent } from '../../modal/check-activity-modals/check-add-attachment-common-modal/check-add-attachment-common-modal.component';
import { ICheckAttachmentData } from '../../model/check';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CommonButtonV35Component } from '../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';

@Component({
  selector: 'app-check-attachment',
  templateUrl: './check-attachment.component.html',
  styleUrls: ['./check-attachment.component.scss'],
  standalone: true,
  imports: [CommonButtonV35Component, FaIconComponent]
})
export class CheckAttachmentComponent implements OnChanges, OnDestroy {
  @Input() checkId: string;
  @Input() mode: 'check' | 'international_payments' = 'check';
  @Input() canAdd = true;
  subscriptions: Subscription[] = [];

  checkAttachmentData: ICheckAttachmentData[] = [];
  constructor(
    private _checkService: CheckService,
    private _alertService: AlertService,
    private dialog: MatDialog,
    private walletService: WalletService
  ) {}

  ngOnChanges(changes: { [property: string]: SimpleChange }) {
    const checkId: SimpleChange = changes.checkId;
    this.checkId = checkId.currentValue;

    if (checkId) {
      this.loadAttachments();
    }
  }

  loadAttachments() {
    if (this.mode === 'international_payments') {
      this.subscriptions.push(
        this.walletService
          .getAttachmentsInternationalPayment(this.checkId)
          .subscribe((res) => {
            if (res?.success) {
              this.checkAttachmentData = res.data.map((item) => ({
                id: String(item.id),
                fileName: item.file_name,
                user_name: item.user_name,
                check_id: item.attachable_id ?? 0,
                pageCount: item.page_count ?? 0,
                created_at: item.created_at,
                file_name: item.file_name,
                encrypted_id: item.encrypted_id,
                formated_date: item.formated_date,
                billAttach: '',
                status: item.status ?? undefined,
                all_attachment_status: item.status
                  ? { status_text: item.status }
                  : undefined
              }));
            }
          })
      );
      return;
    }

    this.subscriptions.push(
      this._checkService.getCheckAttachment(this.checkId).subscribe((res) => {
        if (res?.success) {
          this.checkAttachmentData = res.data;
        }
      })
    );
  }

  addAttachment() {
    const dialogRef = this.dialog.open(CheckAddAttachmentCommonModalComponent, {
      maxWidth: '600px',
      width: '93%',
      data: {
        id: this.checkId,
        existingData: this.checkAttachmentData,
        mode:
          this.mode === 'international_payments'
            ? 'international_payments'
            : undefined
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (!res?.existingData) return;

      if (this.mode === 'international_payments') {
        this.checkAttachmentData = res.existingData.map((item: ICheckAttachmentData) => ({
          id: String(item.id),
          fileName: item.fileName || item.file_name,
          user_name: item.user_name,
          check_id: item.check_id ?? 0,
          pageCount: item.pageCount ?? 0,
          created_at: item.created_at,
          file_name: item.file_name ?? item.fileName,
          encrypted_id: item.encrypted_id,
          formated_date: item.formated_date,
          billAttach: item.billAttach ?? '',
          status: item.status ?? undefined,
          all_attachment_status: item.status
            ? { status_text: item.status }
            : undefined
        }));
        return;
      }

      this.checkAttachmentData = res.existingData;
    });
  }

  onDeleteAttachment(id: string) {
    const attachmentId = id;
    const alert = this.openConfirmAlert();
    alert.afterClosed().subscribe((res) => {
      if (res) {
        if (this.mode === 'international_payments') {
          const attachmentData = this.checkAttachmentData.find((item) => item.id === attachmentId);
          this.subscriptions.push(
            this.walletService
              .deleteAttachmentInternationalPayment(this.checkId, attachmentData?.encrypted_id ?? '')
              .subscribe((res) => {
                if (res?.success) {
                  this.openSuccessAlert();
                  for (const [i, value] of this.checkAttachmentData.entries()) {
                    if (value.id == attachmentId) this.checkAttachmentData.splice(i, 1);
                  }
                }
              })
          );
          return;
        }

        this.subscriptions.push(
          this._checkService
            .deleteCheckAttachment(this.checkId, attachmentId)
            .subscribe((res) => {
              if (res?.success) {
                this.openSuccessAlert();
                for (const [i, value] of this.checkAttachmentData.entries()) {
                  if (value.id == attachmentId) this.checkAttachmentData.splice(i, 1);
                }
              }
            })
        );
      }
    });
  }

  openAttachment(id: string, openInModal: boolean) {
    const attachmentId = id;

    if (this.mode === 'international_payments') {
      const item = this.checkAttachmentData.find(
        (x: ICheckAttachmentData) => x.id === String(attachmentId)
      );
      const encryptedId = item?.encrypted_id;

      this.subscriptions.push(
        this.walletService
          .getAttachmentByIdInternationalPayment(
            this.checkId,
            String(encryptedId || attachmentId)
          )
          .subscribe((res) => {
            if (res?.success) {
              const link =
                typeof res.data === 'string'
                  ? res.data
                  : res.data?.public_url;
              const ext = (link || '').split('.').pop();
              const fileExtention = ext?.substring(0, 3);

              if (openInModal && (fileExtention ?? '') === 'pdf') {
                this.openAttachmentModal(link);
                return;
              }

              const urlLoaded = window.open(link);
              if (
                !urlLoaded ||
                urlLoaded.closed ||
                typeof urlLoaded.closed === 'undefined'
              ) {
                this.openWarningAlert(
                  'A popup blocker may be preventing the application from opening the page. Try disabling it to open the window'
                );
              }
            }
          })
      );

      return;
    }

    this.subscriptions.push(
      this._checkService
        .openCheckAttachment(this.checkId, attachmentId)
        .subscribe((res) => {
          if (res?.success) {
            const link = res.data;
            const ext = link.split('.').pop(); // To get the extention

            const fileExtention = ext?.substring(0, 3);
            if (openInModal && (fileExtention ?? '') == 'pdf') {
              this.openAttachmentModal(link);
              return;
            }

            const urlLoaded = window.open(link);
            if (
              !urlLoaded ||
              urlLoaded.closed ||
              typeof urlLoaded.closed == 'undefined'
            ) {
              this.openWarningAlert(
                'A popup blocker may be preventing the application from opening the page. Try disabling it to open the window'
              );
            }
          }
        })
    );
  }

  openAttachmentModal(link: string) {
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
    const data: IConfirmAlert = {
      title: 'Alert!',
      content: 'Are you sure you want to delete this check?',
      cancelMsg: 'No, Cancel!',
      doneMsg: 'Yes, Delete it!'
    };
    return this._alertService.confirmAlert(data);
  }

  openWarningAlert(content: string): void {
    const data: IWarningAlert = {
      title: 'Error',
      content: content
    };
    this._alertService.warningAlert(data);
  }

  openSuccessAlert() {
    const data: ISuccessAlert = {
      title: 'Success!',
      content: 'Attachment deleted.',
      close: true
    };
    return this._alertService.successAlert(data);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
