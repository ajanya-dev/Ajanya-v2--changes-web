import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LucideAngularModule } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

export interface IRecipientFieldCount {
  recipientName: string;
  recipientEmail: string;
  fieldCount: number;
}

export interface IV4ConfirmSignModalData {
  recipients: IRecipientFieldCount[];
}

@Component({
  selector: 'app-v4-confirm-sign-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, CommonButtonV4Component],
  template: `
    <div class="v4-confirm-sign-modal bg-v4-popup-background-color rounded-xl p-5 w-full">
      <div class="flex items-start justify-between mb-4">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center"
            [style.background-color]="'var(--v4-badge-info-bg-color)'"
          >
            <lucide-icon
              name="send"
              [size]="20"
              [style.color]="'var(--v4-common-sky-color)'"
            ></lucide-icon>
          </div>
          <div>
            <h2 class="m-0 text-base font-semibold text-v4-main-text-color font-funnel">
              Send for Signature
            </h2>
            <p class="m-0 text-xs text-v4-secondary-text-color font-peridot">
              Review recipients before sending
            </p>
          </div>
        </div>
        <button
          type="button"
          class="w-8 h-8 rounded-md flex items-center justify-center text-v4-secondary-text-color hover:bg-v4-tertiary-background-color"
          (click)="onCancel()"
          title="Close"
        >
          <lucide-icon name="x" [size]="16"></lucide-icon>
        </button>
      </div>

      <div class="flex flex-col gap-2 mb-5">
        @for (r of data.recipients; track r.recipientEmail) {
          <div class="flex items-center justify-between gap-3 p-3 rounded-lg border border-v4-border-color bg-v4-input-background-color">
            <div class="flex flex-col min-w-0">
              <span class="text-sm font-medium text-v4-main-text-color font-peridot truncate">{{ r.recipientName }}</span>
              <span class="text-xs text-v4-secondary-text-color font-peridot truncate">{{ r.recipientEmail }}</span>
            </div>
            <span class="text-xs font-semibold text-v4-primary-brand-bold-color font-peridot flex-shrink-0">
              {{ r.fieldCount }} field{{ r.fieldCount === 1 ? '' : 's' }}
            </span>
          </div>
        }
      </div>

      <div class="flex items-center justify-end gap-3">
        <app-common-button-v4
          [type]="{ style: 'outline', name: 'main' }"
          text="Cancel"
          (clickEvent)="onCancel()"
        />
        <app-common-button-v4
          [type]="{ style: 'primary', name: 'main' }"
          text="Send"
          (clickEvent)="onConfirm()"
        />
      </div>
    </div>
  `,
})
export class V4ConfirmSignModalComponent {
  private dialogRef = inject(MatDialogRef<V4ConfirmSignModalComponent>);
  data = inject<IV4ConfirmSignModalData>(MAT_DIALOG_DATA);

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
