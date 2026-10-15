import { Component, computed, inject, signal } from '@angular/core';
import { ICellRendererParams } from '@ag-grid-community/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';

/** Row ⋮ menu is grouped like every other v4 grid: Actions · Documents · Proof. */
type TMenuGroup = 'ACTIONS' | 'DOCUMENTS' | 'PROOF';
const GROUP_ORDER: TMenuGroup[] = ['ACTIONS', 'DOCUMENTS', 'PROOF'];

interface IActionItem {
  name: string;
  id: string;
  icon: string;
  group: TMenuGroup;
  isDanger?: boolean;
  showForFile: boolean;
  showForFolder: boolean;
  showOnlyAtRoot?: boolean;
}

interface IExtendedCellRenderer extends ICellRendererParams {
  folderId?: string;
  onItemDeleted?: () => void;
}

@Component({
  selector: 'app-v4-document-vault-action',
  standalone: true,
  imports: [
    LucideAngularModule,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    MatTooltip
  ],
  template: `
    <div class="flex items-center gap-1 h-full">
      <button
        class="action-icon-btn"
        [matMenuTriggerFor]="menu"
        matTooltip="Actions"
        (click)="$event.stopPropagation()"
      >
        <lucide-icon
          name="ellipsis-vertical"
          [size]="16"
          class="v4-action-icon"
        ></lucide-icon>
      </button>

      <mat-menu #menu="matMenu" class="v4-action-menu">
        @for (group of groupedActions(); track group.title) {
          <div class="v4-menu-group-label">{{ group.title }}</div>
          @for (action of group.items; track action.id) {
            <button
              mat-menu-item
              [class.v4-menu-item-danger]="action.isDanger"
              (click)="onActionClick(action.id)"
            >
              <div class="v4-menu-item flex items-center">
                <lucide-icon
                  [name]="action.icon"
                  [size]="16"
                  class="inline-flex shrink-0"
                ></lucide-icon>
                <span>{{ action.name }}</span>
              </div>
            </button>
          }
        }
      </mat-menu>
    </div>
  `
})
export class V4DocumentVaultActionComponent
  implements ICellRendererAngularComp
{
  private dataTableService = inject(DataTableService);

  params!: IExtendedCellRenderer;
  loading = signal(false);

  folderId = computed(() => this.params?.folderId);

  actionButtons: IActionItem[] = [
    {
      name: 'Edit',
      id: 'edit',
      icon: 'square-pen',
      group: 'ACTIONS',
      showForFile: true,
      showForFolder: true
    },
    {
      name: 'Share',
      id: 'share',
      icon: 'share-2',
      group: 'ACTIONS',
      showForFile: true,
      showForFolder: true
    },
    {
      name: 'Download',
      id: 'download',
      icon: 'download',
      group: 'ACTIONS',
      showForFile: true,
      showForFolder: false
    },
    {
      name: 'User Permission',
      id: 'user-permission',
      icon: 'users',
      group: 'ACTIONS',
      showForFile: false,
      showForFolder: true
    },
    {
      name: 'Delete',
      id: 'delete',
      icon: 'trash-2',
      group: 'ACTIONS',
      isDanger: true,
      showForFile: true,
      showForFolder: true
    },
    {
      name: 'Add Comment',
      id: 'add-comment',
      icon: 'message-square',
      group: 'DOCUMENTS',
      showForFile: false,
      showForFolder: true,
      showOnlyAtRoot: true
    }
  ];

  visibleActions = computed(() => {
    const isFile = this.params?.data?.type === 'file';
    const isFolderId = !!this.folderId();

    return this.actionButtons.filter((action) => {
      if (isFile && !action.showForFile) return false;
      if (!isFile && !action.showForFolder) return false;
      if (action.showOnlyAtRoot && isFolderId) return false;
      return true;
    });
  });

  groupedActions = computed(() =>
    GROUP_ORDER.map((title) => ({
      title,
      items: this.visibleActions().filter((a) => a.group === title)
    })).filter((group) => group.items.length > 0)
  );

  agInit(params: IExtendedCellRenderer): void {
    this.params = params;
  }

  refresh(_: IExtendedCellRenderer): boolean {
    return true;
  }

  onActionClick(id: string): void {
    const currentColumn = { ...this.params.data, index: this.params.node.id };
    this.dataTableService.setDataFromActionComp(currentColumn, id);
  }
}
