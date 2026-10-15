import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose
} from '@angular/material/dialog';
import { IInfoAlert } from 'src/app/models/alert';
import { NgIf } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ControlMessageComponent } from 'src/app/shared/components/control-message/control-message/control-message.component';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';

/**
 * @description Component for info alert dialog.
 */
@Component({
  selector: 'app-info-alert',
  templateUrl: './info-alert.component.html',
  styleUrls: ['./info-alert.component.scss'],
  standalone: true,
  imports: [NgIf, MatDialogActions, MatDialogClose, FormsModule, ReactiveFormsModule, ControlMessageComponent]
})
export class InfoAlertComponent implements OnInit {
  title: string | boolean = 'Info';
  content :SafeHtml|string = "You won't be able to revert this!";
  doneMsg = 'OK';
  cancelMsg = 'Cancel';
  close = false;
  timeout = 1000;
  isOk = true;
  isCancel = false;
  isInputRequired = false;
  inputPlaceholder = '';
  inputValue = new FormControl('');
  isSubmitted = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) private _data: IInfoAlert,
    public dialogRef: MatDialogRef<InfoAlertComponent>,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    if (this._data) {
      this.title = this._data.title
        ? this._data.title
        : this._data.title == false
          ? (this.title = '')
          : this.title;
      this.content = this._data.content ? this.sanitizer.bypassSecurityTrustHtml(this._data.content) : ' ';
      this.doneMsg = this._data.doneMsg ? this._data.doneMsg : 'OK';
      this.cancelMsg = this._data.cancelMsg ? this._data.cancelMsg : 'Cancel';
      this.close = this._data.close ? this._data.close : false;
      this.timeout = this._data.timeout ? this._data.timeout : this.timeout;
      this.isCancel = this._data.isCancel ? this._data.isCancel : this.isCancel;
      this.isOk = this._data.isOk ? this._data.isOk : this.isOk;
      this.isInputRequired = this._data.isInputRequired ? this._data.isInputRequired : this.isInputRequired;
      this.inputPlaceholder = this._data.inputPlaceholder ? this._data.inputPlaceholder : 'Enter email address';
    }

    if(this.isInputRequired){
      this.inputValue.setValidators([Validators.required, ValidationService.emailValidator]);
      this.inputValue.updateValueAndValidity();
    }

    if (this.close) {
      setTimeout(() => {
        this.dialogRef.close(true);
      }, this.timeout);
    }
  }

  /**
   * @description Closes the dialog.
   */
  done() {
    if(this.isInputRequired){
      this.isSubmitted = true;
      this.inputValue.markAsTouched();
      
      if(this.inputValue.valid){
        this.dialogRef.close({inputValue: this.inputValue.value});
      }
      // Don't close the dialog if validation fails
      return;
    } else {
      this.dialogRef.close(true);
    }
  }
}
