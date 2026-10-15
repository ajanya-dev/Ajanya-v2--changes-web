import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ICellRendererParams } from '@ag-grid-community/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faFolderOpen, faFile } from '@fortawesome/pro-solid-svg-icons';
import { IDocumentVaultItem } from '../../models/document-vault.models';

@Component({
  selector: 'app-document-vault-name-cell',
  standalone: true,
  imports: [FaIconComponent],
  template: `
    <div 
      class="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
      role="button"
      tabindex="0"
      (click)="onClick()"
      (keyup.enter)="onClick()"
      (keyup.space)="onClick()"
    >
      <fa-icon 
        [icon]="isFolder() ? faFolderOpen : faFile" 
        [class]="isFolder() ? 'text-common-yellow-color' : 'text-common-gray-color'"
      ></fa-icon>
      <span>{{ params.value }}</span>
    </div>
  `
})
export class DocumentVaultNameCellComponent implements ICellRendererAngularComp {
  private router = inject(Router);

  params: ICellRendererParams<IDocumentVaultItem>;
  
  faFolderOpen = faFolderOpen;
  faFile = faFile;

  isFolder = computed(() => this.params.data?.type === 'folder');

  agInit(params: ICellRendererParams<IDocumentVaultItem>): void {
    this.params = params;
  }

  refresh(_: ICellRendererParams<IDocumentVaultItem>): boolean {
    return true;
  }

  /**
   * Handles click on name cell
   * - Navigates to folder if type is folder
   * - Can be extended for file click handling
   */
  onClick(): void {
    const item = this.params.data;
    if (!item) return;

    if (this.isFolder()) {
      this.router.navigate([
        '/manage/business-tools/document-vault/folder',
        item.encrypted_id
      ]);
    }
  }
}

