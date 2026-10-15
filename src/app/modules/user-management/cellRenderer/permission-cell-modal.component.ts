import { TitleCasePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'app-permission-cell-modal',
  imports: [FaIconComponent, MatDialogClose, TitleCasePipe],
  standalone: true,
  template: `
    <div>
      <div class="flex justify-between pb-6">
        <div>
          <span
            class="mt-18 w-full text-base text-main-text-color align-middle flex items-center"
          >
            <span class="pl-1 font-inter font-semibold text-base pb-0.5"
              >{{ data.type }} Permissions</span
            >
          </span>
        </div>
        <div [mat-dialog-close]="false">
          <fa-icon
            class="text-secondary-text-color cursor-pointer"
            [icon]="faXmark"
          ></fa-icon>
        </div>
      </div>
      <div class="flex flex-col gap-3 max-h-[500px] overflow-auto">
        @for (item of data.items; track item) {
          <span class="text-main-text-color font-inter font-normal text-sm">{{
            item | titlecase
          }}</span>
        }
      </div>
    </div>
  `
})
export class PermissionCellModalComponent {
  public data: { items: string[]; type: string } = inject(MAT_DIALOG_DATA);
  faXmark = faXmark;
}
