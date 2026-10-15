import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule, X } from 'lucide-angular';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { Iv4ngSelectConfig } from 'src/app/shared/V4/v4-dropdown/models/v4-common-dropdown-selector.interface';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { BankDataV4ApiService } from '../../services/bank-data-v4-api.service';
import {
  buildCategoryTree,
  indentNameByLevel
} from '../../services/bank-data-v4-category.util';

interface ICategoryApiItem {
  id: string;
  name: string;
  yd_category_id: number | null;
  parent_category_id?: string | null;
}

export interface IBankDataV4CategoryModalData {
  mode: 'new' | 'edit';
  category?: { id: string; name: string; yd_category_id?: number };
}

@Component({
  selector: 'app-bank-data-v4-create-category-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    MatDialogModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    V4CommonDropDownSelectorComponent,
    V4ControlMessageComponent
  ],
  templateUrl: './bank-data-v4-create-category-modal.component.html'
})
export class BankDataV4CreateCategoryModalComponent implements OnInit {
  readonly XIcon = X;
  private fb = inject(FormBuilder);
  private dialogRef =
    inject<MatDialogRef<BankDataV4CreateCategoryModalComponent>>(MatDialogRef);

  private api = inject(BankDataV4ApiService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);
  private data = inject<IBankDataV4CategoryModalData>(MAT_DIALOG_DATA);

  readonly isEditMode = this.data?.mode === 'edit';

  parentCategoryOptions: { id: string; name: string }[] = [];
  parentCategoryConfig: Iv4ngSelectConfig = {
    placeholder: 'Select parent category',
    displayField: 'name',
    outputField: 'id',
    trimSelectedIndent: true
  };

  form = this.fb.nonNullable.group({
    name: [(this.data?.category?.name ?? '').replace(/&nbsp;/g, '').trim(), [Validators.required]],
    parent: [null as string | null]
  });

  isSaving = signal(false);
  parentCategoriesLoading = signal(false);

  ngOnInit(): void {
    if (this.isEditMode) {
      // No parent category needed in edit mode
    } else {
      this.loadParentCategories();
    }
  }

  private loadParentCategories(): void {
    this.parentCategoriesLoading.set(true);
    this.api
      .getCategories()
      .pipe(
        finalize(() => this.parentCategoriesLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res: { success?: boolean; data?: { categories: ICategoryApiItem[] } }) => {
        const categories = res?.data?.categories;
        if (res?.success && Array.isArray(categories)) {
          this.parentCategoryOptions = buildCategoryTree(categories).map(
            (node) => ({
              id: node.id,
              name: indentNameByLevel(node.name, node.level || 0)
            })
          );
          if (this.parentCategoryOptions.length > 0) {
            this.form.controls.parent.setValue(this.parentCategoryOptions[0].id);
          }
        }
      });
  }

  close(): void {
    this.dialogRef.close();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const name = this.form.controls.name.value.trim();
    if (!name) return;

    this.isSaving.set(true);

    if (this.isEditMode && this.data.category) {
      this.api
        .updateCategory({
          id: this.data.category.id,
          name,
          yd_category_id: this.data.category.yd_category_id
        })
        .pipe(finalize(() => this.isSaving.set(false)))
        .subscribe((res: { success?: boolean }) => {
          if (res?.success) {
            this.alertService.successAlert({ content: 'Category updated' });
            this.dialogRef.close({ success: true });
          }
        });
    } else {
      this.api
        .createCategory({ name, parent: this.form.controls.parent.value ?? undefined })
        .pipe(finalize(() => this.isSaving.set(false)))
        .subscribe((res: { success?: boolean }) => {
          if (res?.success) {
            this.alertService.successAlert({ content: 'Category created' });
            this.dialogRef.close({ success: true });
          }
        });
    }
  }
}
