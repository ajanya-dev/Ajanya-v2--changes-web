import { Component, inject } from '@angular/core';
import { MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCircleExclamation, faEnvelope, faPhone, faXmark } from '@fortawesome/pro-solid-svg-icons';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { TransferDetailsService } from 'src/app/modules/transfers/services/transfer-details.service';
import { CloudListV35Service } from 'src/app/modules/cloud-bank/cloud-bank-v3/services/cloud-list-v35.service';
import { Router } from '@angular/router';
import { CommonButtonV35Component } from '../../v3/buttons/common-button-v35/common-button-v35.component';

@Component({
  selector: 'app-cloud-close-alert-modal',
  standalone: true,
  imports: [MatDialogClose,FaIconComponent,CommonButtonV35Component],
  templateUrl: './cloud-close-alert-modal.component.html',
  styleUrl: './cloud-close-alert-modal.component.scss'
})
export class CloudCloseAlertModalComponent {
  public staticWhiteLabelConditions = StaticWhiteLabelConditions;
  private transferDetailsService = inject(TransferDetailsService);
  private cloudListV35Service = inject(CloudListV35Service);
  private router = inject(Router);
  private dialogRef = inject(MatDialogRef<CloudCloseAlertModalComponent>);

  faCircleExclamation = faCircleExclamation;
  faXmark = faXmark;
  faEnvelope = faEnvelope;
  faPhone = faPhone;

  transferMoney(): void {
    this.transferDetailsService.setData({
      transferFrom: 3,
      transferFromId:
        this.cloudListV35Service.selectedAccountSignal()?.id ?? '',
      displayName: '',
      transferFromIdForCloud:
        this.cloudListV35Service.selectedAccountSignal()?.localBankAccountId ??
        ''
    });
    this.router.navigate(['/manage/transfers']);
    this.dialogRef.close();
  }
}
