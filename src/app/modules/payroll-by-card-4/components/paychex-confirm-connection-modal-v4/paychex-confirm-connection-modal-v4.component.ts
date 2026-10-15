import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CircleQuestionMark, LucideAngularModule, X } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  selector: 'app-paychex-confirm-connection-modal-v4',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, CommonButtonV4Component],
  templateUrl: './paychex-confirm-connection-modal-v4.component.html',
  styleUrl: './paychex-confirm-connection-modal-v4.component.scss'
})
export class PaychexConfirmConnectionModalV4Component {
  private dialogRef = inject(
    MatDialogRef<PaychexConfirmConnectionModalV4Component>
  );

  private dialogData: { displayId: string } = inject(MAT_DIALOG_DATA);

  readonly XIcon = X;
  readonly CircleQuestionIcon = CircleQuestionMark;

  readonly displayId = this.dialogData?.displayId ?? '';

  readonly steps = [
    'Sign in to your Paychex account.',
    'Open the Zil Money integration request in your notifications or in App Hub within your Paychex account.',
    'Approve access, then return here and select Yes.'
  ];

  /**
   * @description Closes with `true` when the user confirms they approved the
   * request in Paychex, `false` for cancel / X.
   */
  close(confirmed: boolean): void {
    this.dialogRef.close(confirmed);
  }
}
