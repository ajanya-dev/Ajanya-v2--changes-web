import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ICellRendererParams } from '@ag-grid-community/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { LucideAngularModule, FileText, Folder } from 'lucide-angular';
import { MatTooltip } from '@angular/material/tooltip';
import { IDocumentVaultItem } from '../../v4-models/v4-document-vault.models';

@Component({
  selector: 'app-v4-document-vault-name-cell',
  standalone: true,
  imports: [LucideAngularModule, MatTooltip],
  template: `
    @if (isFolder()) {
      <div
        class="flex items-center gap-2 min-w-0 cursor-pointer hover:underline"
        role="button"
        tabindex="0"
        matTooltip="Open Folder"
        (click)="onClick()"
        (keyup.enter)="onClick()"
        (keyup.space)="onClick()"
      >
        <span class="action-icon-btn">
          <lucide-icon
            [img]="FolderIcon"
            [size]="16"
            class="shrink-0"
            style="color: var(--v4-common-yellow-color)"
          ></lucide-icon>
        </span>
        <span class="truncate">{{ params.value }}</span>
      </div>
    } @else {
      <div class="flex items-center gap-2 min-w-0">
        <span class="action-icon-btn" matTooltip="File">
          <lucide-icon
            [img]="FileTextIcon"
            [size]="16"
            class="shrink-0 text-v4-primary-brand-bold-color"
          ></lucide-icon>
        </span>
        <span class="truncate" [matTooltip]="params.value">{{
          params.value
        }}</span>
      </div>
    }
  `
})
export class V4DocumentVaultNameCellComponent
  implements ICellRendererAngularComp
{
  private router = inject(Router);

  params: ICellRendererParams<IDocumentVaultItem>;

  readonly FolderIcon = Folder;
  readonly FileTextIcon = FileText;

  isFolder = computed(() => this.params.data?.type === 'folder');

  agInit(params: ICellRendererParams<IDocumentVaultItem>): void {
    this.params = params;
  }

  refresh(_: ICellRendererParams<IDocumentVaultItem>): boolean {
    return true;
  }

  onClick(): void {
    const item = this.params.data;
    if (!item) return;

    this.router.navigate([
      '/v4/manage/v4-business-tools/document-storage/folder',
      item.encrypted_id
    ]);
  }
}
