import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { NgClass, TitleCasePipe } from '@angular/common';
import { Component, HostBinding, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PermissionCellModalComponent } from './permission-cell-modal.component';
import { PermissionCellModalV4Component } from '../../user-management-v4/v4-modals/permission-cell-modal-v4.component';

@Component({
  selector: 'app-permission-cell',
  standalone: true,
  imports: [NgClass, TitleCasePipe],
  template: `
    @if (isV4) {
      <!-- v4 keeps the cell to a single row: the list truncates and "Show more"
           stays pinned beside it, opening the full set in a dialog. -->
      <div class="h-full w-full min-w-0 flex items-center gap-1">
        @if (hasChildren) {
          <span class="min-w-0 truncate">{{ limitedLabel }}</span>
        } @else if (value) {
          <span class="min-w-0 truncate">{{ value }}</span>
        }
        @if (value && value.length > maxItemsToShow) {
          <span
            role="presentation"
            class="shrink-0 hover:underline cursor-pointer text-v4-primary-brand-bold-color"
            (click)="openModal()"
            >Show more</span
          >
        }
      </div>
    } @else {
    <div class="h-full flex items-center">
      @if (hasChildren) {
        <div class="flex flex-wrap gap-1 items-center">
          @for (item of limitedValue; track item; let i = $index) {
            <div class="py-1">
              {{ item | titlecase }}{{ i < limitedValue.length - 1 ? ',' : '' }}
            </div>
          }
          @if (value && value.length > maxItemsToShow) {
            <div
              role="presentation"
              class="hover:underline cursor-pointer"
              [ngClass]="
                isV4
                  ? 'text-v4-primary-brand-bold-color'
                  : 'text-common-blue-color'
              "
              (click)="openModal()"
            >
              Show more
            </div>
          }
        </div>
      }
      @if (!hasChildren && value) {
        <div class="py-1">{{ value }}</div>
      }
    </div>
    }
  `,
  // Only the v4 cell is constrained. Without a bounded host the inner span has
  // no width to shrink against, so the text runs past the cell and is chopped by
  // the cell's own overflow instead of ellipsising - taking "Show more" with it.
  styles: [
    `
      :host(.v4-permission-cell) {
        display: flex;
        align-items: center;
        flex: 1 1 auto;
        width: 100%;
        min-width: 0;
        overflow: hidden;
      }
    `
  ]
})
export class PermissionCellRendererComponent
  implements ICellRendererAngularComp
{
  @HostBinding('class.v4-permission-cell') get isV4Host(): boolean {
    return this.isV4;
  }

  private dialog = inject(MatDialog);

  value: string | string[] | undefined;
  hasChildren: boolean = false;
  maxItemsToShow: number = 3;
  limitedValue: string[] = [];
  limitedLabel = '';
  modalType: string;
  isV4: boolean = false;

  agInit(params: ICellRendererParams & { type: string; isV4: boolean }): void {
    this.value = params.value;
    this.isV4 = params.isV4;
    this.hasChildren = Array.isArray(this.value) && this.value.length > 0;
    this.limitedValue = this.hasChildren
      ? (this.value?.slice(0, this.maxItemsToShow) as string[])
      : [];
    // Pre-joined for the v4 single-line cell: one text node truncates cleanly,
    // a row of sibling elements does not.
    const titleCase = new TitleCasePipe();
    this.limitedLabel = this.limitedValue
      .map((item) => titleCase.transform(item))
      .join(', ');
    this.modalType = params.type;
  }

  refresh(): boolean {
    return true;
  }

  openModal(): void {
    if (this.value) {
      if (this.isV4) {
        this.dialog.open(PermissionCellModalV4Component, {
          data: { items: this.value, type: this.modalType },
          width: '400px',
          panelClass: 'paddingless-modal-rounded'
        });
      } else {
        this.dialog.open(PermissionCellModalComponent, {
          data: { items: this.value, type: this.modalType },
          width: '400px'
        });
      }
    }
  }
}
