import {
  Component,
  Inject,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {
  UntypedFormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { BankDataService } from 'src/app/shared/service/bank-data/bank-data.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';

interface InjectData {
  mode: 'new' | 'edit';
  category: ICategory;
  categories: ICategory[];
}
interface ICategory {
  id: string;
  name: string;
  yd_category_id: number;
}
@Component({
  selector: 'app-bank-data-add-category-modal',
  templateUrl: './bank-data-add-category-modal.component.html',
  styleUrls: ['./bank-data-add-category-modal.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    NgIf,
    NgSelectModule,
    NgFor,
    MatDialogActions,
    NgClass
  ]
})
export class BankDataAddCategoryModalComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];

  mode: 'new' | 'edit';
  categoryName = new UntypedFormControl(null, [
    Validators.required,
    Validators.maxLength(50)
  ]);
  parentCategoryId = new UntypedFormControl(null);
  categories: ICategory[];

  loading = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: InjectData,
    private _bankDataService: BankDataService,
    private _dialogRef: MatDialogRef<BankDataAddCategoryModalComponent>
  ) {}

  ngOnInit(): void {
    this.categories = this.data.categories;
    this.mode = this.data.mode;

    if (this.mode === 'edit') {
      const categoryName = (this.data.category.name as string).replace(
        /&nbsp;/g,
        ''
      );
      this.categoryName.setValue(categoryName);
    }
  }

  /**
   * @description  To add category or edit company.
   *
   */
  submit() {
    if (this.categoryName.invalid) {
      this.categoryName.markAsTouched();
      return;
    }

    if (this.mode === 'new') {
      this.createCategory();
    } else {
      this.updateCategory();
    }
  }

  /**
   * @description  To edit category.
   *
   */
  updateCategory() {
    this.loading = true;
    const yd_category_id = this.data.category.yd_category_id;
    const body = {
      id: this.data.category.id,
      name: this.categoryName.value,
      yd_category_id
    };
    this.subscriptions.push(
      this._bankDataService
        .updateCategory(body)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe((data) => {
          if (data?.success) {
            this._dialogRef.close({
              success: true,
              name: this.categoryName.value
            });
          }
        })
    );
  }

  /**
   * @description  To add category.
   *
   */
  createCategory() {
    this.loading = true;
    const body = {
      name: this.categoryName.value,
      parent: this.parentCategoryId.value || undefined
    };
    this.subscriptions.push(
      this._bankDataService
        .createCategory(body)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe((data) => {
          if (data?.success) {
            this._dialogRef.close({ success: true });
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
