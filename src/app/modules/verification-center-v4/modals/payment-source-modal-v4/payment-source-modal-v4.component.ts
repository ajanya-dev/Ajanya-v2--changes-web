import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { NgClass } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import {
  LucideAngularModule,
  Check,
  CreditCard,
  Landmark,
  LoaderCircle,
  Lock,
  X
} from 'lucide-angular';
import { OpenAddCardV4Service } from 'src/app/shared/service/open-add-card/open-add-card-v4.service';
import {
  PaymentSourceKind,
  PaymentSourceResult
} from '../../models/verification-v4.model';

interface SourceOption {
  key: PaymentSourceKind;
  title: string;
  description: string;
  tag: string;
  tagClasses: string;
  icon: typeof Landmark;
}

@Component({
  selector: 'app-payment-source-modal-v4',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, LucideAngularModule],
  templateUrl: './payment-source-modal-v4.component.html'
})
export class PaymentSourceModalV4Component {
  readonly Check = Check;
  readonly LoaderCircle = LoaderCircle;
  readonly Lock = Lock;
  readonly X = X;

  private dialogRef =
    inject<MatDialogRef<PaymentSourceModalV4Component, PaymentSourceResult>>(
      MatDialogRef
    );
  private openAddCardService = inject(OpenAddCardV4Service);
  private destroyRef = inject(DestroyRef);

  selected = signal<PaymentSourceKind | null>(null);
  /** Card path fetches a token before its dialog opens — hold the loader. */
  loading = signal(false);

  readonly options: SourceOption[] = [
    {
      key: 'bank',
      title: 'Bank account',
      description:
        'Connect and verify your bank. Enables ACH, Wire & Same Day ACH.',
      tag: 'Verification needed',
      tagClasses: 'bg-v4-surface-warning-bold text-v4-text-warning',
      icon: Landmark
    },
    {
      key: 'card',
      title: 'Credit card',
      description: 'Enter your card details — added instantly, no verification.',
      tag: 'Instant',
      tagClasses: 'bg-v4-badge-success-bg-color text-v4-badge-success-text-color',
      icon: CreditCard
    }
  ];

  select(key: PaymentSourceKind): void {
    this.selected.set(key);
  }

  continue(): void {
    const choice = this.selected();
    if (!choice || this.loading()) return;

    if (choice === 'bank') {
      this.dialogRef.close({ kind: 'bank' });
      return;
    }

    this.loading.set(true);
    this.openAddCardService
      .openAddCard()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (cardModal) =>
          this.dialogRef.close({
            kind: 'card',
            cardModal: cardModal ?? undefined
          }),
        error: () => this.loading.set(false)
      });
  }

  close(): void {
    if (this.loading()) return;
    this.dialogRef.close();
  }
}
