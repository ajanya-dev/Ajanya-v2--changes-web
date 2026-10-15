import {
  UntypedFormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { Component, Inject, OnDestroy } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { CybersourceService } from 'src/app/shared/service/cybersource/cybersource.service';
import { Subscription } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { NgIf, NgFor, NgStyle, NgClass } from '@angular/common';
import { ControlMessageComponent } from '../../../components/control-message/control-message/control-message.component';

/**
 * @description Modal component for adding new credit card.
 */
@Component({
  selector: 'app-new-credit-card-modal',
  templateUrl: './new-credit-card-modal.component.html',
  styleUrls: ['./new-credit-card-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    NgIf,
    NgFor,
    NgStyle,
    NgClass,
    MatDialogActions
  ]
})
export class NewCreditCardModalComponent implements OnDestroy {
  subscriptions: Subscription[] = [];
  mode: 'ADD' | 'EDIT' = 'ADD';
  nickName = new UntypedFormControl('', Validators.required);
  colorList = [
    { bgColor: '#E5F8F2' },
    { bgColor: '#EDEBFF' },
    { bgColor: '#E9F3FF' },
    { bgColor: '#FAEFF5' }
  ];

  selectedColor: string;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    private dialogData: {
      mode: 'ADD' | 'EDIT';
      cardId: string;
      nickName: string;
    },
    private _dialogRef: MatDialogRef<NewCreditCardModalComponent>,
    private _cyberSourceService: CybersourceService,
    private alertService: AlertService
  ) {
    if (this.dialogData?.mode) {
      this.mode = this.dialogData.mode;
      this.nickName.setValue(this.dialogData?.nickName ?? '');
    }
  }

  /**
   * @description Method for adding the card.
   */
  addCard() {
    if (this.nickName.invalid) {
      return;
    }

    this._dialogRef.close({
      nickName: this.nickName.value,
      bgColor: this.selectedColor
    });
  }

  /**
   * @description Method for updating the card by posting the data to `updateCard` method of `this._cyberSourceService`.
   * @returns
   */
  updateCard() {
    if (this.nickName.invalid) {
      return;
    }
    const sendingData = {
      nickName: this.nickName.value
    };
    this.subscriptions.push(
      this._cyberSourceService
        .updateCard(this.dialogData.cardId, sendingData,false)
        .subscribe((res) => {
          if (res?.success) {
            this.alertService.successAlert({ content: 'Updated Successfully' });
            this._dialogRef.close({ nickName: this.nickName.value });
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
