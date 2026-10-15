import { Component, inject, OnInit } from '@angular/core';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideAngularModule, X, Info } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';

@Component({
  selector: 'app-v4-group-name-modal',
  standalone: true,
  imports: [
    CommonButtonV4Component,
    MatDialogClose,
    LucideAngularModule,
    CommonInputFieldV4Component,
    FormsModule,
    ReactiveFormsModule,
    MatTooltipModule
  ],
  templateUrl: './v4-group-name-modal.component.html',
  styleUrl: './v4-group-name-modal.component.scss'
})
export class V4GroupNameModalComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<V4GroupNameModalComponent>);
  matDialogData = inject(MAT_DIALOG_DATA);
  groupName = new FormControl('', Validators.required);

  readonly XIcon = X;
  readonly InfoIcon = Info;

  ngOnInit(): void {
    this.groupName.setValue(this.matDialogData?.groupName ?? '');
  }

  submit() {
    if (this.groupName.invalid) {
      this.groupName.markAsTouched();
      return;
    }
    this.dialogRef.close({
      groupName: this.groupName.value
    });
  }
}
