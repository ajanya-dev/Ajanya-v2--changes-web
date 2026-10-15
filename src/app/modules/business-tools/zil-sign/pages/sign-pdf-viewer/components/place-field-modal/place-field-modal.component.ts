import { Component, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { MatRadioModule } from '@angular/material/radio';

export interface IPlaceFieldModalData {
  fieldId: string;
  currentPage: number;
  totalPages: number;
}

export interface IPlaceFieldModalResult {
  pageRange: 'all' | 'custom';
  fromPage: number;
  toPage: number;
}

@Component({
  selector: 'app-place-field-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, FaIconComponent, CommonButtonV35Component, MatRadioModule],
  template: `
    <div class="px-[6px] pb-[6px]">
      <!-- modal header -->
      <div class="flex justify-between pb-6">
        <div>
          <span class="mt-18 w-full text-base text-main-text-color align-middle flex items-center">
            <span class="pl-1 font-inter font-semibold text-base pb-0.5">Place field(s) on other pages</span>
          </span>
        </div>
        <div (click)="onCancel()" class="cursor-pointer">
          <fa-icon class="text-secondary-text-color" [icon]="faXmark"></fa-icon>
        </div>
      </div>

      <!-- modal body start -->
      <div>
        <p class="text-sm text-main-text-color mb-5">
          Place the selected field(s) in the exact same position on other pages in:
        </p>

        <!-- Page range section -->
        <div class="mb-4">
          <p class="text-sm font-semibold text-main-text-color mb-3">Page range</p>

          <mat-radio-group [(ngModel)]="pageRange" class="flex flex-col gap-3">
            <mat-radio-button value="all" color="primary">
              <span class="text-sm text-main-text-color">All pages</span>
            </mat-radio-button>

            <div class="flex items-center gap-2">
              <mat-radio-button value="custom" color="primary">
                <span class="text-sm text-main-text-color">From</span>
              </mat-radio-button>
              <input
                type="number"
                [(ngModel)]="fromPage"
                [min]="1"
                [max]="data.totalPages"
                class="w-14 px-2 py-1 border border-input-border-color rounded text-sm text-main-text-color bg-main-background-color text-center"
                [disabled]="pageRange !== 'custom'"
                (focus)="pageRange = 'custom'"
              />
              <span class="text-sm text-main-text-color">To</span>
              <input
                type="number"
                [(ngModel)]="toPage"
                [min]="1"
                [max]="data.totalPages"
                class="w-14 px-2 py-1 border border-input-border-color rounded text-sm text-main-text-color bg-main-background-color text-center"
                [disabled]="pageRange !== 'custom'"
                (focus)="pageRange = 'custom'"
              />
              <span class="text-sm text-secondary-text-color">out of {{ data.totalPages }} pages.</span>
            </div>
          </mat-radio-group>
        </div>

        <!-- Note -->
        <div class="bg-secondary-background-color border border-input-border-color rounded-md p-3 mt-4">
          <p class="text-xs text-secondary-text-color">
            <span class="font-semibold">Note:</span> Field(s) cannot be placed in the pages with different dimensions
          </p>
        </div>
      </div>
      <!-- modal body end -->

      <div class="flex justify-end gap-3 pt-8">
        <app-common-button-v35
          [type]="{style:'bordered', name: 'main' }"
          text="Cancel"
          (click)="onCancel()">
        </app-common-button-v35>
        <app-common-button-v35
          [type]="{style:'modal', name: 'main' }"
          text="Ok"
          (click)="onConfirm()"
          [disabled]="!isValid()">
        </app-common-button-v35>
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep .mat-mdc-radio-button .mdc-radio__outer-circle {
      border-color: var(--secondary-text-color);
    }
    :host ::ng-deep .mat-mdc-radio-button.mat-mdc-radio-checked .mdc-radio__outer-circle {
      border-color: var(--common-green-color);
    }
    :host ::ng-deep .mat-mdc-radio-button.mat-mdc-radio-checked .mdc-radio__inner-circle {
      background-color: var(--common-green-color);
      border-color: var(--common-green-color);
    }
    input:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class PlaceFieldModalComponent {
  private dialogRef = inject(MatDialogRef<PlaceFieldModalComponent>);
  public data = inject<IPlaceFieldModalData>(MAT_DIALOG_DATA);

  faXmark = faXmark;

  pageRange: 'all' | 'custom' = 'all';
  fromPage = 1;
  toPage: number;

  constructor() {
    this.toPage = this.data?.totalPages || 1;
  }

  isValid(): boolean {
    if (this.pageRange === 'all') {
      return true;
    }
    return this.fromPage >= 1 &&
           this.toPage <= this.data.totalPages &&
           this.fromPage <= this.toPage;
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onConfirm(): void {
    if (!this.isValid()) return;

    const result: IPlaceFieldModalResult = {
      pageRange: this.pageRange,
      fromPage: this.pageRange === 'all' ? 1 : this.fromPage,
      toPage: this.pageRange === 'all' ? this.data.totalPages : this.toPage
    };
    this.dialogRef.close(result);
  }
}
