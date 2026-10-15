import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  input,
  OnChanges,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { OpenAttachmentModalComponent } from 'src/app/modules/check/modal/open-attachment-modal/open-attachment-modal.component';
import { V4AddAttachmentModalComponent } from 'src/app/shared/modal/v4-add-attachment-modal/v4-add-attachment-modal.component';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { DepositSlipsService } from 'src/app/shared/service/deposit-slips/deposit-slips.service';
import {
  CommonButtonV4Component
} from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    MatTooltipModule,
    CommonButtonV4Component
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-deposit-slip-attachments-v4',
  templateUrl: './deposit-slip-attachments-v4.component.html',
  styleUrls: ['./deposit-slip-attachments-v4.component.scss']
})
export class DepositSlipAttachmentsV4Component implements OnChanges {
  slipId = input<string>('');
  private depositSlipService = inject(DepositSlipsService);
  private dialog = inject(MatDialog);
  private v4AlertService = inject(V4AlertService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  depositSlipAttachmentData: Record<string, string>[] = [];
  isLoading = signal(false);

  ngOnChanges() {
    if (this.slipId()) {
      this.loadAttachments();
    }
  }

  loadAttachments() {
    this.isLoading.set(true);
    this.depositSlipService
      .getDepositSlipAttachments(this.slipId())
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.depositSlipAttachmentData = res.data;
          this.cdr.detectChanges();
        }
      });
  }

  addAttachment() {
    const dialogRef = this.dialog.open(V4AddAttachmentModalComponent, {
      maxWidth: '600px',
      width: '93%',
      panelClass: 'paddingless-modal-rounded',
      data: {
        id: this.slipId(),
        type: 'deposit-slips',
        enableDelete: true
      }
    });
    dialogRef.afterClosed().subscribe(() => {
      this.loadAttachments();
    });
  }

  onDeleteAttachment(id: string) {
    const alert = this.v4AlertService.confirmAlert({
      title: 'Confirm',
      content: 'Are you sure you want to delete this deposit slip attachment?',
      cancelMsg: 'No, Cancel!',
      doneMsg: 'Yes, Delete it!'
    });
    alert.afterClosed().subscribe((res) => {
      if (res) {
        this.depositSlipService
          .deleteDepositSlipAttachment(this.slipId(), id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((apiRes) => {
            if (apiRes.success === true) {
              this.v4AlertService.successAlert({
                title: 'Success!',
                content: 'Attachment deleted',
                close: true
              });
              for (const [i, value] of this.depositSlipAttachmentData.entries()) {
                if (value.encrypted_id === id) {
                  this.depositSlipAttachmentData.splice(i, 1);
                }
              }
              this.cdr.detectChanges();
            }
          });
      }
    });
  }

  openAttachment(id: string, openInModal: boolean) {
    this.depositSlipService
      .openDepositSlipAttachment(this.slipId(), id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success === true) {
          const link = res.data;
          const ext = link.split('.').pop();
          if (ext) {
            const fileExtention = ext.substring(0, 3);
            if (openInModal && (fileExtention ?? '').toLowerCase() === 'pdf') {
              this.dialog.open(OpenAttachmentModalComponent, {
                maxWidth: '1100px',
                width: '95%',
                height: '90%',
                data: { link }
              });
              return;
            }
          }
          window.open(link);
        }
      });
  }
}
