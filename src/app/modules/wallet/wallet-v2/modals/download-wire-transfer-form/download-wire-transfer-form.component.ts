import { Component, Inject, OnDestroy } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { IApiRes } from 'src/app/models/api';
import { OcwPreventMultiClickDirective } from '../../../../../directive/ocw-prevent-multi-click.directive';

@Component({
  selector: 'app-download-wire-transfer-form',
  templateUrl: './download-wire-transfer-form.component.html',
  styleUrls: ['./download-wire-transfer-form.component.scss'],
  standalone: true,
  imports: [MatDialogClose, OcwPreventMultiClickDirective, MatDialogActions]
})
export class DownloadWireTransferFormComponent implements OnDestroy {
  subscriptions: Subscription[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private walletsService: WalletService,
    private dialogRef: MatDialogRef<DownloadWireTransferFormComponent>
  ) {}

  downloadWireForm() {
    if (this.data.fundingBank === '2') {
      this.subscriptions.push(
        this.walletsService
          .outsideWireApplicationForm(this.data.applicationUuid)
          .subscribe((data: IApiRes<{ url: string }>) => {
            if (data?.success) {
              window.open(data.data.url);
              this.dialogRef.close();
            }
          })
      );
    } else {
      this.subscriptions.push(
        this.walletsService
          .wireApplicationForm(this.data.applicationUuid)
          .subscribe((data: IApiRes<{ url: string }>) => {
            if (data?.success) {
              window.open(data.data.url);
              this.dialogRef.close();
            }
          })
      );
    }
  }

  redirect() {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }
}
