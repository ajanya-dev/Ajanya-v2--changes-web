import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltip } from '@angular/material/tooltip';
import { finalize } from 'rxjs';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { GroupMailingService } from 'src/app/modules/business-tools/mailing-dashboard/services/group-mailing.service';

/**
 * @description V4 UI of the editable group-mailing name cell. Same behaviour as the
 * legacy renderer — click to edit, Enter to confirm, Escape to cancel.
 */
@Component({
  selector: 'app-v4-editable-payee-name-cell-renderer',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, MatTooltip],
  template: `
    <div class="flex gap-1 items-center w-full">
      @if (!isEditing) {
        @if (originalValue) {
          <h2
            role="presentation"
            class="font-peridot editable"
            matTooltip="Edit name"
            matTooltipPosition="below"
            (click)="onCellClick()"
          >
            {{ originalValue }}
          </h2>
          <button
            type="button"
            class="dt-cell-edit-btn"
            aria-label="Edit name"
            matTooltip="Edit name"
            (click)="onCellClick()"
          >
            <lucide-icon name="pencil" [size]="12" />
          </button>
        } @else {
          <div
            role="presentation"
            class="dt-cell-edit-btn"
            (click)="onCellClick()"
          >
            <lucide-icon name="plus" [size]="12" matTooltip="Add" />
          </div>
        }
      } @else {
        <div role="presentation"
          class="w-full flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-md bg-v4-secondary-background-color border border-v4-brand-border-color"
          (click)="onInputClick($event)"
        >
          <input
            #editInput
            type="text"
            [id]="'v4-edit-input-' + params.node?.id"
            [(ngModel)]="editValue"
            class="flex-1 min-w-0 w-full p-1 text-sm bg-transparent border-none outline-none focus:outline-none text-v4-main-text-color placeholder:text-v4-placeholder-text-color"
            (click)="onInputClick($event)"
            (keydown)="onKeyDown($event)"
            maxlength="100"
            placeholder="Enter payee name"
          />
          <button
            type="button"
            class="dt-cell-edit-btn"
            [disabled]="isLoading"
            (click)="onConfirm()"
            matTooltip="Confirm changes"
          >
            <lucide-icon
              [name]="isLoading ? 'loader-circle' : 'check'"
              [size]="12"
              class="!text-v4-common-green-color"
              [class.animate-spin]="isLoading"
            />
          </button>
          <button
            type="button"
            class="dt-cell-edit-btn"
            [disabled]="isLoading"
            (click)="onCancel()"
            matTooltip="Cancel changes"
          >
            <lucide-icon
              name="x"
              [size]="12"
              class="!text-v4-common-red-color"
            />
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        overflow-x: hidden;
        margin-right: 5px;
        padding: 4px 0;
      }

      h2 {
        text-overflow: ellipsis;
        overflow-x: hidden;
      }

      /* Dashed underline at rest; hover only highlights it. */
      .editable {
        cursor: pointer;
        text-decoration: underline dashed;
        text-decoration-color: var(--v4-border-color);
        text-underline-offset: 4px;
      }

      .editable:hover {
        text-decoration-color: var(--v4-primary-brand-color);
      }

      /* .dt-cell-edit-btn chrome lives in ag-theme-v4.scss, shared with
         .action-icon-btn — don't re-declare it here. */
    `
  ]
})
export class V4EditablePayeeNameCellRendererComponent
  implements ICellRendererAngularComp, AfterViewChecked
{
  private groupMailingService = inject(GroupMailingService);
  private alertService = inject(V4AlertService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  @ViewChild('editInput', { static: false })
  editInput!: ElementRef<HTMLInputElement>;

  public params!: ICellRendererParams;
  public isEditing = false;
  public originalValue = '';
  public editValue = '';
  public isLoading = false;
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
    if (this.editValue.trim() === this.originalValue) {
      this.isEditing = false;
      return;
    }

    this.isLoading = true;
    const trimmedValue = this.editValue.trim();

    if (!this.params.data?.id) {
      this.alertService.failedAlert({
        title: 'Update Failed',
        content: 'No ID found in row data - cannot update',
        doneMsg: 'OK'
      });
      this.isLoading = false;
      this.isEditing = false;
      return;
    }

    this.groupMailingService
      .updatePayeeName({ id: this.params.data.id, name: trimmedValue })
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
                rowNodes: [this.params.node],
                columns: this.params.column ? [this.params.column] : undefined,
                force: true
              });
            }

            this.alertService.successAlert({
              title: 'Success!',
              content:
                response.message || 'Group mailing name updated successfully.',
              doneMsg: 'OK'
            });
          } else {
            this.editValue = this.originalValue;

            this.alertService.failedAlert({
              title: 'Update Failed',
              content:
                response?.message ||
                'Failed to update group mailing name. Please try again.',
              doneMsg: 'OK'
            });
          }
        },
        error: (err: unknown) => {
          this.editValue = this.originalValue;

          this.alertService.failedAlert({
            title: 'Update Failed',
            content:
              err instanceof Error
                ? err.message
                : 'Network error - please check your connection',
            doneMsg: 'OK'
          });
        }
      });
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
