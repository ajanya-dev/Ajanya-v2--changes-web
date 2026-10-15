import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ICellRendererParams } from '@ag-grid-community/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Check,
  LoaderCircle,
  Pencil
} from 'lucide-angular';
import { MatTooltip } from '@angular/material/tooltip';
import { finalize } from 'rxjs';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { EllipsisActiveDirective } from 'src/app/directive/ellipsis-active.directive';
import { DocumentVaultService } from '../../v4-services/v4-document-vault.service';
import { IDocumentVaultItem } from '../../v4-models/v4-document-vault.models';

@Component({
  selector: 'app-document-vault-memo-cell',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, MatTooltip, EllipsisActiveDirective],
  styles: [
    `
      /* The grid cell is a flex row; without min-width:0 / max-width the host
         can grow to the memo's full text width and spill past the column. */
      :host {
        display: flex;
        width: 100%;
        min-width: 0;
        max-width: 100%;
        overflow: hidden;
        align-items: center;
        height: 100%;
      }

      ::ng-deep .v4-memo-tooltip {
        max-width: 360px;
        white-space: normal;
        word-break: break-word;
        font-size: 12px;
      }
    `
  ],
  template: `
    @if (isFile) {
      @if (isEditing()) {
        <div class="flex items-center gap-1 w-full h-full">
          <input
            class="border border-v4-border-color rounded px-2 py-1 flex-1 min-w-0 bg-v4-secondary-background-color h-7 box-border outline-none focus:border-v4-primary-brand-color focus:ring-1 focus:ring-v4-primary-brand-color"
            [(ngModel)]="memoValue"
            (keydown.enter)="saveMemo()"
            (keydown.escape)="cancelEdit()"
            [disabled]="isSaving()"
            placeholder="Enter memo"
            #memoInput
          />
          @if (isSaving()) {
            <lucide-icon
              class="animate-spin"
              style="color: var(--v4-primary-brand-bold-color)"
              [img]="LoaderCircleIcon"
              [size]="12"
              matTooltip="Saving..."
            ></lucide-icon>
          } @else {
            <button
              type="button"
              class="action-icon-btn"
              matTooltip="Save"
              (click)="saveMemo()"
            >
              <lucide-icon
                [img]="CheckIcon"
                [size]="12"
                style="color: var(--v4-common-green-color)"
              ></lucide-icon>
            </button>
          }
        </div>
      } @else {
        <div
          role="presentation"
          class="cursor-pointer px-1 py-0.5 flex items-center gap-1 w-full min-w-0 overflow-hidden"
          (click)="startEdit()"
        >
          <span
            class="flex-1 min-w-0 min-h-4 overflow-hidden text-ellipsis whitespace-nowrap"
            appEllipsisActive
            #memoText="ellipsisElement"
            [matTooltip]="
              memoText.ellipsisActive && memoValue
                ? memoValue
                : 'Click to edit memo'
            "
            matTooltipClass="v4-memo-tooltip"
            >{{ memoValue }}</span
          >
          <button
            type="button"
            class="action-icon-btn"
            matTooltip="Edit memo"
            (click)="$event.stopPropagation(); startEdit()"
          >
            <lucide-icon
              class="v4-action-icon"
              [img]="PencilIcon"
              [size]="12"
            ></lucide-icon>
          </button>
        </div>
      }
    }
  `
})
export class V4DocumentVaultMemoCellComponent
  implements ICellRendererAngularComp
{
  private alertService = inject(V4AlertService);
  private documentVaultService = inject(DocumentVaultService);
  private destroyRef = inject(DestroyRef);

  params!: ICellRendererParams<IDocumentVaultItem>;
  isFile = false;
  memoValue = '';
  originalValue = '';

  isEditing = signal(false);
  isSaving = signal(false);

  readonly CheckIcon = Check;
  readonly LoaderCircleIcon = LoaderCircle;
  readonly PencilIcon = Pencil;

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
