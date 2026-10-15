import { Component, inject, ViewChild, ElementRef, AfterViewChecked, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { finalize, Subject, takeUntil } from 'rxjs';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCheck, faEdit, faPlus, faTimes } from '@fortawesome/pro-solid-svg-icons';
import { GroupMailingService } from '../../services/group-mailing.service';

@Component({
  selector: 'app-editable-batch-name-cell-renderer',
  templateUrl: './editable-batch-name-cell-renderer.component.html',
  styleUrls: ['./editable-batch-name-cell-renderer.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonButtonV35Component, FontAwesomeModule]
})
export class EditableBatchNameCellRendererComponent implements ICellRendererAngularComp, AfterViewChecked, OnDestroy {
  private groupMailingService = inject(GroupMailingService);
  private alertService = inject(AlertService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$: Subject<void> = new Subject<void>();
  
  @ViewChild('editInput', { static: false }) editInput!: ElementRef<HTMLInputElement>;
  
  public params!: ICellRendererParams;
  public isEditing = false;
  public originalValue = '';
  public editValue = '';
  public isLoading = false;
  private shouldFocus = false;

  faEdit = faEdit;
  faCheck = faCheck;
  faTimes = faTimes;
  faPlus = faPlus;

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
  
      // Call editBatch API to update batch name
      this.groupMailingService.editBatch(this.params.data.id, trimmedValue)
      .pipe(
        takeUntil(this.destroy$), 
        finalize(() => {
          this.isLoading = false;
          this.isEditing = false;
        })
      )
      .subscribe({
        next: (response) => {
          if (response?.success) {
            // Update value in table
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
            // Reset if update failed
            this.editValue = this.originalValue;
  
            this.alertService.failedAlert({
              title: 'Update Failed',
              content: response?.message || 'Failed to update batch name. Please try again.',
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}