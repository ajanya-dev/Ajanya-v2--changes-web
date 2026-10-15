import { Component, OnInit, inject } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'app-group-name-modal',
  templateUrl: './group-name-modal.component.html',
  styleUrls: ['./group-name-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    MatTooltip,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    MatDialogActions
  ]
})
export class GroupNameModalComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<GroupNameModalComponent>);
  matDialogData = inject(MAT_DIALOG_DATA);
  groupName = new FormControl('');

  ngOnInit(): void {
    this.groupName.setValue(this.matDialogData?.groupName ?? '');
  }

  submit() {
    this.dialogRef.close({
      groupName: this.groupName.value
    });
  }
}
