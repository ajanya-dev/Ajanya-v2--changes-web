import { Component, inject } from '@angular/core';
import { MatDialogRef, MatDialogClose } from '@angular/material/dialog';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import {
  faBank,
  faClock,
  faPrint,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

/**
 * @description Component for displaying an alert for accepting payment request
 */
@Component({
  selector: 'app-accept-request',
  templateUrl: './accept-request.component.html',
  styleUrls: ['./accept-request.component.scss'],
  standalone: true,
  imports: [MatDialogClose, FaIconComponent, CommonButtonV35Component]
})
export class AcceptRequestComponent {
  public dialogRef = inject(MatDialogRef<AcceptRequestComponent>);

  optionList = [
    {
      title: 'Print the check and deposit.',
      btnType: { style: 'modal', name: 'main' },
      id: 'id_print',
      name: 'Print',
      icon: faPrint
    },
    {
      title: 'Directly Deposit to your bank account.',
      btnType: { style: 'filled', name: 'main' },
      id: 'id_dd',
      name: 'DD',
      icon: faBank
    },
    {
      title: 'You can do this action later.',
      btnType: { style: 'bordered', name: 'main' },
      id: 'id_later',
      name: 'Do later',
      icon: faClock
    }
  ];

  title = 'Accepted successfully, Now you can do.';
  faXmark = faXmark;

  onClick(id: string) {
    this.dialogRef.close(id);
  }
}
