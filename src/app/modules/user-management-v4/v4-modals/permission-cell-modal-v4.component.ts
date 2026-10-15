import { TitleCasePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-permission-cell-modal-v4',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, MatDialogClose, TitleCasePipe],
  template: `
    <div class="font-peridot">
      <!-- Header -->
      <div
        class="flex items-center justify-between px-6 py-4 bg-v4-popup-header-footer-color border-b border-v4-border-color"
      >
        <div class="flex items-center gap-3">
          <div>
            <h2 class="text-lg font-bold text-v4-main-text-color">
              {{ data.type }} Permissions
            </h2>
            <p class="text-xs text-v4-secondary-text-color">
              {{ filteredItems.length }} of {{ data.items.length }} permissions
            </p>
          </div>
        </div>
        <button
          type="button"
          [mat-dialog-close]="false"
          aria-label="Close"
          class="w-9 h-9 rounded-lg flex justify-center items-center text-v4-subtle-text-color hover:bg-v4-tertiary-background-color hover:text-v4-main-text-color transition-colors cursor-pointer"
        >
          <lucide-icon name="x" [size]="20"></lucide-icon>
        </button>
      </div>

      <!-- Body -->
      <div
        class="p-6 bg-v4-tertiary-background-color max-h-[60vh] overflow-y-auto"
      >
        @if (data.items.length > 5) {
          <div class="relative mb-4">
            <lucide-icon
              name="search"
              [size]="16"
              class="absolute left-1 top-1/2 -translate-y-1/2 text-v4-subtle-text-color pointer-events-none"
            ></lucide-icon>
            <input
              type="text"
              placeholder="Search permissions..."
              [(ngModel)]="searchTerm"
              class="w-full pl-9 pr-9 py-2 text-sm bg-v4-secondary-background-color border border-v4-border-color rounded-lg text-v4-main-text-color placeholder:text-v4-subtle-text-color focus:outline-none focus:border-v4-primary-brand-color transition-colors"
            />
            @if (searchTerm) {
              <button
                type="button"
                (click)="searchTerm = ''"
                aria-label="Clear search"
                class="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded flex justify-center items-center text-v4-subtle-text-color hover:bg-v4-tertiary-background-color hover:text-v4-main-text-color transition-colors cursor-pointer"
              >
                <lucide-icon name="x" [size]="14"></lucide-icon>
              </button>
            }
          </div>
        }

        @if (filteredItems.length > 0) {
          <div class="flex flex-wrap gap-2">
            @for (item of filteredItems; track item) {
              <span
                class="px-3 py-1.5 rounded-full bg-v4-secondary-background-color border border-v4-border-color text-sm text-v4-main-text-color"
              >
                {{ item | titlecase }}
              </span>
            }
          </div>
        } @else {
          <div
            class="flex flex-col items-center justify-center py-10 text-center"
          >
            <lucide-icon
              name="search-x"
              [size]="32"
              class="text-v4-subtle-text-color mb-2"
            ></lucide-icon>
            <p class="text-sm text-v4-secondary-text-color">
              No permissions match "{{ searchTerm }}"
            </p>
          </div>
        }
      </div>
    </div>
  `
})
export class PermissionCellModalV4Component {
  public data: { items: string[]; type: string } = inject(MAT_DIALOG_DATA);
  searchTerm: string = '';

  get filteredItems(): string[] {
    const term = this.searchTerm.trim().toLowerCase();
    const items = this.data?.items ?? [];
    if (!term) return items;
    return items.filter((item) => item.toLowerCase().includes(term));
  }
}
