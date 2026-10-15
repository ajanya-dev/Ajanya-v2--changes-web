import { Subscription } from 'rxjs';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';

import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogActions
} from '@angular/material/dialog';
import { CheckDesignService } from 'src/app/shared/service/check-design/check-design.service';
import { finalize } from 'rxjs/operators';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * @description Angular component for adding or editing a custom element.
 */
@Component({
  selector: 'app-add-custom-element',
  templateUrl: './add-custom-element.component.html',
  styleUrls: ['./add-custom-element.component.scss'],
  standalone: true,
  imports: [FormsModule, NgIf, MatDialogActions]
})
export class AddCustomElementComponent implements OnDestroy, OnInit {
  customElement = '';
  subscription: Subscription[] = [];
  submitting = false;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      id: string;
      edit: { id: number; element: string; checked: boolean };
    },
    public dialogRef: MatDialogRef<AddCustomElementComponent>,
    public checkDesignService: CheckDesignService
  ) {}

  ngOnInit() {
    if (this.data.edit.element !== '') {
      this.customElement = this.data.edit.element;
    }
  }

  /**
   * @description Adds or edits a custom element based on user input.
   */
  addElement() {
    const customField = {
      bankAccountId: this.data.id,
      customElement: this.customElement
    };
    if (this.data.edit.element === '') {
      this.submitting = true;
      this.subscription.push(
        this.checkDesignService
          .addCustomElement(customField)
          .pipe(finalize(() => (this.submitting = false)))
          .subscribe((res) => {
            if (res.success) {
              this.dialogRef.close(this.customElement);
            }
          })
      );
    } else {
      this.submitting = true;
      this.checkDesignService
        .editCustomElement(customField, this.data.edit.id)
        .pipe(finalize(() => (this.submitting = false)))
        .subscribe((res) => {
          if (res.success) {
            this.dialogRef.close({
              id: this.data.edit.id,
              element: this.customElement,
              checked: this.data.edit.checked
            });
          }
        });
    }
  }

  /**
   * @description Closes the dialog.
   */
  close() {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.subscription.forEach((el) => el?.unsubscribe());
  }
}
