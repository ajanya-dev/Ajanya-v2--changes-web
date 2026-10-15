import { Component, computed, signal } from '@angular/core';
import { ICellRendererParams } from '@ag-grid-community/core';
import { AgRendererComponent } from '@ag-grid-community/angular';
import { LucideAngularModule } from 'lucide-angular';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';

interface ICategoryAction {
  label: string;
  icon: string;
  disabled?: boolean;
}

interface ICategoryActionParams extends ICellRendererParams {
  onActionClick: (row: ICellRendererParams['data'], label: string) => void;
}

@Component({
  selector: 'app-category-action-v4',
  standalone: true,
  imports: [LucideAngularModule, MatMenuTrigger, MatMenu, MatMenuItem, MatTooltip],
  template: `
    <div class="flex items-center gap-1 h-full">
      <button
        class="action-icon-btn"
        [matMenuTriggerFor]="menu"
        (click)="$event.stopPropagation()"
        matTooltip="Actions"
      >
        <lucide-icon
          name="ellipsis-vertical"
          [size]="16"
          class="v4-action-icon"
        />
      </button>

      <mat-menu #menu="matMenu" xPosition="before" class="v4-action-menu">
        <div class="v4-menu-group-label">Actions</div>
        @for (item of actions(); track item.label) {
          <button
            mat-menu-item
            [class.v4-menu-item-danger]="item.label === 'Delete'"
            [disabled]="item.disabled"
            (click)="onActionClick(item.label)"
          >
            <div class="v4-menu-item">
              <lucide-icon [name]="item.icon" [size]="16" />
              <span>{{ item.label }}</span>
            </div>
          </button>
        }
      </mat-menu>
    </div>
  `
})
export class CategoryActionV4Component implements AgRendererComponent {
  private paramsSignal = signal<ICategoryActionParams | null>(null);

  actions = computed<ICategoryAction[]>(() => [
    { label: 'Edit', icon: 'pencil', disabled: false },
    { label: 'Delete', icon: 'trash-2', disabled: false }
  ]);

  agInit(params: ICategoryActionParams): void {
    this.paramsSignal.set(params);
  }

  refresh(params: ICategoryActionParams): boolean {
    this.paramsSignal.set(params);
    return true;
  }

  onActionClick(label: string): void {
    const p = this.paramsSignal();
    p?.onActionClick?.(p.data, label);
  }
}
