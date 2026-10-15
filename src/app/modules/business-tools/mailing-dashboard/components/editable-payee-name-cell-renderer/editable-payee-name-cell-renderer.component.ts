import { Component, inject, ViewChild, ElementRef, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { finalize, Subject, takeUntil } from 'rxjs';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCheck, faEdit, faTimes } from '@fortawesome/pro-solid-svg-icons';
import { GroupMailingService } from '../../services/group-mailing.service';

@Component({
  selector: 'app-editable-payee-name-cell-renderer',
  templateUrl: './editable-payee-name-cell-renderer.component.html',
  styleUrls: ['./editable-payee-name-cell-renderer.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonButtonV35Component, FontAwesomeModule]
})
export class EditablePayeeNameCellRendererComponent implements ICellRendererAngularComp, AfterViewChecked {
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
          content: 'No ID found in row data - cannot update',
          doneMsg: 'OK'
        });
        this.isLoading = false;
        this.isEditing = false;
        return;
      }
  
      // Service call to update payee name
      this.groupMailingService.updatePayeeName({
        id: this.params.data.id,
        name: trimmedValue
      })
      .pipe(takeUntil(this.destroy$), 
      finalize(() => {
        this.isLoading = false;
        this.isEditing = false;
      }))
      .subscribe({
        next: (response) => {
          if (response?.success) {
            // update value in table
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
              content: response.message || 'Group mailing name updated successfully.',
              doneMsg: 'OK'
            });
          } else {
            // reset if update failed
            this.editValue = this.originalValue;
  
            this.alertService.failedAlert({
              title: 'Update Failed',
              content: response?.message || 'Failed to update group mailing name. Please try again.',
              doneMsg: 'OK'
            });
          }
        },
        error: (err: unknown) => {
          this.editValue = this.originalValue;
  
          this.alertService.failedAlert({
            title: 'Update Failed',
            content: err instanceof Error ? err.message : 'Network error - please check your connection',
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