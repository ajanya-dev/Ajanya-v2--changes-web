import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { Utils } from 'src/app/data/utils';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BankDataService } from 'src/app/shared/service/bank-data/bank-data.service';
import { FormsModule } from '@angular/forms';
import {
  NgIf,
  NgFor,
  NgSwitch,
  NgSwitchCase,
  NgClass,
  KeyValuePipe
} from '@angular/common';
import {
  buildCategoryTree,
  indentNameByLevel
} from '../../utils/category-tree.util';

interface IAccounts {
  additional_status: string;
  available_balance_amount: string;
  checked: boolean;
  company_id: string;
  current_balance: string;
  id: string;
  last_updated: string;
  name: string;
  nick_name: string;
  refresh_status: string;
  short_name: string;
  status: number;
}
@Component({
  selector: 'app-add-new-rule-modal',
  templateUrl: './add-new-rule-modal.component.html',
  styleUrls: ['./add-new-rule-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    NgIf,
    NgFor,
    FormsModule,
    NgSwitch,
    NgSwitchCase,
    MatDialogActions,
    NgClass,
    KeyValuePipe
  ]
})
export class AddNewRuleModalComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];

  categoryOptions: Array<{ id: string; name: string }> = [];

  accounts: IAccounts = {
    additional_status: '',
    available_balance_amount: '',
    checked: false,
    company_id: '',
    current_balance: '',
    id: '',
    last_updated: '',
    name: '',
    nick_name: '',
    refresh_status: '',
    short_name: '',
    status: 0
  };

  saving = false;

  ruleBody: any = {
    name: {
      style: 1,
      ifs: {},
      thens: {
        0: ['1', ''],
        1: ['2', '']
      }
    }
  };

  descriptionDropDown = [
    { value: 1, name: 'Contains' },
    { value: 2, name: 'Exact' }
  ];

  amountDropDown = [
    { value: 1, name: 'More than' },
    { value: 2, name: 'Less than' },
    { value: 3, name: 'Equals' },
    { value: 4, name: 'Between' }
  ] as const;

  dateDropDown = [
    { value: 1, name: 'After' },
    { value: 2, name: 'Before' },
    { value: 3, name: 'On' },
    { value: 4, name: 'Between' }
  ] as const;

  accountDropDown = [{ value: 1, name: 'Is' }] as const;

  optionsForIf = {
    1: this.descriptionDropDown,
    2: this.amountDropDown,
    3: this.dateDropDown,
    4: this.accountDropDown
  } as const;

  ifs: Array<[string, string, string, string, string]> = [
    ['1', '1', '', '', '']
  ];

  utils = Utils;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _bankDataService: BankDataService,
    private _alertService: AlertService,
    private _dialogRef: MatDialogRef<AddNewRuleModalComponent>
  ) {}

  ngOnInit(): void {
    this.loadCategories();

    this.accounts = this._bankDataService.accounts;
    if (this.data?.description) {
      this.ifs[0][2] = this.data.description;
      this.addIfs(0);
    }
  }

  /**
   * @description  Fetches categories from the API and flattens the parent/child
   * tree into indented options for the "Set Category" dropdown.
   */
  private loadCategories(): void {
    this.subscriptions.push(
      this._bankDataService.getCategories().subscribe((data) => {
        if (data?.success) {
          this.categoryOptions = buildCategoryTree(
            data?.data?.categories || []
          ).map((node) => ({
            id: node.id,
            name: indentNameByLevel(node.name, node.level || 0)
          }));
        }
      })
    );
  }

  addIfs(index: number) {
    if (this.ifs.length === 4 || index !== this.ifs.length - 1) {
      return;
    }

    this.ifs.push(['2', '1', '', '', '']);
  }

  midIfChange(index: number) {
    // if 1st column is amount or date
    if (this.ifs[index][0] === '2' || this.ifs[index][0] === '3') {
      if (this.ifs[index][1] !== '4') {
        // clear between value
        this.ifs[index][3] = '';
        this.ifs[index][4] = '';
      } else {
        // clear main value
        this.ifs[index][2] = '';
      }
    }
  }

  isRuleValid(): boolean {
    let atleast1If = false;

    for (const rule of this.ifs) {
      if (rule[2] || (rule[3] && rule[4])) {
        atleast1If = true;
      }

      if (rule[0] === '2' && parseInt(rule[3]) >= parseInt(rule[4])) {
        this._alertService.warningAlert({
          content: 'Please enter valid amount range !'
        });
        return false; 
      }

      if (rule[0] === '3' && new Date(rule[3]) >= new Date(rule[4])) {
        this._alertService.warningAlert({
          content: 'Please enter valid date range !'
        });
        return false;
      }
    }

    if (!atleast1If) {
      this._alertService.warningAlert({
        content: 'Please set at least one If condition !'
      });
      return false;
    }

    let atleast1Desc = false;
    for (const key in this.ruleBody.name.thens) {
      if (this.ruleBody.name.thens[key][1]) {
        atleast1Desc = true;
      }
    }

    if (!atleast1Desc) {
      this._alertService.warningAlert({
        content: 'Please set at least one description'
      });
      return false;
    }

    return true;
  }

  save() {
    if (this.isRuleValid()) {
      this.saving = true;

      this.ruleBody.name.ifs = {};

      this.ifs.forEach((rule, i) => {
        this.ruleBody.name.ifs[i] = rule;
      });

      const body = JSON.stringify(this.ruleBody.name).toString();

      this.subscriptions.push(
        this._bankDataService
          .addRule(body)
          .pipe(finalize(() => (this.saving = false)))
          .subscribe((data) => {
            if (data?.success) {
              this._alertService.successAlert({
                title: 'Success !',
                content: 'Rule added'
              });
              this._dialogRef.close(true);
            }
          })
      );
    }
  }

  numberOnly(event: { which: number; keyCode: number }): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
