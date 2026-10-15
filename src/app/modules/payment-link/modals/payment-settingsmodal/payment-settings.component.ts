import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PaymentLinkService } from 'src/app/shared/service/payment-link/payment-link.service';
import { FormsModule } from '@angular/forms';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { NgIf, NgFor, NgClass } from '@angular/common';

@Component({
  selector: 'app-payment-settings',
  templateUrl: './payment-settings.component.html',
  styleUrls: ['./payment-settings.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    NgIf,
    MatRadioGroup,
    FormsModule,
    NgFor,
    MatRadioButton,
    MatDialogActions,
    NgClass
  ]
})
export class PaymentSettingsModalComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  selectedId = 1;
  paymentType = 'live';
  nickName = '';
  isnickName = false;
  isInvalid = false;
  isRefresh = false;
  paymentOptions: any;

  selectedUuid: string;
  constructor(
    private __paymentLinkService: PaymentLinkService,
    @Inject(MAT_DIALOG_DATA) public _data: any,
    public dialogRef: MatDialogRef<PaymentSettingsModalComponent>
  ) {}

  ngOnInit(): void {
    if (this._data.mode === 'E') {
      this.getLoadData();
    }
    if (this._data.isExcistData == true) {
      this.getPaymentOptionsData();
      this.selectedId = this._data.typeId;
    }
    if (this._data.typeId) {
      this.selectedId = this._data.typeId;
    }
  }

  getPaymentOption(env: any) {
    this.selectedId = env.target.value;
  }

  elements: any = {
    1: [
      {
        name: 'Stripe Publishable Key',
        field: 'stripe_publishable_key',
        value: '',
        status: 0
      },
      {
        name: 'Stripe Secret Key',
        field: 'stripe_secret_key',
        value: '',
        status: 0
      }
    ],
    2: [
      {
        name: 'PayPal Client Id',
        field: 'pay_pal_client_id',
        value: '',
        status: 0
      },
      {
        name: 'PayPal Secret Key',
        field: 'pay_pal_secret_key',
        value: '',
        status: 0
      }
    ],
    3: [
      {
        name: 'BitPay api token',
        field: 'bitpay_api_token',
        value: '',
        status: 0
      }
    ],
    4: [
      {
        name: 'Stripe Publishable Key',
        field: 'stripe_publishable_key',
        value: '',
        status: 0
      },
      {
        name: 'Stripe Secret Key',
        field: 'stripe_secret_key',
        value: '',
        status: 0
      }
    ]
  };

  getPaymentType(env: any) {
    this.paymentType = env.value;
  }

  getNickName(value: any) {
    this.nickName = value;
    this.isnickName = false;
  }

  getValues(value: any, i: number) {
    this.elements[this.selectedId][i].value = value;
    this.elements[this.selectedId][i].status = 0;
  }

  save() {
    if (this._data.isExcistData) {
      this._data.isExcistData = !this._data.isExcistData;
    } else {
      this.AddNewAtachLink();
    }
  }

  AddNewAtachLink() {
    this.elements[this.selectedId].forEach((element: any) => {
      if (element.value === '') {
        element.status = 1;
        this.isInvalid = true;
      } else {
        this.isInvalid = false;
      }
    });

    if (this.nickName !== '') {
      this.isnickName = false;
      this.isInvalid = false;
    } else {
      this.isInvalid = true;
      this.isnickName = true;
    }

    if (this.isInvalid) {
      return;
    }

    let credential: any[] = [];

    credential = this.elements[this.selectedId];

    const result: any = {};
    for (let i = 0; i < credential.length; i++) {
      result[credential[i].field] = credential[i].value;
    }

    const item: any = {
      type: this.paymentType,
      paymentType: this.selectedId,
      nickName: this.nickName,
      credentials: result
    };

    if (this._data.typeId != undefined) {
      item.getPaidLinkId = this._data.id;
    }

    if (!this.isInvalid) {
      if (this._data.mode === 'E') {
        this.updateCurrentLink(item, this._data.id);
      } else {
        this.addNewLink(item);
      }
    }
  }

  attachPaymentOption() {
    this.subscriptions.push(
      this.__paymentLinkService
        .attachPaymentOption(this._data.id, this.selectedUuid)
        .subscribe((res) => {
          if (res.success) {
            this.isRefresh = false;
            this.dialogRef.close(true);
          }
        })
    );
  }

  addNewLink(item: any) {
    this.isRefresh = true;
    this.subscriptions.push(
      this.__paymentLinkService
        .addNewLink(item)
        .pipe(
          catchError(() => {
            this.isRefresh = false;
            return of(false);
          })
        )
        .subscribe((res) => {
          this.isRefresh = false;

          if (res.success) {
            this.dialogRef.close({success: true, type: this.paymentType, paymentType:this.selectedId, nickName: this.nickName});
          } else {
            this.isRefresh = false;
          }
        })
    );
  }

  getSelected(item: string) {
    this.selectedUuid = item;
  }

  updateCurrentLink(item: any, id: string) {
    this.isRefresh = true;
    this.subscriptions.push(
      this.__paymentLinkService
        .updateCurrentLink(item, id)
        .pipe(
          catchError(() => {
            this.isRefresh = false;
            return of(false);
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.isRefresh = false;
            this.dialogRef.close(true);
          } else {
            this.isRefresh = false;
          }
        })
    );
  }

  getLoadData() {
    this.subscriptions.push(
      this.__paymentLinkService.getLinkData(this._data.id).subscribe((res) => {
        if (res.success) {
          this.paymentType = res.data.credential_types;
          this.selectedId = res.data.payment_type;
          this.nickName = res.data.nick_name;
          this.elements[this.selectedId].forEach((element: any) => {
            element.value = res.data.credentials[element.field];
          });
        }
      })
    );
  }

  getPaymentOptionsData() {
    this.subscriptions.push(
      this.__paymentLinkService
        .paymentOptions()
        .pipe(
          catchError(() => {
            return of(false);
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.paymentOptions = res.data;

            if (this.paymentOptions[this._data.type][0]) {
              this.selectedUuid = this.paymentOptions[this._data.type][0].uuid;
            } else {
              this._data.isExcistData = false;
            }
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }
}
