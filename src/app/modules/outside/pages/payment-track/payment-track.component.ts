import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { IAppConfig } from 'src/app/models/app_settings';
import { OutsideService } from 'src/app/shared/service/outisde/outside.service';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { ScriptService } from 'src/app/core/services/script.service';
import {
  IPayeeBankDetails,
  IPaymentDetails,
  IPaymentSendDetails,
  IPaymentStatements
} from 'src/app/modules/outside/model/outside';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-payment-track',
  templateUrl: './payment-track.component.html',
  styleUrls: ['./payment-track.component.scss'],
  standalone: true,
  imports: [NgClass]
})
export class PaymentTrackComponent implements OnInit, OnDestroy {
  private outsideService = inject(OutsideService);
  private route = inject(ActivatedRoute);
  private scriptService = inject(ScriptService);
  staticWhiteLabelConditions = StaticWhiteLabelConditions;
  appConfig: IAppConfig;
  subscriptions: Subscription[] = [];
  transactionId: string;

  progressBarData = [
    {
      step: 1,
      name: 'Payment Initiated',
      description: ' ',
      isTrue: 1,
      isChecked: false
    },
    {
      step: 2,
      name: 'In Process',
      description: ' ',
      isTrue: 1,
      isChecked: false
    },
    {
      step: 3,
      name: 'Transaction Completed',
      description: ' ',
      isTrue: ' ',
      isChecked: false
    },
    {
      step: 4,
      name: 'Transaction Failed',
      description: ' ',
      isTrue: ' ',
      isChecked: true
    },
    {
      step: 5,
      name: 'Transaction Canceled',
      description: ' ',
      isTrue: ' ',
      isChecked: true
    }
  ];

  statments = [
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED',
    'CANCELED',
    'REFUNDED'
  ];

  statusId = 'PENDING';
  statusSteps: { [key: number]: string[] } = {
    1: ['PENDING'],
    2: ['PROCESSING','DD-DEPOSITING','DD','DD-FUNDING'],
    3: ['COMPLETED','DDC'],
    4: ['FAILED','DD FAILED','DD-DEPOSIT-F','DD/F'],
    5: ['CANCELED', 'REFUNDED','DD/AR','DD/R']
  };

  currentStatus = 1;
  paymentDetails: IPaymentDetails;
  payeeBankDetails: IPayeeBankDetails;
  fromDetails: IPaymentSendDetails;
  paymentStatus: IPaymentStatements;
  memo: string;

  ngOnInit(): void {
    this.transactionId = this.route.snapshot.params?.id;
    this.getPaymentStatus();
    this.scriptService.addZohoSrcipt();
  }

  getPaymentStatus() {
    this.subscriptions.push(
      this.outsideService
        .paymentStatus(this.transactionId)
        .subscribe((res) => {
          this.paymentDetails = res.data[0];
          this.fromDetails = res.data[0].from;
          this.payeeBankDetails = res.data[0].payee_bank_details;
          this.statusId = this.paymentDetails.status;
          this.currentStatus = this.getcurrentStatus(this.statusId);
          this.paymentStatus = this.paymentDetails.statements;
          this.getData(this.paymentStatus);
          if (this.currentStatus <= 3) {
            this.progressBarData[2].isTrue = 1;
          } else if (this.currentStatus === 4) {
            this.progressBarData[3].isTrue = 1;
          } else if (this.currentStatus === 5) {
            this.progressBarData[4].isTrue = 1;
          }
          this.memo = res.data[0].description as string;
        })
    );
  }

  getData(obj: IPaymentStatements) {
    for (const key in obj) {
      if (this.statments.includes(key)) {
        obj[key as keyof IPaymentStatements].forEach((ele) => {
          if (ele.description) {
            const formattedDate = ele.created_at.replace(/_/g, ' ');
            this.progressBarData[this.getIndex(ele.index)].description +=
              `${ele.description  }   ${  formattedDate  }<br/>`;
          }
        });
      }
    }
  }

  getcurrentStatus(statusId: string) {
    for (const step in this.statusSteps) {
      if (this.statusSteps[step]?.includes(statusId)) {
        return Number(step);
      }
    }
    return 1;
  }

  getIndex(value: number) {
    if (value === 5 || value === 3) {
      return 4;
    } if (value === 4) {
      return 3;
    } 
      return value;  
  }

  onGoToWebsite(): void {
    window.open(this.staticWhiteLabelConditions.website);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
  }
}
