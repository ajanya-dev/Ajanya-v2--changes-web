import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { LucideAngularModule, X, Info, Download } from 'lucide-angular';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { IApiRes } from 'src/app/models/api';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  selector: 'app-v4-download-wire-transfer-form',
  standalone: true,
  imports: [LucideAngularModule, MatDialogClose, CommonButtonV4Component],
  templateUrl: './v4-download-wire-transfer-form.component.html',
  styleUrl: './v4-download-wire-transfer-form.component.scss'
})
export class V4DownloadWireTransferFormComponent {
  readonly XIcon = X;
  readonly InfoIcon = Info;
  readonly DownloadIcon = Download;

  data = inject(MAT_DIALOG_DATA);
  private walletService = inject(WalletService);
  private dialogRef = inject(MatDialogRef<V4DownloadWireTransferFormComponent>);
  private destroyRef = inject(DestroyRef);

  downloading = signal(false);

  get isACH(): boolean {
    return this.data.transferType === 'ACH';
  }

  get title(): string {
    return this.isACH ? 'ACH Transfer Form' : 'Wire Transfer Form';
  }

  get description(): string {
    const type = this.isACH ? 'ACH' : 'wire';
    return `We have emailed you a filled-out ${type} transfer form with all instructions. You may also download and print the form below. In order to perform a ${type} transfer, you need to email this form or take it to your local bank. You can do it online if your bank provides online ${type} transfer services. If your ${type} amount is not received within three days, this funding request will be rejected. It will be available in your wallet as soon as we receive it.`;
  }

  get noteText(): string {
    if (this.isACH) {
      return 'Please note that this is a filled-in form for your convenience. It is your responsibility to initiate a ACH transfer with your bank by contacting them online, by email, by phone, or by visiting their branch.';
    }
    return 'Please note that this is a filled-in form for your convenience. It is your responsibility to initiate a wire transfer with your bank by contacting them online, by email, by phone, or by visiting their branch. Wires cannot be debited (pulled) from your account, like ACH.';
  }

  downloadWireForm(): void {
    if (this.downloading()) return;
    this.downloading.set(true);

    const request$ =
      this.data.fundingBank === '2'
        ? this.walletService.outsideWireApplicationForm(
            this.data.applicationUuid
          )
        : this.walletService.wireApplicationForm(this.data.applicationUuid);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: IApiRes<{ url: string }>) => {
        if (res?.success) {
          window.open(res.data.url);
          this.dialogRef.close();
        }
        this.downloading.set(false);
      },
      error: () => {
        this.downloading.set(false);
      }
    });
  }
}
