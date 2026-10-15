import { Component, inject } from '@angular/core';
import { ICellRendererParams } from '@ag-grid-community/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { MatDialog } from '@angular/material/dialog';
import { BankDataService } from 'src/app/shared/service/bank-data/bank-data.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BankDataAddCategoryModalComponent } from '../../modals/bank-data-add-category-modal/bank-data-add-category-modal.component';
import { AddNewRuleModalComponent } from '../../modals/add-new-rule-modal/add-new-rule-modal.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';

@Component({
  selector: 'app-bank-data-description',
  template: `
    @if (colId === 'description_custom') {
      <ng-container>
        <div class="flex justify-between items-center gap-2">
          <span
            title="Original Description: {{ params.data.original_description }}"
            style="overflow: hidden;text-overflow: ellipsis;"
          >
            {{ description }}
          </span>

          @if (params.page !== 'bank-accounts') {
            <fa-icon
              class="cursor-pointer"
              [icon]="['fas', 'pen-to-square']"
              (click)="openAddNewRuleModal()"
            ></fa-icon>
          }
        </div>
      </ng-container>
    }
    @if (colId === 'category_id_custom') {
      <ng-container>
        <div class="flex justify-between items-center gap-2">
          <span
            title="{{ categoryName }}"
            style="overflow: hidden;text-overflow: ellipsis;"
          >
            {{ categoryName }}
          </span>
          @if (params.page !== 'bank-accounts' && categoryName) {
            <fa-icon
              class="cursor-pointer"
              [icon]="['fas', 'pen-to-square']"
              (click)="openEditCategoryModal()"
            ></fa-icon>
          }
        </div>
      </ng-container>
    }
  `,
  standalone: true,
  imports: [FaIconComponent]
})
export class bankDataDescriptionComponent implements ICellRendererAngularComp {
  public dialog = inject(MatDialog);
  private bankDataService = inject(BankDataService);
  private alertService = inject(AlertService);
  private v3DataTableService = inject(V3DataTableService);

  params: ICellRendererParams & { page?: 'bank-accounts' };
  colId: string | undefined;

  categoryName: string;
  description: string;

  refresh(): boolean {
    // throw new Error('Method not implemented.');
    return true;
  }

  agInit(params: ICellRendererParams): void {
    this.colId = params.column?.getColId();
    this.params = params;
    if (this.colId === 'category_id_custom') {
      this.categoryName = params.data?.category_name_custom?.replace(
        /&nbsp;/g,
        ''
      );
    } else if (this.colId === 'description_custom') {
      if (params?.data?.description_custom) {
        this.description = params.data.description_custom;
      } else if (params?.value) {
        this.description = params.value;
      } else if (params?.data?.original_description) {
        this.description = params.data.original_description;
      } else {
        this.description = 'null';
      }
    }
  }

  openAddNewRuleModal() {
    this.dialog.open(AddNewRuleModalComponent, {
      width: '1000px',
      maxWidth: '93%',
      data: {
        description: this.params.value
      }
    }).afterClosed().subscribe((res) => {
      if(res){
        this.v3DataTableService.refreshV3DataTable();
      }
    });
  }

  openEditCategoryModal() {
    const dialogRef = this.dialog.open(BankDataAddCategoryModalComponent, {
      width: '510px',
      maxWidth: '93%',
      data: {
        mode: 'edit',
        category: {
          id: this.params.value,
          name: this.categoryName,
          yd_category_id: this.params.value
        }
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res?.success) {
        this.bankDataService.categoriesKeyVal[this.params.value] = res.name;
        this.alertService.successAlert({
          content: 'Category Updated',
          close: true,
          timeout: 2000
        });
        this.v3DataTableService.refreshV3DataTable();
      }
    });
  }
}
