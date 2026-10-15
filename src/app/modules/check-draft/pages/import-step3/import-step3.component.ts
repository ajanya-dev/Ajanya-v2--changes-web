import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { IImportStep4 } from 'src/app/modules/check-draft/model/Checkdraft';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckDraftService } from 'src/app/shared/service/check-draft/check-draft.service';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';

/**
 * @description Represents the ImportStep3Component responsible for displaying and managing
 * the third step of the import process for check drafts.
 */
@Component({
  selector: 'app-import-step3',
  templateUrl: './import-step3.component.html',
  styleUrls: ['./import-step3.component.scss'],
  standalone: true,
  imports: [FormsModule, NgClass, CommonButtonV35Component]
})
export class ImportStep3Component implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  importDatas: IImportStep4[] = [];
  loading = false;
  submitting = false;
  isAllSelected = false;
  columnsHead = [
    'DATE',
    'SL.NO.',
    'AMOUNT',
    'PAYEE NAME',
    'NICKNAME',
    'ADDRESS LINE 1',
    'ADDRESS LINE 2',
    'CITY',
    'STATE',
    'ZIP',
    'COUNTRY',
    'EMAIL',
    'PHONE',
    'INV#',
    'PAYEE COMPANY',
    'ACC#',
    'RT#',
    'ACCOUNT TYPE',
    'CATEGORY',
    'MEMO',
    'NOTE'
  ];

  private checkDraftService = inject(CheckDraftService);
  public alertService = inject(AlertService);
  private router = inject(Router);

  ngOnInit(): void {
    this.getData();
  }

  /**
   * @description Fetches the import data for step 4 of check draft import.
   * Populates the importDatas array and sets the initial selected item.
   */
  getData(): void {
    this.loading = true;
    this.subscriptions.push(
      this.checkDraftService
        .importCheckDraftStep4()
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((data) => {
          this.importDatas = data?.data;
          this.importDatas.forEach((element) => ({
            ...element,
            selected: false
          }));
        })
    );
  }

  /**
   * @description Toggles the selection status of all import data items.
   * @param val - The value to set the selection status to (true for selected, false for deselected).
   */
  toggleSelect(val: boolean) {
    this.importDatas = this.importDatas.map(element => ({ 
      ...element, 
      selected: val 
    }));
  }

  selectItem(rowData: IImportStep4) {
    const updatedRowData = { ...rowData, selected: !rowData.selected };
    const index = this.importDatas.findIndex(item => item.id === rowData.id);    
    if (index !== -1) {      
      this.importDatas[index] = updatedRowData;
    }    
    this.isAllSelected = this.importDatas.every(item => item.selected);
  }

  /**
   * @description Submits the selected import data items for step 5 of check draft import.
   * Displays a warning if no items are selected.
   */
  submit(): void {
    const entry = this.importDatas
      .filter((element) => element.selected)
      .map((element) => element?.id);
    if (!entry?.length) {
      this.alertService.warningAlert({ content: 'Select at least 1' });
      return;
    }
    const body = { entry };
    this.submitting = true;
    this.subscriptions.push(
      this.checkDraftService
        .importCheckDraftStep5(body)
        .pipe(
          finalize(() => {
            this.submitting = false;
          })
        )
        .subscribe((reponse) => {
          if (reponse?.success) {
            this.alertService.successAlert({
              title: 'Success',
              content: 'Checks imported.',
              close: true,
              timeout: 2000
            });
            this.router.navigate(['manage/checkdraft/index']);
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}
