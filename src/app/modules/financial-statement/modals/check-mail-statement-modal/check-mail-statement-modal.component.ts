import { Component, OnInit, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  IFinancialStatementRowData,
  IJsonData
} from '../../model/financialstatement';

interface NameValueInterface {
  name: string;
  value: string | number;
}

interface IDialogData {
  checkData: { json_data: Record<string, string | number> };
  mode: 'check' | 'invoice' | 'group';
}
@Component({
  selector: 'app-check-mail-statement-modal',
  templateUrl: './check-mail-statement-modal.component.html',
  styleUrls: ['./check-mail-statement-modal.component.scss'],
  standalone: true,
  imports: [MatDialogClose, FaIconComponent, MatDialogActions]
})
export class CheckMailStatementModalComponent implements OnInit {
  public data:
    | IDialogData
    | {
        checkData: IFinancialStatementRowData;
        mode: 'check' | 'invoice' | 'group';
      } = inject(MAT_DIALOG_DATA);

  checkData: IDialogData['checkData'];
  mailDetailValues: NameValueInterface[] = [];
  amountDetailValues: NameValueInterface[] = [];
  mode: 'check' | 'invoice' | 'group';
  groupMailData: IJsonData;
  headers: string[] = [
    'Check Id',
    'Check No',
    'Single Cost',
    'Attachment Cost',
    'SMS Cost',
    'Total'
  ];

  ngOnInit(): void {
    this.checkData = this.data.checkData as IDialogData['checkData'];
    this.mode = this.data.mode;
    this.formatDataToList(this.checkData);
    if (this.mode === 'group') {
      this.groupMailData = (this.data.checkData as IFinancialStatementRowData)
        ?.json_data as IJsonData;
    }
  }

  formatDataToList(inData: IDialogData['checkData']) {
    for (let i = 0; i < Object.keys(inData.json_data).length; i += 1) {
      const key = Object.keys(inData.json_data)[i];
      if (inData.json_data[key]) {
        if (key !== 'page_cost' && key !== 'sms_cost' && key !== 'total') {
          if (
            key === 'paper_type_amount' ||
            key === 'shipping_charge' ||
            key === 'total_sms_cost' ||
            key === 'total_attchment_cost'
          ) {
            if (inData.json_data[key] != null) {
              const v: NameValueInterface = {
                name: this.titleCase(key).replace('Attchment', 'Attachment'),
                value: inData.json_data[key]
              };
              this.amountDetailValues.push(v);
            }
          } else {
            const v: NameValueInterface = {
              name: this.titleCase(key).replace('Attchment', 'Attachment'),
              value: inData.json_data[key]
            };
            this.mailDetailValues.push(v);
          }
        }
      }
    }
  }

  titleCase(inVal: string): string {
    const sentence = inVal.toLowerCase().split('_');

    for (let i = 0; i < sentence.length; i += 1) {
      sentence[i] = sentence[i][0].toUpperCase() + sentence[i].slice(1);
    }

    return sentence.join(' ');
  }
}
