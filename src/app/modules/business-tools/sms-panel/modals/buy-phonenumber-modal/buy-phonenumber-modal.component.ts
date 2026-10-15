import { Component, Inject, OnDestroy } from '@angular/core';
import {
  UntypedFormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import {
  IBuyPhonenumberDetailsModel,
  IPhonenumberDetailsModel,
  IPhonenumberUpdateModel
} from 'src/app/modules/business-tools/model/business-tools-common';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BusinessToolsService } from 'src/app/shared/service/business-tools/business-tools.service';
import { ControlMessageComponent } from '../../../../../shared/components/control-message/control-message/control-message.component';
import { MatTooltip } from '@angular/material/tooltip';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-buy-phonenumber-modal',
  templateUrl: './buy-phonenumber-modal.component.html',
  styleUrls: ['./buy-phonenumber-modal.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    MatDialogClose,
    MatTooltip,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent
  ]
})
export class BuyPhonenumberModalComponent implements OnDestroy {
  subscriptions: Subscription[] = [];
  nickName: UntypedFormControl;
  phonenoDeatils: IPhonenumberDetailsModel | IBuyPhonenumberDetailsModel;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public dialogueData: {
      mode: string;
      phnoDetails: IBuyPhonenumberDetailsModel | IPhonenumberDetailsModel;
    },
    private dialogueRef: MatDialogRef<BuyPhonenumberModalComponent>,
    private _alertService: AlertService,
    private businessToolsService: BusinessToolsService
  ) {
    this.nickName = new UntypedFormControl('', Validators.required);

    if (dialogueData?.mode == 'edit') {
      this.phonenoDeatils = <IPhonenumberDetailsModel>dialogueData.phnoDetails;
      this.nickName.setValue(this.phonenoDeatils.name);
    } else {
      this.phonenoDeatils = <IBuyPhonenumberDetailsModel>(
        dialogueData.phnoDetails
      );
    }
  }

  /**
   * @description close the modal.
   */
  buy() {
    this.dialogueRef.close({ nickName: this.nickName.value });
  }

  /**
   * @description Opens update nickname modal.
   */
  updateNickName(phonenoDeatils: IPhonenumberDetailsModel) {
    if (this.nickName.valid) {
      const SendingData: IPhonenumberUpdateModel = {
        name: this.nickName.value
      };
      this.subscriptions.push(
        this.businessToolsService
          .updatePhoneNumberNickname(phonenoDeatils.id!, SendingData)
          .subscribe((res) => {
            if (res.success) {
              const data = {
                close: true,
                timeout: 2000,
                title: 'Success!',
                content: 'Nickname updated successfully'
              };
              this._alertService.successAlert(data);
              this.dialogueRef.close(true);
            }
          })
      );
    }
  }
  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
