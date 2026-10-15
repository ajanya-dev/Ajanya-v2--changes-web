import { Component, inject } from '@angular/core';
import { MatDialogRef, MatDialogClose } from '@angular/material/dialog';
import { LucideAngularModule, X, CircleCheckBig } from 'lucide-angular';
import {
  CommonButtonV4Component,
  TCButtonType
} from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

interface IAcceptOption {
  title: string;
  btnType: TCButtonType;
  id: string;
  name: string;
  icon: string;
  bgColor?: string;
  textColor?: string;
}

@Component({
  selector: 'app-v4-accpet-request-modal',
  standalone: true,
  imports: [MatDialogClose, LucideAngularModule, CommonButtonV4Component],
  templateUrl: './v4-accpet-request-modal.component.html',
  styleUrl: './v4-accpet-request-modal.component.scss'
})
export class V4AccpetRequestModalComponent {
  private dialogRef = inject(MatDialogRef<V4AccpetRequestModalComponent>);

  readonly XIcon = X;
  readonly CircleCheckBigIcon = CircleCheckBig;

  title = 'Accepted successfully, Now you can do.';

  optionList: IAcceptOption[] = [
    {
      title: 'Print the check and deposit.',
      btnType: { style: 'primary', name: 'main' },
      id: 'id_print',
      name: 'Print',
      icon: 'printer',
      bgColor: 'var(--v4-primary-brand-color)',
      textColor: 'var(--v4-secondary-brand-color)'
    },
    {
      title: 'Directly Deposit to your bank account.',
      btnType: { style: 'primary', name: 'main' },
      id: 'id_dd',
      name: 'DD',
      icon: 'building-2',
      bgColor: 'var(--v4-secondary-brand-color)',
      textColor: 'black'
    },
    {
      title: 'You can do this action later.',
      btnType: { style: 'outline', name: 'main' },
      id: 'id_later',
      name: 'Do later',
      icon: 'clock'
    }
  ];

  onClick(id: string) {
    this.dialogRef.close(id);
  }
}
