import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { Router } from '@angular/router';
import { of, Subject, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { NgClass } from '@angular/common';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';

@Component({
  selector: 'app-import-bank-account-step2',
  templateUrl: './import-bank-account-step2.component.html',
  styleUrls: ['./import-bank-account-step2.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgClass,
    CommonButtonV35Component,
    CommonBackButtonV35Component
  ]
})
export class ImportBankAccountStep2Component implements OnInit, OnDestroy {
  private fb = inject(UntypedFormBuilder);
  private alertService = inject(AlertService);
  private bankAccService = inject(BankAccountsService);
  private router = inject(Router);

  form: UntypedFormGroup;
  spinnerEnabled = false;
  keys: string[];
  dataSheet = new Subject();
  isExcelFile: boolean;
  subscriptions: Subscription[] = [];
  btnDisable = false;
  file: string;
  header: string;
  rows: string;
  arrs = new Array(17);

  constructor() {
    this.file = this.router.getCurrentNavigation()?.extras.state?.example;
  }

  ngOnInit(): void {
    const obj = JSON?.parse(this.file);
    this.header = obj.header;
    this.rows = obj.rows;
    this.init();
  }

  /**
   * @description  Initializes the form group for the form.
   */
  init() {
    this.form = this.fb.group({
      0: [''],
      1: [''],
      2: [''],
      3: [''],
      4: [''],
      5: [''],
      6: [''],
      7: [''],
      8: [''],
      9: [''],
      10: [''],
      11: [''],
      12: [''],
      13: [''],
      14: [''],
      15: [''],
      16: [''],
      17: ['']
    });
  }

  /**
   * @description  Retrieves the form data as a request body.
   * @returns {object} - The request body containing the value.
   */
  formBody() {
    const { value } = this.form;

    const map = {
      0: value[0],
      1: value[1],
      2: value[2],
      3: value[3],
      4: value[4],
      5: value[5],
      6: value[6],
      7: value[7],
      8: value[8],
      9: value[9],
      10: value[10],
      11: value[11],
      12: value[12],
      13: value[13],
      14: value[14],
      15: value[15],
      16: value[16],
      17: value[17]
    };

    const data = {
      waring: 0,
      mapping: map
    };
    return data;
  }

  /**
   * @description  Change the data in form.
   *
   */
  onChange() {
    const arr: string[] = [];

    for (let i = 0; i < 18; i += 1) {
      arr.push(this.form.controls[i].value);
      this.arrs[i] = false;
    }

    if (arr.includes('0')) {
      this.arrs[0] = true;
    }
    if (arr.includes('1')) {
      this.arrs[1] = true;
    }
    if (arr.includes('2')) {
      this.arrs[2] = true;
    }
    if (arr.includes('3')) {
      this.arrs[3] = true;
    }
    if (arr.includes('4')) {
      this.arrs[4] = true;
    }
    if (arr.includes('5')) {
      this.arrs[5] = true;
    }
    if (arr.includes('6')) {
      this.arrs[6] = true;
    }
    if (arr.includes('7')) {
      this.arrs[7] = true;
    }
    if (arr.includes('8')) {
      this.arrs[8] = true;
    }
    if (arr.includes('9')) {
      this.arrs[9] = true;
    }
    if (arr.includes('10')) {
      this.arrs[10] = true;
    }
    if (arr.includes('11')) {
      this.arrs[11] = true;
    }
    if (arr.includes('12')) {
      this.arrs[12] = true;
    }
    if (arr.includes('13')) {
      this.arrs[13] = true;
    }
    if (arr.includes('14')) {
      this.arrs[14] = true;
    }
    if (arr.includes('15')) {
      this.arrs[15] = true;
    }
    if (arr.includes('16')) {
      this.arrs[16] = true;
    }
    if (arr.includes('17')) {
      this.arrs[17] = true;
    }
  }

  /**
   * @description  Submits the form data for Uploading File.
   *
   */
  onSubmit() {
    const arr: string[] = [];
    for (let i = 0; i < 17; i += 1) {
      arr.push(this.form.controls[i].value);
    }

    if (!arr.includes('0')) {
      const data = {
        content: 'Please select a routing Number'
      };
      this.alertService.infoAlert(data);
      return;
    }

    if (!arr.includes('1')) {
      const data = {
        content: 'Please select a bank account number'
      };
      this.alertService.infoAlert(data);
      return;
    }

    if (!arr.includes('2')) {
      const data = {
        content: 'Please select a Account Name'
      };
      this.alertService.infoAlert(data);
      return;
    }

    if (!arr.includes('3')) {
      const data = {
        content: 'Please select a bank account nick name'
      };
      this.alertService.infoAlert(data);
      return;
    }

    if (!arr.includes('5')) {
      const data = {
        content: 'Please select a address'
      };
      this.alertService.infoAlert(data);
      return;
    }

    if (!arr.includes('7')) {
      const data = {
        content: 'Please select a city'
      };
      this.alertService.infoAlert(data);
      return;
    }

    if (!arr.includes('8')) {
      const data = {
        content: 'Please select a state'
      };
      this.alertService.infoAlert(data);
      return;
    }

    if (!arr.includes('9')) {
      const data = {
        content: 'Please select a zip'
      };
      this.alertService.infoAlert(data);
      return;
    }

    if (!arr.includes('12')) {
      const data = {
        content: 'Please select a bank name'
      };
      this.alertService.infoAlert(data);
      return;
    }

    this.btnDisable = true;

    this.subscriptions.push(
      this.bankAccService
        .uploadXlDocStep3(this.formBody())
        .pipe(catchError(() => of(false)))
        .subscribe((res) => {
          this.btnDisable = false;

          if (res.success) {
            this.router.navigate([
              'manage/bankaccount/import-bankaccount/step4'
            ]);
          }
        })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
