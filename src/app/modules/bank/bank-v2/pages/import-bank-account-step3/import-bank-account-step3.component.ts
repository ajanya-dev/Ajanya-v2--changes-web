import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { IBankDatas } from 'src/app/models/bank';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { MatDialogActions } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { NgFor, NgStyle, NgIf, NgClass } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { faCircleExclamation } from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'app-import-bank-account-step3',
  templateUrl: './import-bank-account-step3.component.html',
  styleUrls: ['./import-bank-account-step3.component.scss'],
  standalone: true,
  imports: [
    NgFor,
    NgStyle,
    MatTooltip,
    MatDialogActions,
    NgIf,
    FontAwesomeModule,
    CommonButtonV35Component,
    NgClass
  ]
})
export class ImportBankAccountStep3Component implements OnInit, OnDestroy {
  private bankAccService = inject(BankAccountsService);
  private alertSeervice = inject(AlertService);
  private router = inject(Router);
  private dataTableService = inject(DataTableService);

  faCircleExclamation = faCircleExclamation;

  subscriptions: Subscription[] = [];
  datas: IBankDatas[];
  selectedIds: string[] = [];
  btnDisable = false;
  allowDuplicate = false;

  ngOnInit(): void {
    this.loadData();
  }

  /**
   * @description  Loads the bank account Datas.
   *
   */
  loadData() {
    this.subscriptions.push(
      this.bankAccService
        .uploadXlDocStep4()
        .pipe(catchError(() => of(false)))
        .subscribe((res) => {
          this.datas = res.data;
          this.datas.forEach((element: IBankDatas) => {
            if (element.validationError === null) {
              this.selectedIds.push(element.uuId);
            }
          });
        })
    );
  }

  /**
   * @description  Submits for uplaoding docunment and adding bank account.
   *
   */
  onSubmit() {
    this.btnDisable = true;

    this.subscriptions.push(
      this.bankAccService
        .uploadXlDocStep5({
          ...{ ids: this.selectedIds },
          ...(this.allowDuplicate ? { allowDuplicate: 1 } : '')
        })
        .pipe(
          catchError((err) => {
            if (err) {
              this.btnDisable = false;
              if (err.error.errorCode === 701) {
                const dat = {
                  title: 'The Bank Account already exist.',
                  content: err.error.errorMsg,
                  width: '370px',
                  doneMsg: 'Yes',
                  cancelMsg: 'No'
                };
                const response = this.alertSeervice.confirmAlert(dat);
                response.afterClosed().subscribe((result) => {
                  if (result) {
                    this.allowDuplicate = true;
                    this.onSubmit();
                  }
                });
              }
            }
            return of(false);
          })
        )
        .subscribe((res) => {
          this.btnDisable = false;
          if (res.success === true) {

            this.dataTableService.setRefreshStatus(true);
            this.router.navigate(['/manage/bank-accounts/index']);
            const data = {
              title: 'Success',
              content: 'Bank Account Successfully Added!',
              doneMsg: 'OK',
              cancelMsg: 'cancel',
              close: true,
              timeout: 1500
            };

            this.alertSeervice.successAlert(data);
          }
        })
    );
  }

  changeValue(event: IBankDatas, checked: boolean) {
    if (checked) {
      this.selectedIds.push(event.uuId);
    } else {
      this.selectedIds = this.selectedIds.filter(
        (ele: string) => ele !== event.uuId
      );
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
