import { Injectable, inject, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FormBuilder } from '@angular/forms';
import { IIntroFlow, IIntroStep } from '../model/intro';
import { IPayAsItem } from '../../payments/model/payments';

@Injectable({
  providedIn: 'root'
})
export class IntroService {
  private fb = inject(FormBuilder);

  /**
   * Used to know the home page wants to show success template or form template
   */
  isShowSuccess  = signal<boolean>(false);
  /**
   * Used to know the whether the payment is saved or initiated
   */
  isSaved  = signal<boolean>(false);

  isBlinking = signal<boolean>(true);



  /**
   * Used to know if page refreshed (if refreshed redirect the path to main home page)
   */
  isPageReloaded  = signal<boolean>(true);
 
  /**
   * Used to know which recieve from is selected by user
   */
  recieveFrom  = signal<string>('');
  /**
   * @description values = ['startIntro', 'initiateComponent']
   * initiateComponent = To initiate the intro-box component in the app-component
   * startIntro = once the component is initiated, this is passed to start the intro tour.
   */
  introTrigger = new BehaviorSubject<string>('startIntro');

  /**
   * @description This subject is to get the current status of introTour, default being false ie, intro is not started
   */
  introStatus = new BehaviorSubject<boolean>(false);

  /**
   * @description This subject is used to update the intro step.
   */
  introStepChange = new BehaviorSubject<string>('');

  /**
   * @description This variable save the url before the intro tour has started.
   */
  beforeUrl: string;

  /**
   * @description This variable holds the active component in home page
   */
  introPaymentCustomSwitch: 'RECEIVE' | 'PAY' = 'PAY';

  /**
   * @description This variable holds the selected receive from option in home payment.
   */
  introSelectedReceiveFrom: IPayAsItem = {} as IPayAsItem;

  /**
   * @description This variable holds the current intro step
   */
  currentIntroStep: IIntroStep = {} as IIntroStep;

  /**
   * @description This form stores the data of payment.
   */
  introForm = this.fb.group({
    payFrom: [''],
    payAs: [''],
    amount: [''],
    selectedBankAccount: [''],
    selectedPayee: [''],
    checkNo: [''],
    payeeAccNumber: [''],
    invoiceNo: [''],
    issueDate: [''],
    category: [''],
    memo: [''],
    payeeBankAc: [''],
    payeeEmail: [''],
    selectedCard: [''],
    selectedWallet: [''],
    selectedCloudBank: ['']
  });

  getIntroSteps(flow: string): IIntroStep[] {
    const introFlows: IIntroFlow = {
      home: [
        {
          selector: '.intro-pay-receive',
          description: 'Click to toggle Pay or Receive',
          introBoxPosition: 'left',
          nextButton: false,
          padding: true,
          paddingType: 'low'
        },

        // Intro for receive form
        {
          selector: '.intro-receive-from',
          description: 'Click here to select an option from Receive From.',
          introBoxPosition: 'bottom',
          nextButton: true,
          checkFormOnNext : true,
          prevButton: true,
          delayBefore: 0.1,
          padding : true,
          paddingType : 'low'
        },
        {
          selector: '.ng-dropdown-panel-items',
          description: 'Choose an option from the dropdown',
          introBoxPosition: 'left',
          noSelectionRemoval: true,
          nextButton: false,
          padding: true,
          skipOnNext: true,
          delayBefore: 0.1
        },

        // If user selects the payer from receiveFrom
        {
          selector: '.intro-amount-receive-payer',
          description: 'Enter the amount to pay',
          introBoxPosition: 'bottom',
          nextButton: true,
          prevButton: true,
          delayBefore: 0.1
        },
        {
          selector: '.intro-memo-receive-payer',
          description: 'Enter memo',
          introBoxPosition: 'bottom',
          nextButton: true,
          prevButton: true,
          delayBefore: 0.1
        },
        {
          selector: '.receive-from-bank-dropdown',
          description: 'Click here to select a bank account.',
          introBoxPosition: 'left',
          nextButton: false,
          prevButton: true,
          delayBefore: 0.1
        },
        {
          selector: '.ng-dropdown-panel-items',
          description: 'Choose an option from the dropdown',
          introBoxPosition: 'left',
          noSelectionRemoval: true,
          nextButton: false,
          padding: true,
          skipOnNext: true,
          delayBefore: 0.1
        },
        {
          selector: '.receive-from-payee-dropdown',
          description: 'Click here to select a payee.',
          introBoxPosition: 'left',
          nextButton: false,
          prevButton: true,
          delayBefore: 0.1
        },
        {
          selector: '.ng-dropdown-panel-items',
          description: 'Choose an option from the dropdown',
          introBoxPosition: 'left',
          noSelectionRemoval: true,
          nextButton: false,
          padding: true,
          skipOnNext: true,
          delayBefore: 0.1
        },

        // If user selects the email from receiveFrom
        {
          selector: '.intro-amount-receive-email',
          description: 'Enter the amount to pay',
          introBoxPosition: 'bottom',
          nextButton: true,
          prevButton: true,
          jumpOnPrev: 1,
          delayBefore: 0.1
        },
        {
          selector: '.intro-memo-receive-email',
          description: 'Enter memo',
          introBoxPosition: 'bottom',
          nextButton: true,
          prevButton: true,
          delayBefore: 0.1
        },
        {
          selector: '.receive-from-email-input',
          description: 'Please enter an email.',
          introBoxPosition: 'left',
          nextButton: true,
          prevButton: true,
          delayBefore: 0.1
        },
        {
          selector: '.receive-from-payee-dropdown',
          description: 'Click here to select a payee.',
          introBoxPosition: 'left',
          nextButton: false,
          prevButton: true,
          delayBefore: 0.1
        },
        {
          selector: '.ng-dropdown-panel-items',
          description: 'Choose an option from the dropdown',
          introBoxPosition: 'left',
          noSelectionRemoval: true,
          nextButton: false,
          padding: true,
          skipOnNext: true,
          delayBefore: 0.1
        },

        // If user selects the sms from receiveFrom
        {
          selector: '.intro-amount-receive-sms',
          description: 'Enter the amount to pay',
          introBoxPosition: 'bottom',
          nextButton: true,
          prevButton: true,
          jumpOnPrev: 1,
          delayBefore: 0.1
        },
        {
          selector: '.intro-memo-receive-sms',
          description: 'Enter memo',
          introBoxPosition: 'bottom',
          nextButton: true,   
          prevButton: true,
          delayBefore: 0.1
        },
        {
          selector: '.receive-from-sms-input',
          description: 'Please enter mobile no.',
          introBoxPosition: 'left',
          nextButton: true,
          prevButton: true,
          delayBefore: 0.1
        },
        {
          selector: '.receive-from-payee-dropdown',
          description: 'Click here to select a payee.',
          introBoxPosition: 'left',
          nextButton: false,
          prevButton: true,
          delayBefore: 0.1
        },
        {
          selector: '.ng-dropdown-panel-items',
          description: 'Choose an option from the dropdown',
          introBoxPosition: 'left',
          noSelectionRemoval: true,
          nextButton: false,
          padding: true,
          skipOnNext: true,
          delayBefore: 0.1
        },

        {
          selector: '#intro-home-receive-request-button',
          description: 'Click here to make the request.',
          introBoxPosition: 'bottom',
          nextButton: false,
          prevButton: true,
          checkFormOnPrev : true,
          closeIntroBoxAfter: true,
          padding: true,
          paddingType: 'low'
        },

        // Intro for Payment Form
        {
          selector: '.intro-pay-from',
          description: 'Select the source of payment here',
          introBoxPosition: 'bottom',
          nextButton: true,
          prevButton : true,
          jumpOnPrev : 0,
          delayBefore: 0.1,
          padding : true,
          paddingType : 'low'
        },
        {
          selector: '.ng-dropdown-panel-items',
          description: 'Choose an option from the dropdown',
          introBoxPosition: 'left',
          noSelectionRemoval: true,
          nextButton: false,
          padding: true,
          skipOnNext: true,
          delayBefore: 0.1
        },
        {
          selector: '#intro-pay-as',
          description: 'Select the payment method to move the fund out',
          introBoxPosition: 'top',
          nextButton: true,
          prevButton : true,
          padding : true,
          paddingType : 'low'
        },
        {
          selector: '.ng-dropdown-panel-items',
          description: 'Choose an option from the dropdown',
          introBoxPosition: 'right',
          nextButton: false,
          noSelectionRemoval: true,
          padding: true,
          skipOnNext: true,
          delayBefore: 0.1
        },
        {
          selector: '.intro-home-payment-amount',
          description: 'Enter the amount to pay',
          introBoxPosition: 'bottom',
          nextButton: true,
          prevButton : true,
          delayBefore: 0.1
        },
        {
          selector: '.intro-payment-wrapper-div',
          description: 'Provide additional information needed for the payment here',
          introBoxPosition: 'left',
          nextButton: true,
          prevButton : true,
          padding: true
        },
        {
          selector: '.intro-home-payment-button',
          description: 'Save the payment to process later or process the payment now',
          introBoxPosition: 'bottom',
          nextButton: false,
          prevButton : true,
          closeIntroBoxAfter: true,
          padding: true,
          delayBefore: 0.1,
          paddingType: 'low'
        },
        {
          selector: '.intro-home-send-button',
          description: 'From here you can mail your checks.',
          introBoxPosition: 'top',
          nextButton: false,
          closeIntroBoxAfter: true,
          delayBefore: 0.1,
          padding: true,
          paddingType: 'low'
        },
        {
          selector: '.mat-mdc-dialog-container',
          description: 'Click the Mail Now button to Mail your check',
          introBoxPosition: 'right',
          nextButton: false,
          closeIntroBoxAfter: true,
          padding: true,
          delayBefore: 0.3,
          paddingType: 'low'
        },
        {
          selector: '.mat-mdc-dialog-container',
          description: 'Click the Send Email button to Email your check',
          introBoxPosition: 'right',
          nextButton: false,
          closeIntroBoxAfter: true,
          padding: true,
          delayBefore: 0.3,
          paddingType: 'low'
        },
        {
          selector: '.intro-home-print-button',
          description: 'Click here to print your check',
          introBoxPosition: 'top',
          nextButton: false,
          closeIntroBoxAfter: true,
          padding: true,
          delayBefore: 0.1,
          paddingType: 'low'
        },
        {
          selector: '#intro-home-payment-save-button',
          description: 'Click here to make the transaction.',
          introBoxPosition: 'bottom',
          nextButton: false,
          prevButton : true,
          closeIntroBoxAfter: true,
          padding: true,
          paddingType: 'low'
        },
        {
          selector: '#intro-payment-success-view-btn',
          description: 'Click to see the payment.',
          introBoxPosition: 'left',
          nextButton: false,
          prevButton : true,
          jumpOnPrev : 0,
          pageChangeOnPrev : 'payment-page',
          closeIntroBoxAfter: true,
          delayBefore: 0.1,
          padding: true,
          paddingType: 'low'

        },
        {
          selector: '.intro-payment-table-rows',
          description: 'Here is the payment you just initiated',
          introBoxPosition: 'top',
          nextButton: true,
          selectElementIndex: 0,
          delayBefore: 0.1
        },
        {
          selector: '.intro-payment-table-rows-pay',
          description: 'Click here to pay.',
          introBoxPosition: 'top',
          nextButton: false,
          prevButton: true,
          selectElementIndex: 0,
          padding: true,
          paddingType: 'low'
        },
        {
          selector: '.paymentButton',
          description: 'Process the payment with your desired method.',
          introBoxPosition: 'left',
          nextButton: false,
          delayBefore: 0.1,
          padding: true,
          paddingType: 'low'
        },
        {
          selector: '.mat-mdc-dialog-container',
          description: 'Please Click the Process Now button to complete the transaction',
          introBoxPosition: 'right',
          nextButton: false,
          delayBefore: 0.1,
          padding: true,
          paddingType: 'low'
        },
        {
          selector: '.intro-verify-invoice',
          description: 'This the verify invoice modal',
          introBoxPosition: 'left',
          nextButton: true,
          delayBefore: 0.3
        },
        {
          selector: '.intro-verify-invoice-upload',
          description: 'Click here and upload required file',
          introBoxPosition: 'left',
          nextButton: true,
          prevButton : true
        },
        {
          selector: '#intro-verify-invoice-next-button',
          description: 'Click here to go to next step',
          introBoxPosition: 'left',
          nextButton: false
        },
        {
          selector: '.intro-verify-invoice-signature-div',
          description: 'Click here to select a signature',
          introBoxPosition: 'left',
          nextButton: false,
          delayBefore: 0.1
        },
        {
          selector: '.intro-signature-div',
          description: 'Here you can create a new signature',
          introBoxPosition: 'left',
          nextButton: true,
          delayBefore: 0.1
        },
        {
          selector: '.intro-signature-pad',
          description: 'Sign here and click next',
          introBoxPosition: 'left',
          nextButton: true,
          prevButton : true,
          delayBefore: 0.1
        },
        {
          selector: '.intro-signature-name-input',
          description: 'Name your signature, and click next',
          introBoxPosition: 'left',
          nextButton: true,
          prevButton : true,
          delayBefore: 0.1
        },
        {
          selector: '.intro-signature-save-button',
          description: 'Click here to save the sign',
          introBoxPosition: 'left',
          nextButton: false,
          prevButton : true,
          delayBefore: 0.1,
          padding : true,
          paddingType : 'low'
        },
        {
          selector: '#intro-verify-invoice-next-button',
          description: 'Click here to go to next step',
          introBoxPosition: 'left',
          nextButton: false
        },
        {
          selector: '.intro-finished',
          description: 'Intro tour has been completed.',
          introBoxPosition: 'left',
          nextButton: false,
          delayBefore: 0.1,
          isLastStep: true,
          padding: true
        }
      ]
    };

    return introFlows[flow];
  }
}
