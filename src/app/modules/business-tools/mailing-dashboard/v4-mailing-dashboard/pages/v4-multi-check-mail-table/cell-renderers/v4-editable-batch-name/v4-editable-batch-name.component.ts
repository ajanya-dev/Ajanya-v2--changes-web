import {
  Component,
  inject,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  ChangeDetectorRef,
  DestroyRef
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { GroupMailingService } from 'src/app/modules/business-tools/mailing-dashboard/services/group-mailing.service';

@Component({
  selector: 'app-v4-editable-batch-name',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, MatTooltipModule],
  styles: [`
    h2.editable {
      cursor: pointer;
      text-decoration: underline dashed;
      text-decoration-color: var(--v4-border-color);
      text-underline-offset: 4px;
    }
    h2.editable:hover {
      text-decoration-color: var(--v4-primary-brand-color);
    }
  `],
  template: `
    <div class="flex w-full h-full items-center relative">
      @if (!isEditing) {
        @if (originalValue) {
          <div class="flex gap-1 items-center w-full" (click)="onCellClick()">
            <h2 class="font-peridot editable"
                matTooltip="Edit batch name"
                matTooltipPosition="below"
                (click)="onCellClick()">{{ originalValue }}</h2>
            <button type="button" class="dt-cell-edit-btn"
                    aria-label="Edit batch name"
                    matTooltip="Edit batch name"
                    (click)="$event.stopPropagation(); onCellClick()">
              <lucide-icon name="pencil" [size]="12"></lucide-icon>
            </button>
          </div>
        } @else {
          <div class="flex gap-1 items-center w-full" (click)="onCellClick()">
            <div class="dt-cell-edit-btn" matTooltip="Add batch name" (click)="$event.stopPropagation(); onCellClick()">
              <lucide-icon name="plus" [size]="12"></lucide-icon>
            </div>
          </div>
        }
      }

      @if (isEditing) {
        <div class="w-full h-full relative z-[1000]" (click)="$event.stopPropagation()">
          <div class="flex items-center gap-1 w-full bg-v4-secondary-background-color border border-v4-border-color rounded p-0.5 shadow-sm">
            <input
              #editInput
              type="text"
              [(ngModel)]="editValue"
              [disabled]="isLoading"
              class="flex-1 border-none outline-none p-1 text-sm bg-transparent text-v4-main-text-color placeholder-v4-subtle-text-color min-w-0 w-full focus:outline-none disabled:cursor-not-allowed"
              (click)="onInputClick($event)"
              (keydown)="onKeyDown($event)"
              maxlength="100"
              placeholder="Enter batch name"
            />
            <div class="flex gap-0.5">
              @if (isLoading) {
                <div class="p-1 flex items-center justify-center">
                  <lucide-icon
                    name="loader-circle"
                    [size]="12"
                    class="text-v4-subtle-text-color animate-spin"
                  ></lucide-icon>
                </div>
              } @else {
                <button
                  class="border-none bg-transparent cursor-pointer p-1 rounded text-xs flex items-center justify-center transition-all duration-200 hover:scale-110 disabled:opacity-60 disabled:cursor-not-allowed"
                  (click)="onConfirm()"
                  matTooltip="Confirm changes"
                >
                  <lucide-icon name="check" [size]="12" class="text-v4-common-green-color"></lucide-icon>
                </button>
                <button
                  class="border-none bg-transparent cursor-pointer p-1 rounded text-xs flex items-center justify-center transition-all duration-200 hover:scale-110 disabled:opacity-60 disabled:cursor-not-allowed"
                  (click)="onCancel()"
                  matTooltip="Cancel changes"
                >
                  <lucide-icon name="x" [size]="12" class="text-v4-common-red-color"></lucide-icon>
                </button>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class V4EditableBatchNameComponent implements ICellRendererAngularComp, AfterViewChecked {
  private groupMailingService = inject(GroupMailingService);
  private alertService = inject(V4AlertService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  @ViewChild('editInput', { static: false }) editInput!: ElementRef<HTMLInputElement>;

  params!: ICellRendererParams;
  isEditing = false;
  originalValue = '';
  editValue = '';
  isLoading = false;
  private shouldFocus = false;

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.originalValue = params.value || '';
    this.editValue = this.originalValue;
  }

  refresh(params: ICellRendererParams): boolean {
    this.params = params;
    this.originalValue = params.value || '';
    if (!this.isEditing) {
      this.editValue = this.originalValue;
    }
    return true;
  }

  ngAfterViewChecked(): void {
    if (this.shouldFocus && this.editInput?.nativeElement) {
      this.editInput.nativeElement.focus();
      this.editInput.nativeElement.select();
      this.shouldFocus = false;
      this.cdr.detectChanges();
    }
  }

  onCellClick(): void {
    if (!this.isEditing) {
      this.isEditing = true;
      this.editValue = this.originalValue;
      this.shouldFocus = true;
    }
  }

  onConfirm(): void {
    if (this.editValue.trim() !== this.originalValue) {
      this.isLoading = true;
      const trimmedValue = this.editValue.trim();

      if (!this.params.data?.id) {
        this.alertService.failedAlert({
          title: 'Update Failed',
          content: 'No Batch ID found - cannot update',
          doneMsg: 'OK'
        });
        this.isLoading = false;
        this.isEditing = false;
        return;
      }

      this.groupMailingService
        .editBatch(this.params.data.id, trimmedValue)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => {
            this.isLoading = false;
            this.isEditing = false;
          })
        )
        .subscribe({
          next: (response) => {
            if (response?.success) {
              this.originalValue = trimmedValue;
              this.params.data.name = this.originalValue;

              if (this.params.api) {
                this.params.api.refreshCells({
                  rowNodes: [this.params.node!],
                  columns: [this.params.column!],
                  force: true
                });
              }

              this.alertService.successAlert({
                title: 'Success!',
                content: 'Batch name updated successfully',
                doneMsg: 'OK',
                timeout: 2000
              });
            } else {
              this.editValue = this.originalValue;
              this.alertService.failedAlert({
                title: 'Update Failed',
                content: response?.message || 'Failed to update batch name.',
                doneMsg: 'OK'
              });
            }
          },
          error: (err: unknown) => {
            this.editValue = this.originalValue;
            this.alertService.failedAlert({
              title: 'Update Failed',
              content: err instanceof Error ? err.message : 'Failed to update batch name.',
              doneMsg: 'OK'
            });
          }
        });
    } else {
      this.isEditing = false;
    }
  }

  onCancel(): void {
    this.editValue = this.originalValue;
    this.isEditing = false;
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onConfirm();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.onCancel();
    }
  }

  onInputClick(event: Event): void {
    event.stopPropagation();
  }
}
