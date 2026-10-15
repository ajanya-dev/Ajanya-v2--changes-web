import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ICellRendererParams } from '@ag-grid-community/core';
import { AgRendererComponent } from '@ag-grid-community/angular';
import { LucideAngularModule } from 'lucide-angular';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';

interface IInvoiceItemAction {
  label: string;
  icon: string;
}

interface IInvoiceItemActionGroup {
  title: string;
  items: IInvoiceItemAction[];
}

interface IV4InvoiceItemActionParams extends ICellRendererParams {
  onActionClick: (row: ICellRendererParams['data'], label: string) => void;
}

@Component({
  selector: 'app-v4-invoice-item-action',
  standalone: true,
  imports: [
    LucideAngularModule,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    MatTooltip
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-full items-center gap-1">
      <button
        type="button"
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

      <mat-menu #menu="matMenu" class="v4-action-menu">
        @for (group of groupedActions; track group.title) {
          <div class="v4-menu-group-label">{{ group.title }}</div>
          @for (item of group.items; track item.label) {
            <button
              mat-menu-item
              [class.v4-menu-item-danger]="item.label === 'Delete'"
              (click)="onActionClick(item.label)"
            >
              <div class="v4-menu-item">
                <lucide-icon [name]="item.icon" [size]="16" />
                <span>{{ item.label }}</span>
              </div>
            </button>
          }
        }
      </mat-menu>
    </div>
  `
})
export class V4InvoiceItemActionComponent implements AgRendererComponent {
  private params!: IV4InvoiceItemActionParams;

  readonly groupedActions: IInvoiceItemActionGroup[] = [
    {
      title: 'Actions',
      items: [
        { label: 'Edit', icon: 'pencil' },
        { label: 'Delete', icon: 'trash-2' }
      ]
    }
  ];

  agInit(params: IV4InvoiceItemActionParams): void {
    this.params = params;
  }

  refresh(params: IV4InvoiceItemActionParams): boolean {
    this.params = params;
    return true;
  }

  onActionClick(label: string): void {
    this.params.onActionClick?.(this.params.data, label);
  }
}
