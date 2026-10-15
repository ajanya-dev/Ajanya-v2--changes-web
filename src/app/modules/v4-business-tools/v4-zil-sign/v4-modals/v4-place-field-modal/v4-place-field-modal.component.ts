import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LucideAngularModule } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

export interface IV4PlaceFieldModalData {
  fieldId: string;
  currentPage: number;
  totalPages: number;
}

export interface IV4PlaceFieldModalResult {
  pageRange: 'all' | 'custom';
  fromPage: number;
  toPage: number;
}

@Component({
  selector: 'app-v4-place-field-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
LucideAngularModule,
    CommonButtonV4Component
  ],
  template: `
    <div class="flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 bg-v4-secondary-background-color border-b border-v4-border-color">
        <h2 class="m-0 text-base font-semibold text-v4-main-text-color font-peridot">
          Place field(s) on other pages
        </h2>
        <button
          type="button"
          class="w-9 h-9 rounded-lg flex items-center justify-center text-v4-subtle-text-color hover:bg-v4-tertiary-background-color"
          (click)="onCancel()"
        >
          <lucide-icon name="x" [size]="16"></lucide-icon>
        </button>
      </div>

      <!-- Body -->
      <div class="p-6">
        <p class="m-0 text-sm text-v4-secondary-text-color mb-4">
          Place the selected field(s) in the same position on additional pages.
        </p>

        <div class="mb-4">
          <p class="m-0 mb-3 text-sm font-semibold text-v4-main-text-color">Page range</p>
          <div class="flex flex-col gap-3">
            <label class="flex cursor-pointer items-center gap-2">
              <input type="radio" name="pageRange" value="all" [(ngModel)]="pageRange" class="v4-radio-sm" />
              <span class="text-sm text-v4-main-text-color">All pages</span>
            </label>
            <div class="flex items-center gap-2 flex-wrap">
              <label class="flex cursor-pointer items-center gap-2">
                <input type="radio" name="pageRange" value="custom" [(ngModel)]="pageRange" class="v4-radio-sm" />
                <span class="text-sm text-v4-main-text-color">From</span>
              </label>
              <input
                type="number"
                [(ngModel)]="fromPage"
                [min]="1"
                [max]="data.totalPages"
                class="w-16 h-9 px-2 rounded border border-v4-input-border-color bg-v4-input-background-color text-sm text-v4-main-text-color text-center focus:outline-none focus:border-v4-primary-brand-color"
                [disabled]="pageRange !== 'custom'"
                (focus)="pageRange = 'custom'"
              />
              <span class="text-sm text-v4-main-text-color">To</span>
              <input
                type="number"
                [(ngModel)]="toPage"
                [min]="1"
                [max]="data.totalPages"
                class="w-16 h-9 px-2 rounded border border-v4-input-border-color bg-v4-input-background-color text-sm text-v4-main-text-color text-center focus:outline-none focus:border-v4-primary-brand-color"
                [disabled]="pageRange !== 'custom'"
                (focus)="pageRange = 'custom'"
              />
              <span class="text-sm text-v4-secondary-text-color">
                of {{ data.totalPages }} pages
              </span>
            </div>
          </div>
        </div>

        <div class="info-box rounded-lg border border-v4-border-color p-3 flex items-center gap-2">
          <lucide-icon name="info" [size]="14" class="info-text shrink-0"></lucide-icon>
          <p class="m-0 text-xs info-text">
            Fields cannot be placed on pages with different dimensions.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-v4-border-color">
        <app-common-button-v4
          [type]="{ style: 'outline', name: 'main' }"
          text="Cancel"
          (clickEvent)="onCancel()"
        />
        <app-common-button-v4
          [type]="{ style: 'primary', name: 'main' }"
          text="Apply"
          [disabled]="!isValid()"
          (clickEvent)="onConfirm()"
        />
      </div>
    </div>
  `,
  styleUrl: './v4-place-field-modal.component.scss'
})
export class V4PlaceFieldModalComponent {
  private dialogRef = inject(MatDialogRef<V4PlaceFieldModalComponent>);
  data = inject<IV4PlaceFieldModalData>(MAT_DIALOG_DATA);

  pageRange: 'all' | 'custom' = 'all';
  fromPage = 1;
  toPage = this.data?.totalPages || 1;

  isValid(): boolean {
    if (this.pageRange === 'all') return true;
    return (
      this.fromPage >= 1 &&
      this.toPage <= this.data.totalPages &&
      this.fromPage <= this.toPage
    );
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onConfirm(): void {
    if (!this.isValid()) return;
    const result: IV4PlaceFieldModalResult = {
      pageRange: this.pageRange,
      fromPage: this.pageRange === 'all' ? 1 : this.fromPage,
      toPage: this.pageRange === 'all' ? this.data.totalPages : this.toPage
    };
    this.dialogRef.close(result);
  }
}
