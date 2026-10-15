import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ICellRendererParams } from '@ag-grid-community/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatTooltip } from '@angular/material/tooltip';
import { faCheck, faSpinner, faPen } from '@fortawesome/pro-solid-svg-icons';
import { finalize } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DocumentVaultService } from '../../services/document-vault.service';
import { IDocumentVaultItem } from '../../models/document-vault.models';

@Component({
  selector: 'app-document-vault-memo-cell',
  standalone: true,
  imports: [FormsModule, FaIconComponent, MatTooltip],
  styles: [`
    :host {
      display: flex;
      width: 100%;
      align-items: center;
      height: 100%;
    }
    .memo-container {
      display: flex;
      align-items: center;
      gap: 4px;
      width: 100%;
      height: 100%;
    }
    .memo-input {
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 4px 8px;
      outline: none;
      font-size: 13px;
      flex: 1;
      min-width: 0;
      background: #fff;
      height: 28px;
      box-sizing: border-box;
    }
    .memo-input:focus {
      border-color: var(--common-blue-color);
      box-shadow: 0 0 0 1px var(--common-blue-color);
    }
    .memo-text {
      cursor: pointer;
      padding: 2px 4px;
      display: flex;
      align-items: center;
      gap: 4px;
      width: 100%;
      overflow: hidden;
    }
    .memo-text:hover {
      background-color: var(--secondary-background-color);
    }
    .memo-value {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `],
  template: `
    @if (isFile) {
      @if (isEditing()) {
        <div class="memo-container">
          <input
            class="memo-input"
            [(ngModel)]="memoValue"
            (keydown.enter)="saveMemo()"
            (keydown.escape)="cancelEdit()"
            [disabled]="isSaving()"
            placeholder="Enter memo"
            #memoInput
          />
          @if (isSaving()) {
            <fa-icon
              class="text-common-blue-color"
              [icon]="faSpinner"
              [animation]="'spin'"
              matTooltip="Saving..."
            ></fa-icon>
          } @else {
            <fa-icon
              class="cursor-pointer text-common-green-color"
              [icon]="faCheck"
              matTooltip="Save"
              (click)="saveMemo()"
            ></fa-icon>
          }
        </div>
      } @else {
        <div
          role="presentation"
          class="memo-text"
          (click)="startEdit()"
          matTooltip="Click to edit memo"
        >
          <span class="memo-value">{{ memoValue || '-' }}</span>
          <fa-icon
            class="text-common-blue-color text-xs opacity-50 hover:opacity-100"
            [icon]="faPen"
          ></fa-icon>
        </div>
      }
    } @else {
      <span>-</span>
    }
  `
})
export class DocumentVaultMemoCellComponent implements ICellRendererAngularComp {
  private alertService = inject(AlertService);
  private documentVaultService = inject(DocumentVaultService);
  private destroyRef = inject(DestroyRef);

  params!: ICellRendererParams<IDocumentVaultItem>;
  isFile = false;
  memoValue = '';
  originalValue = '';

  isEditing = signal(false);
  isSaving = signal(false);

  faCheck = faCheck;
  faSpinner = faSpinner;
  faPen = faPen;

  agInit(params: ICellRendererParams<IDocumentVaultItem>): void {
    this.params = params;
    this.isFile = params.data?.type === 'file';
    this.memoValue = params.value || '';
    this.originalValue = params.value || '';
  }

  refresh(params: ICellRendererParams<IDocumentVaultItem>): boolean {
    this.params = params;
    this.memoValue = params.value || '';
    this.originalValue = params.value || '';
    return true;
  }

  startEdit(): void {
    if (!this.isFile || this.isSaving()) return;
    this.isEditing.set(true);
  }

  cancelEdit(): void {
    this.memoValue = this.originalValue;
    this.isEditing.set(false);
  }

  saveMemo(): void {
    if (this.isSaving()) return;

    // If memo hasn't changed, just close the editor
    if (this.memoValue === this.originalValue) {
      this.isEditing.set(false);
      return;
    }

    const encryptedFileId = this.params.data?.encrypted_id;
    if (!encryptedFileId) {
      this.alertService.failedAlert({ content: 'File ID not found' });
      return;
    }

    this.isSaving.set(true);
    this.documentVaultService
      .updateMemoNote(encryptedFileId.toString(), this.memoValue)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSaving.set(false))
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.originalValue = this.memoValue;
            this.isEditing.set(false);
            if (this.params.data) {
              this.params.data.memo_note = this.memoValue;
            }
            this.alertService.successAlert({
              content: response.message || 'Memo updated successfully'
            });
          }
        }
      });
  }
}
