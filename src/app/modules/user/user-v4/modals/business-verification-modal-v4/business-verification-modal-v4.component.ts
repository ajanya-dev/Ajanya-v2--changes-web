import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal
} from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import {
  LucideAngularModule,
  ShieldCheck,
  X,
  CheckCircle2,
  Clock
} from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  selector: 'app-business-verification-modal-v4',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, CommonButtonV4Component],
  templateUrl: './business-verification-modal-v4.component.html',
  styleUrl: './business-verification-modal-v4.component.scss'
})
export class BusinessVerificationModalV4Component {
  readonly ShieldCheck = ShieldCheck;
  readonly X = X;
  readonly CheckCircle2 = CheckCircle2;
  readonly Clock = Clock;

  private dialogRef = inject(
    MatDialogRef<BusinessVerificationModalV4Component>
  );

  loading = signal(false);

  readonly checklist = ['Formation Document'];

  readonly soleProprietorChecklist = ['Proof Of Address', 'Bank Statement'];

  startVerification(): void {
    this.dialogRef.close({ startVerification: true });
  }

  close(): void {
    this.dialogRef.close();
  }
}
