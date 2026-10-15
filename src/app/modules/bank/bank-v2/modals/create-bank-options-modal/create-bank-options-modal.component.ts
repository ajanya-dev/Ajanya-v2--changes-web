import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  inject
} from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChooseBankOptionModalComponent } from 'src/app/shared/yodlee/components/choose-bank-option-modal/choose-bank-option-modal.component';
import { YodleeParentModalComponent } from 'src/app/shared/yodlee/components/yodlee-parent-modal/yodlee-parent-modal.component';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { NgClass, NgIf } from '@angular/common';
import { environment } from 'src/environments/environment';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';

@Component({
  selector: 'app-create-bank-options-modal',
  templateUrl: './create-bank-options-modal.component.html',
  styleUrls: ['./create-bank-options-modal.component.scss'],
  standalone: true,
  imports: [NgClass, NgIf, MatDialogClose]
})
export class CreateBankOptionsModalComponent implements OnInit, OnDestroy {
  @Optional() public dialogueData: { mode?: string } = inject(MAT_DIALOG_DATA);
  private dialog = inject(MatDialog);
  private bankAccService = inject(BankAccountsService);
  @Optional() public dialogRef = inject(
    MatDialogRef<CreateBankOptionsModalComponent>
  );

  private router = inject(Router);
  private personaHelperService = inject(PersonaHelperService);
  private alertService = inject(AlertService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);

  subscriptions: Subscription[] = [];
  @Input() componentConfigData: { mode?: string };
  @Output() optionSelected = new EventEmitter();
  showPortal = false;
  mode: string;

  ngOnInit(): void {
    this.modeCheck();
  }

  /**
   * @description Checks the mode for the component.
   */
  modeCheck() {
    if (this.dialogueData?.mode) {
      this.mode = this.dialogueData?.mode;
    } else if (this.componentConfigData?.mode) {
      this.mode = this.componentConfigData?.mode;
    }
  }
  //= ====================checking can apply for create  cloud bank======================
  /**
   * @description  Checks if the user can apply for a cloud bank account.
   * Based on the response navigate to diffrent page.
   */

  canApply() {}

  /**
   * @description Handles the action of adding bank manually.
   * The behavior varies based on the mode.
   */
  addManually() {
    if (this.mode === 'adp') {
      this.dialogRef.close({ isAddManually: true });
    } else if (this.mode === 'outside-verify') {
      this.optionSelected.emit({ isAddManually: true });
    } else {
      this.router.navigate(['/manage/users/add-bank-manually']);
      this.dialogRef.close();
    }
  }

  /**
   * @description  Handles the action of linking the bank account instantly.
   * The behavior varies based on the mode and the presence of unlinked accounts.
   */
  linkInstantly() {
    this.subscriptions.push(
      this.bankAccService.getUnlinkedAccounts().subscribe({
        next:(res) => {
          if (res.success) {
            if (res.data.unlinkedAccounts > 0) {
              if (this.mode === 'outside-verify') {
                this.optionSelected.emit({ isAddInstantly: true, data: res });
              } else {
                this.dialog.open(ChooseBankOptionModalComponent, {
                  maxWidth: '470px',
                  width: '93%',
                  disableClose: true,
                  autoFocus: false,
                  data: res
                });
                this.dialogRef.close();
              }
            } else {
              const data = {
                mode: 'connect_new_bank'
              };
              if (this.mode === 'outside-verify') {
                this.optionSelected.emit({ isAddInstantly: true, data });
              } else {
                this.dialog.open(YodleeParentModalComponent, {
                  disableClose: true,
                  autoFocus: false,
                  data,
                  panelClass: 'yodlee-modal-new'
                });
                this.dialogRef.close();
              }
            }
          }
        },
        error:(err => {
          if(err.error.errorCode === 517){
            if (environment.isV4Persona) {
              this.personaHelperService
                .openModal('kyc', CVSourceType.getting_started_v3)
                .subscribe();
            } else {
              this.router.navigateByUrl('/manage/users/verify-user-id?type=8');
            }
          }else if(err.error.errorCode === 520){
            this.handleVerificationError('Your personal verification is under the verification process .Please contact our support team for faster approval.');
          }else if(err.error.errorCode === 521){
            this.handleVerificationError('Your personal verification has been rejected.Please contact support team for more information.');
          }
        })
      })
    );
  }

  handleVerificationError(msg: string): void {
    const action =  this.alertService.infoAlert({
      content: `${msg}`,
      cancelMsg: 'Not Now',
      isCancel: true,
      isOk: true,
      doneMsg: 'Contact Now'
    });
    action.afterClosed().subscribe(res => {
      if(res){
        this.dynamicWhiteLabelService.goToLiveChat();
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
