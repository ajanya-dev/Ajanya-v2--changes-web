import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgSelectModule } from '@ng-select/ng-select';
import {
  IPayAsItem,
  IPayFromItem,
  IPaymentSuccessData,
  IReceivePayItem
} from 'src/app/modules/payments/model/payments';
import { PaymentData } from 'src/app/modules/payments/shared/components/payments-main-v35/payments-data-v35';
import { FormsModule } from '@angular/forms';
import { Utils } from 'src/app/data/utils';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import {  faHandPointer } from '@fortawesome/pro-solid-svg-icons';
import { IntroPaymentSuccessComponent } from '../intro-payment-success/intro-payment-success.component';
import { PayFormComponent } from '../../components/payment-forms/pay-form/pay-form.component';
import { ReceiveFormComponent } from '../../components/payment-forms/receive-form/receive-form.component';
import { IntroService } from '../../service/intro.service';
import { VerifyCardModalComponent } from '../../components/verify-card-modal/verify-card-modal.component';
import { DirectDepositModalComponent } from '../../components/direct-deposit-modal/direct-deposit-modal.component';

@Component({
  selector: 'app-intro-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FontAwesomeModule,
    NgSelectModule,
    CommonButtonV35Component,
    FormsModule,
    DemoVideoComponent,
    IntroPaymentSuccessComponent,
    ReceiveFormComponent,
    PayFormComponent,
    MatTooltipModule,
    VerifyCardModalComponent
  ],
  templateUrl: './intro-home.component.html',
  styleUrl: './intro-home.component.scss'
})
export class IntroHomeComponent implements OnInit, OnDestroy {
  @ViewChild('container') container: ElementRef;


  introService = inject(IntroService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  faArrowPointer = faHandPointer;


  customSwitch: 'RECEIVE' | 'PAY' = 'PAY';

  payFromItems = PaymentData.getPayFromItems();
  showBankDetails = false;
  selectedPayFromItem?: IPayFromItem = this.payFromItems[0];
  payAsItems: IPayFromItem['payOptions'] = this.payFromItems[0].payOptions;
  selectedPayAsItem?: IPayAsItem = (this.payAsItems as IPayAsItem[])[0];

  receiveToItems = PaymentData.getReceiveToItems();
  selectedReceiveToItem: IReceivePayItem = this.receiveToItems[0];
  receiveFromItems: IPayAsItem[] = this.selectedReceiveToItem
    .payOptions as IPayAsItem[];

  selectedReceiveFromItem: IPayAsItem | undefined = this.receiveFromItems[0];
    

  // isShowSuccess: boolean = false;
  // isSaved : boolean = false;
  // isBlinking: boolean = true;
  successData: IPaymentSuccessData;
  isPaymentInitLoading = false;

  utils = Utils;
  paymentConfig = {
    mode: 'CREATE'
  };

  subscriptions: Subscription[] = [];

  ngOnInit(): void {
    if(this.introService.isPageReloaded()){
      this.router.navigate(['/manage/home']);
      return;
    }
    this.routerChanges();
    const { confirm } = this.activatedRoute.snapshot.queryParams;
    const { payAs, payFrom } = this.introService.introForm.value;

    if (confirm && payAs && payFrom) {
      this.selectedPayFromItem = this.payFromItems.find(
        (item) => item.id === payFrom
      );
      this.selectedPayAsItem = this.selectedPayFromItem?.payOptions?.find(
        (item) => item.id === payAs
      );
    } else {
      this.introService.introForm.patchValue({
        payAs: (this.payAsItems as IPayAsItem[])[0].id,
        payFrom: this.payFromItems[0].id
      });
      this.selectedPayFromItem = this.payFromItems[0];
      this.selectedPayAsItem = (this.payAsItems as IPayAsItem[])[0];
    }
  }



  /**
   * @description This method is to used to reset the values of the payAs and payFrom in the component and introForm.
   * This will invoke the onInit method and executes the else block in onInit.
   */
  routerChanges() {
    this.subscriptions.push(
      this.router.events.subscribe((res) => {
        if (res instanceof NavigationEnd) {
          const url = res.url.split('?');
          if (
            url[0] === '/intro-tour/manage/home' &&
            (url[1] === undefined || url[1] === null)
          ) {
            this.ngOnInit();
          }
        }
      })
    );
  }

  /**
   * @description Method invoked when pay/receive tabs are switched in template.
   * @param tab - Pay / Receive tab.
   */
  onChangeTab(tab: 'RECEIVE' | 'PAY') {
    this.introService.isBlinking.set(false);
    this.customSwitch = tab;
    if (tab === 'RECEIVE') {
      this.showBankDetails = false;
      this.introStepUpdate('.intro-receive-from');  
      if(this.introService.recieveFrom() === ''){
        this.introService.recieveFrom.set('payer');
      }    
    } else {
      this.showBankDetails = true;
      this.introStepUpdate('.intro-pay-from');
    }
  }

  /**
   * @description Method to set pay-from item and necessary settings.
   * @param item - Pay-from item.
   * @param payAs - Pay-as item.
   */
  payFromSelected(item: IPayFromItem, payAs?: IPayAsItem) {
    this.introService.introForm.patchValue({
      payFrom: item.id
    });
    const payFromItem = this.payFromItems.find(
      (listItem) => item.id === listItem.id
    );

    if (payAs?.id !== this.selectedPayAsItem?.id) {
      this.selectedPayAsItem = payAs;
    }
    this.selectedPayFromItem = payFromItem;
    if (payFromItem?.payOptions) {
      if (item.id === 'wallet') {
        this.payAsItems = payFromItem.payOptions.filter(
          (options) => options.id !== 'check_print'
        ); // coming soons
      } else {
        this.payAsItems = payFromItem.payOptions;
      }
    }
    const payAsItem = this.payAsItems?.find(
      (listItem) => listItem.id === payAs?.id
    );
    this.payAsSelected(payAsItem ?? (this.payAsItems as IPayFromItem[])[0]);
  }

  /**
   * @description Method to set pay-as item and necessary settings.
   * @param payAsItem - Pay-as item.
   */
  payAsSelected(payAsItem: IPayAsItem) {
    this.introService.introForm.patchValue({
      payAs: payAsItem.id
    });
    this.selectedPayAsItem = payAsItem;
    this.introService.isShowSuccess.set(false);
    // this.onPaymentContextChange();
  }

  /**
   * @description Method to set receive-to item and necessary settings.
   * @param item - Receive-to item.
   */
  receiveToSelected(item: IReceivePayItem) {
    this.selectedReceiveToItem = item;
    this.selectedReceiveFromItem = item?.payOptions?.[0] ?? undefined;
    this.receiveFromItems = item.payOptions ?? [];
    this.introService.isShowSuccess.set(false);
  }

  /**
   * @description Method to set receive-from item and necessary settings.
   * @param item - Receive-from item.
   */
  receiveFromSelected(item: IPayAsItem) {
    this.introService.introSelectedReceiveFrom = item;
    if (item.id === 'payer') {
      this.introService.recieveFrom.set('payer');
      this.introStepUpdate('.intro-amount-receive-payer');
    } else if (item.id === 'email') {
      this.introService.recieveFrom.set('email');
      this.introStepUpdate('.intro-amount-receive-email');
    } else {
      this.introService.recieveFrom.set('sms');
      this.introStepUpdate('.intro-amount-receive-sms');
    }
    const selectedReceiveFromItem = this.receiveFromItems.find(
      (receiveFromItem) => item.id === receiveFromItem.id
    );    
    this.introService.isShowSuccess.set(false);
    this.selectedReceiveFromItem = selectedReceiveFromItem;
  }

  receiveFromClose() {
    if (this.selectedReceiveFromItem?.id === 'payer') {
      this.introStepUpdate('.intro-amount-receive-payer');
    } else if (this.selectedReceiveFromItem?.id === 'email') {
      this.introStepUpdate('.intro-amount-receive-email');
    } else {
      this.introStepUpdate('.intro-amount-receive-sms');
    }
  }

  introStepUpdate(selector: string) {
    this.introService.introStepChange.next(selector);
  }

  saveButtonClicked() {
    this.introService.isSaved.set(true);
    this.introService.isShowSuccess.set(true);
    this.introStepUpdate('#intro-payment-success-view-btn');
  }

  sendClicked(){
    this.introStepUpdate('.intro-home-send-button');
  }

  printClicked(){
    this.introStepUpdate('.intro-home-print-button');
  }

  sendOrPrintClicked(){
    this.introService.isShowSuccess.set(true);
    this.introStepUpdate('.intro-finished');
  }

  paymentButtonClicked() {
    if (this.selectedPayFromItem?.id === 'card') {
      this.openModal();
    } else if (this.selectedPayFromItem?.id === 'bankaccount') {
      this.openDirectDepostModal();
    } else {
      this.introService.isShowSuccess.set(true);
      this.introService.introForm.reset();
      this.introStepUpdate('.intro-finished');
    }
  }

  closePaymentSuccess() {
    this.router.navigate(['/intro-tour/manage/home']);
    this.introService.introForm.reset();
    this.introService.isShowSuccess.set(false);
  }

  paymentRequestClicked() {
    this.introService.isShowSuccess.set(true);
    this.introService.introForm.reset();
    this.introStepUpdate('.intro-finished');
  }

  closePaymentRequestSuccess() {
    this.router.navigate(['/intro-tour/manage/home']);
    this.introService.isShowSuccess.set(false);
    this.customSwitch = 'RECEIVE';
  }

  openModal() {
    const verifyModal = this.dialog.open(VerifyCardModalComponent, {
      width: '542px',
      minHeight: '583px',
      disableClose: true
    });

    verifyModal.afterOpened().subscribe(() => {
      this.introStepUpdate('.intro-verify-invoice');
    });

    this.subscriptions.push(
      verifyModal.afterClosed().subscribe((res) => {        
        if(res === 'processed'){
          this.introService.isShowSuccess.set(true);
          this.introService.introForm.reset();
          this.cdr.detectChanges();
          this.introStepUpdate('.intro-finished');
        }else{
          this.introService.isSaved.set(true);
          this.introService.isShowSuccess.set(true);
          this.cdr.detectChanges();
          this.introStepUpdate('#intro-payment-success-view-btn');
        }
      })
    );
  }

  openDirectDepostModal(){
    const directDepositModal = this.dialog.open(DirectDepositModalComponent, {
      width: '75%',
      disableClose: true
    });

    directDepositModal.afterOpened().subscribe(() => {
      this.introStepUpdate('.mat-mdc-dialog-container');
    });

    this.subscriptions.push(
      directDepositModal.afterClosed().subscribe((res) => {
        if(res === 'direct-deposit'){
          this.introService.isShowSuccess.set(true);
          this.introService.introForm.reset();
          this.cdr.detectChanges();
          this.introStepUpdate('.intro-finished');
        }else{
          this.introStepUpdate('.intro-pay-receive');
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.introService.isSaved.set(false);
    this.introService.recieveFrom.set('');
    this.introService.isShowSuccess.set(false);
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
