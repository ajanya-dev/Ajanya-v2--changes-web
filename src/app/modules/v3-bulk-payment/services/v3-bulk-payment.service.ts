import { Utils } from 'src/app/data/utils';
import { OnDestroy, Injectable, inject, signal } from '@angular/core';
import { finalize, catchError, concatMap, take } from 'rxjs/operators';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders
} from '@angular/common/http';
import {
  of,
  Observable,
  Subscription,
  BehaviorSubject,
  Subject,
  from
} from 'rxjs';
import { IApiRes } from 'src/app/models/api';
import {
  ICheckMailData,
  IEmailCheckData,
  IPaymentSummaryData,
  IRequiredDocsValue,
  IRequiredDocument,
  IRequiredDocumentRes,
  IResponse,
  IZilPyamentLists
} from 'src/app/modules/v3-bulk-payment/model/v3-bulk-payment';
import { environment } from 'src/environments/environment';
import {
  IMailShippingCalculations,
  IShippingCostCalculation
} from 'src/app/modules/check/model/check';
import { UserPermissionAlertService } from 'src/app/shared/service/permission/user-permission-alert.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { IShippingTypes } from 'src/app/modules/business-tools/plexe/model/plexe';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { PaymentTypeAccessService } from 'src/app/shared/service/common/shared/payment-type-access/payment-type-access.service';
import { CommonOnInitService } from 'src/app/shared/service/common-onInit/common-on-init.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { IExistingCreditCards } from '../../../models/payment-switch-board';

/**
 * @description Interface to include property 'PaymentMethode' to interface 'IzilPyamentLists'.
 */
interface IZilPaymentListsExtended extends IZilPyamentLists {
  PaymentMethode?: string;
}

/**
 * @description Interface for Zil payments forms
 */
interface IZilPaymentsForms {
  uuid: string;
  payeeAcc: string;
  email: string;
  from: string;
  documents?: IRequiredDocsValue;
}

/**
 * @description Service for bulk payments.
 */
@Injectable({
  providedIn: 'root'
})
export class V3BulkPaymentService implements OnDestroy {
  /* Injectors */
  private http = inject(HttpClient);
  private userPermissionService = inject(UserPermissionAlertService);
  private paymentTypeAccessService = inject(PaymentTypeAccessService);
  private utils = Utils;
  private commonService = inject(CommonOnInitService);
  private sharedService = inject(SharedService);


  /* Variables */
  ROOT_URL = environment.rootUrl;
  subscription: Subscription[] = [];
  bulkPaymentsUuidList: string[] = [];
  paymentListData: IZilPyamentLists[] | undefined;
  isAllDetailsAPICalled = false;
  checkOption: string;
  isBulkPayProcessing = false;
  isCustomAddress = new Subject<boolean>();
  checkPrintPayments = new Subject<IZilPaymentListsExtended[]>();
  checkDDPayments = new Subject<IZilPaymentListsExtended[]>();
  checkMailPayments = new Subject<IZilPaymentListsExtended[]>();
  checkEmailPayments = new Subject<IZilPaymentListsExtended[]>();
  private isBulkPaymentsApiReadySubject = new BehaviorSubject<
    boolean | undefined
  >(undefined);
  
  private isBulkPaymentProcessing = new BehaviorSubject<boolean>(false);
  walletCheckMailShippingFeeSubject = new BehaviorSubject<string>('0.00');
  bankCheckMailShippingFeeSubject = new BehaviorSubject<string>('0.00');
  totalShippingFeeSubject = new BehaviorSubject<string>('0.00');
  totalAttachmentFeeSubject = new BehaviorSubject<string>('0.00');
  private isLoadingAttachmentFeeSubject = new BehaviorSubject<boolean>(false);
  private isCheckModeSelected = new BehaviorSubject<boolean>(true);
  private bulkPaymentSummery = new BehaviorSubject<
    (IPaymentSummaryData | IPaymentSummaryData[])[]
  >([]);

  private bulkPaymentCount = new BehaviorSubject<number>(0);
  private countOfCompletedPayments = new BehaviorSubject<number>(0);
  private backButtonClicked = new Subject<boolean>();
  public bulkPayChanges$ = new Subject<boolean>();
  bulkPaymentsCheckIdList: string[] = [];
  requiredDocs: IRequiredDocument[] = [];
  bulkPaymentForm: FormGroup;
  isCheckPrintProcessing = false;
  isCheckDDProcessing = false;
  isBulkCheckProcessing = false;
  selectedCheckTypes: (string | undefined)[] = [];
  isSendToOneAddress = false;
  sendToOneAddressEmail = new FormControl('', [
    Validators.required,
    ValidationService.emailValidator
  ]);

  isAbcEntCustomer = signal(false);
  abcEntCheckPrintCountSignal = signal<{total:number,success:number,fail:number,canceled:number} | undefined>(undefined);

  // Wallet check print paper type: 4 = Print-Check Paper, 6 = Print-White Paper
  walletCheckPrintPaperType: number = 4;

  isWalletCheckMail = signal(false);
  isWalletCheck = signal(false); // WALLET + (MAIL or CHECK)

  totalPaymentAmount = signal<number>(0);
  totalPaymentCount = signal<number>(0);

  // Shipping types state
  private shippingTypesSubject = new BehaviorSubject<IShippingTypes[]>([]);
  shippingTypes$ = this.shippingTypesSubject.asObservable();

  /**
   * Initializes bulk payment processing.
   *
   * @param bulkPaymentsUuidList - List of bulk payment UUIDs.
   * @param checkIdList - Optional list of check IDs.
   * @returns An observable indicating the readiness of the bulk payments API.
   */
  initBulkPayment(bulkPaymentsUuidList: string[], checkIdList?: string[]) {
    this.bulkPaymentsUuidList = bulkPaymentsUuidList;
    this.bulkPaymentsCheckIdList = checkIdList ?? [];
    this.isAllDetailsAPICalled = false;
    return this.isBulkPaymentsApiReadySubject.asObservable();
  }

  setBackButtonClicked() {
    this.backButtonClicked.next(true);
  }

  getBackButtonClicked() {
    return this.backButtonClicked.asObservable();
  }

  /**
   * @description Gets the bulk payment uuid list from the selected row and using it, loads the payment list data for zil payment.
   */
  getAllDetails(): void {
    this.paymentListData = [];
    if (this.isAllDetailsAPICalled) {
      return;
    }
    if (
      this.bulkPaymentsUuidList.length > 0 ||
      this.bulkPaymentsCheckIdList.length > 0
    ) {
      this.getZilpaymentDetails();
    }

    // if (this.selectedRowData?.length === this.bulkPaymentsUuidList?.length) {
    //   this.getZilpaymentDetails();
    // }
  }

  /**
   * @description Gets the Zil payment data using uuids.
   */
  getZilpaymentDetails(): void {
    this.isBulkPaymentsApiReady = false;
    this.subscription.push(
      this.zilPaymentLists(
        this.bulkPaymentsUuidList,
        this.bulkPaymentsCheckIdList
      ).subscribe((res) => {
        this.paymentListData = res?.data;
        this.checkForRequiredDocuments(this.paymentListData);
      })
    );
  }

  /**
   * Checks for required documents for a list of Zil payments.
   * @param paymentListData - List of Zil payment data.
   */
  checkForRequiredDocuments(paymentListData: IZilPyamentLists[]) {
    const payments: { uuid: string }[] = paymentListData
      .filter((el) => el.sourceType === 'CARD')
      .map((element) => ({ uuid: element.id }));

    this.isWalletCheckMail.set(
      paymentListData.some((el) => el.sourceType === 'WALLET' && el.transferType === 'MAIL')
    );
    this.isWalletCheck.set(
      paymentListData.some((el) => el.sourceType === 'WALLET' && (el.transferType === 'MAIL' || el.transferType === 'CHECK'))
    );

    // Load shipping types if wallet mail payments exist
    this.loadShippingTypes();

    if (payments.length > 0) {
      this.subscription.push(
        this.getRequiredDocuments(payments)
          .pipe(
            finalize(() => {
              this.isAllDetailsAPICalled = true;
              this.isBulkPaymentsApiReady = true;
            })
          )
          .subscribe((res) => {
            this.requiredDocs = res.documents;
          })
      );
    } else {
      this.isBulkPaymentsApiReady = true;
      this.isAllDetailsAPICalled = true;
    }
  }

  /**
   * Opens a verification modal for a card invoice from bulk payment.
   *
   * @param paymentFormGroup - Form group representing payment details.
   * @param mode - Payment mode.
   */
  openVerifyCardInvoiceModalFromBulkPayment(
    paymentFormGroup: FormGroup,
    mode: string,
    isV3 = true
  ) {
    const card = paymentFormGroup.value.source as IExistingCreditCards;
    const { amount } = paymentFormGroup.value;
    const invoiceNumber = paymentFormGroup.value.referenceNo;
    const reqDocs =
      paymentFormGroup.value.documents?.requiredDocs?.required_docs ?? [];
    const payeeDetails = paymentFormGroup.value.payee;
    if (
      !(card && amount && invoiceNumber && payeeDetails && reqDocs.length > 0)
    ) {
      return;
    }
    const dialogRef = isV3 ? this.commonService.openVerifyCardInvoiceModal(
      card,
      amount,
      mode,
      invoiceNumber,
      reqDocs,
      payeeDetails
    ) : this.commonService.openV4VerifyCardInvoiceModal(
      card,
      amount,
      mode,
      invoiceNumber,
      reqDocs,
      payeeDetails
    );
    this.subscription.push(
      dialogRef.afterClosed().subscribe((res) => {
        if (res?.success) {
          paymentFormGroup.controls.documents.setValue({
            requiredDocs: paymentFormGroup.value.documents?.requiredDocs,
            addedDocs: {
              ...paymentFormGroup.value.documents?.addedDocs,
              ...res.data
            }
          });
          paymentFormGroup.controls.documents.updateValueAndValidity();
          if (res.data.card && res.data.cardReverse) {
            this.checkForCardIdInReqDocsAndRemove(
              paymentFormGroup.controls.documents.value
            );
          }
        }
      })
    );
  }

  /**
   * Checks for and removes card-related documents from required documents.
   *
   * @param docs - Required documents value.
   */
  checkForCardIdInReqDocsAndRemove(docs: IRequiredDocsValue) {
    Object.keys(this.bulkPaymentForm.controls).forEach((contolName) => {
      const paymentformGroupBase = this.bulkPaymentForm.get(
        contolName
      ) as FormGroup;
      const paymentFormArray = paymentformGroupBase.get(
        Object.keys(paymentformGroupBase.controls)[0]
      ) as FormArray<FormGroup>;
      paymentFormArray.controls.forEach((paymentFormGroup) => {
        if (
          paymentFormGroup.value.from === 'CARD' ||
          paymentFormGroup.value.from === 'card'
        ) {
          const documents = paymentFormGroup.value
            ?.documents as IRequiredDocsValue;
          if (
            docs.requiredDocs?.uuid !== paymentFormGroup.value.uuid &&
            documents.requiredDocs?.cardId === docs.requiredDocs?.cardId &&
            documents.requiredDocs?.required_docs?.includes('card')
          ) {
            documents.requiredDocs.required_docs.splice(
              documents.requiredDocs.required_docs.indexOf('card'),
              1
            );
            paymentFormGroup.controls.documents.setValue({
              requiredDocs: paymentFormGroup.value.documents?.requiredDocs,
              addedDocs: {
                ...paymentFormGroup.value.documents?.addedDocs
              }
            });
            paymentFormGroup.controls.documents.updateValueAndValidity();
          }
        }
      });
    });
  }

  /**
   * @description Gets check details for check mailing, using uuids.
   * @param uuidList - List of uuids
   * @returns Object containing check mail data
   */
  getCheckMailDetails(uuidList: {
    ids: string[];
    is_signature: number;
  }): Observable<IApiRes<ICheckMailData>> {
    return this.http.post<IApiRes<ICheckMailData>>(
      `${this.ROOT_URL}/cheques/cheque-details`,
      uuidList
    );
  }

  /**
   * @description Gets the shipping cost, calculated using the provided data.
   * @param data - Data for shipping cost calculation.
   * @returns Object containing shipping cost and items info.
   */
  checkMailShippingCostCalculation(
    data: IMailShippingCalculations
  ): Observable<IApiRes<IShippingCostCalculation>> {
    return this.http.post<IApiRes<IShippingCostCalculation>>(
      `${this.ROOT_URL}/cheques/shipping-cost-calculation`,
      data
    );
  }

  /**
   * @description Gets data for emailing checks using check IDs.
   * @param checkIdList - List of check IDs.
   * @returns Object containing email info.
   */
  getCheckEmailDetails(checkIdList: {
    ids: string[];
  }): Observable<IApiRes<IEmailCheckData>> {
    return this.http.post<IApiRes<IEmailCheckData>>(
      `${this.ROOT_URL}/email-checks/get-data`,
      checkIdList
    );
  }

  /**
   * @description Gets Zil payment list data using uuids.
   * @param uuids - List of uuids.
   * @returns Array of zil payment data.
   */
  zilPaymentLists(
    uuids: string[],
    checkIds?: string[]
  ): Observable<IApiRes<IZilPyamentLists[]>> {
    return this.http.post<IApiRes<IZilPyamentLists[]>>(
      `${this.ROOT_URL}/zil-payments/get-list`,
      { ids: uuids, checkIds: checkIds ?? [] }
    );
  }

  /**
   * @description Gets Zil payment list data using uuids.
   * @param uuids - List of uuids.
   * @returns Array of zil payment data.
   */
  getRequiredDocuments(
    payments: { uuid: string }[]
  ): Observable<IRequiredDocumentRes> {
    return this.http.post<IRequiredDocumentRes>(
      `${this.ROOT_URL}/payment-methods/multiple-required-documents`,
      { payments }
    );
  }

  /**
   * @description Setter of Checking if Bulk Payments API is ready
   * @param data - Boolean value
   */
  set isBulkPaymentsApiReady(data: boolean) {
    this.isBulkPaymentsApiReadySubject.next(data);
  }

  /**
   * @description Getter of Checking if Bulk Payments API is ready
   * @returns Boolean observable.
   */
  get isBulkPaymentsApiReady$(): Observable<boolean | undefined> {
    return this.isBulkPaymentsApiReadySubject.asObservable();
  }

  /**
   * @description Process bulk payments one by one.
   * @param observables - An array of observables
   * @returns
   */
  processAllPaymentsSequentially(observables: (() => Observable<unknown>)[]) {
    return from(observables).pipe(concatMap((observable) => observable()));
  }

  /**
   * @description Creates observables using form data, for processing one after another.
   * @param formArray - Array of value of forms.
   * @param type - Type of bulk payment.
   * @returns Observable
   */
  processZilPaymentsSequentially(formArray: IZilPaymentsForms[], type: string) {
    this.paymentTypeAccessService.initialize({ pageId: 'payment_home_page' });
    return from(formArray).pipe(
      concatMap((form) => this.zilPayments(form, type))
    );
  }

  /**
   * @description Gets zil payments for each form details passed in.
   * @param formValues - IZilPaymentsForms
   * @param type - payment type
   * @returns zil payment data observable.
   */
  zilPayments(formValues: IZilPaymentsForms, type: string) {
    if (
      !this.paymentTypeAccessService.onInputChanges(type, {
        disableAlert: true
      })
    ) {
      this.completedPaymentCount = 1;
      return of(
        new HttpErrorResponse({
          error: {
            success: false,
            errorMsg: `${this.utils.capitalize(type)} transfer is not enabled.`,
            message: `${this.utils.capitalize(type)} transfer is not enabled.`
          } as IResponse
        })
      );
    }
    const headerOptions = new HttpHeaders({
      'Content-Type': 'application/json',
      isDisable422: 'true'
    });
    let payloadData;
    if (formValues.from === 'CARD') {
      payloadData = {
        payeeEmail: formValues.email,
        ...((type === 'ach' || type === 'wire') && {
          payeeBankAccountId: formValues?.payeeAcc
        }),
        documents: formValues.documents?.addedDocs
      };
    } else {
      payloadData = {
        payee_email: formValues.email,
        ...((type === 'ach' || type === 'wire') && {
          payee_bank_account_id: formValues?.payeeAcc
        })
      };
    }
    return this.http
      .post(
        `${this.ROOT_URL}/zil-payments/${formValues.uuid}/${
          formValues.from === 'CARD' ? 'card' : 'process-payment'
        }`,
        payloadData,
        { headers: headerOptions }
      )
      .pipe(
        finalize(() => {
          this.completedPaymentCount = 1;
        }),
        catchError(
          (error) => of(error) // Return null to continue with the next API call
        )
      );
  }

  /**
   * @description Method for sending check mail.
   * @param checkMailPayLoad - Data for sending check mail.
   * @param type - 'scheduled', 'recurring' or ''. ('' if neither scheduled nor recurring).
   * @param headerOption - Http header options.
   * @returns Observable with success or failure response.
   */
  sendCheckMail(
    checkMailPayLoad: IMailShippingCalculations,
    type = '',
    headerOption?: HttpHeaders
  ): Observable<IApiRes<string>> {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/cheques/sent-mail/${type}`,
      checkMailPayLoad,
      { headers: headerOption }
    );
  }

  /**
   * @description Method for printing checks.
   * @param payload - Data for check printing.
   * @param headerOption - Http header options.
   * @returns Observable with url for the pdf generated.
   */
  checkPrintPayment(
    payload: { checkId: string[]; paperType: number },
    headerOption?: HttpHeaders
  ): Observable<IApiRes<{ url: string }>> {
    return this.http
      .post<
        IApiRes<{ url: string }>
      >(`${this.ROOT_URL}/checks/multi/print`, payload, { headers: headerOption })
      .pipe(
        catchError((error) => {
          this.userPermissionService.handleErrorsAndPermissions(error, () => {
            this.userPermissionService.printCheckPermission(error);
          });
          throw error;
        })
      );
  }

  /**
   * @description Returns whether bulk payment is currently processing or not.
   * @returns boolean
   */
  getIsBulkPaymentProcessing(): Observable<boolean> {
    return this.isBulkPaymentProcessing.asObservable();
  }

  /**
   * @description Sets bulk payment processing status.
   * @param isProcessing - boolean
   */
  setIsBulkPaymentProcessing(isProcessing: boolean) {
    this.isBulkPaymentProcessing.next(isProcessing);
  }

  /**
   * @description set the Bulk payment data for Payment summary modal
   * @param summary - Contains selected Bulk payment data
   */
  setBulkPaymentData(summary: (IPaymentSummaryData | IPaymentSummaryData[])[]) {
    this.bulkPaymentSummery.next(summary);
  }

  /**
   * @description Gets the bulk payment summary information.
   * @returns Observable with summary info.
   */
  getBulkPaymentData(): Observable<
    (IPaymentSummaryData | IPaymentSummaryData[])[]
  > {
    return this.bulkPaymentSummery.asObservable();
  }

  /**
   * @description set the total number of bulk payment
   * @param count - Total number of selected Bulk Payment data
   */
  setBulkPaymentCount(count: number) {
    this.bulkPaymentCount.next(count);
  }

  /**
   * @description Selected Bulk Payment total count
   * @returns Observable with count.
   */
  getBulkPaymentCount(): Observable<number> {
    return this.bulkPaymentCount.asObservable();
  }

  /**
   * @description set the count of payment type when complete each api in bulk payment
   */
  set completedPaymentCount(count: number) {
    this.countOfCompletedPayments.next(count);
  }

  /**
   * @description Returns completed payment's count in Bulk payment.
   * @returns Observable with completed payments count.
   */
  get completedPaymentCount$(): Observable<number> {
    return this.countOfCompletedPayments.asObservable();
  }

  /**
   * @description Checks whether check mode is selected or not.
   * @returns Observable with boolean value.
   */
  getIsCheckModeSelected(): Observable<boolean> {
    return this.isCheckModeSelected.asObservable();
  }

  /**
   * @description Sets check mode selection status.
   * @param isSelected - boolean
   */
  setIsCheckModeSelected(isSelected: boolean) {
    this.isCheckModeSelected.next(isSelected);
  }

  /**
   * @description Getter method for total shipping fee.
   * @returns Observable with total shipping fee.
   */
  get totalShippingFee$(): Observable<string> {
    return this.totalShippingFeeSubject.asObservable();
  }

  /**
   * @description Setter method for setting total shipping fee to the subject.
   */
  set totalShippingFee(fee: string) {
    this.totalShippingFeeSubject.next(fee);
  }

  setTotalShippingFee() {
    const totalShipping = Number(this.walletCheckMailShippingFeeSubject.value) + Number(this.bankCheckMailShippingFeeSubject.value);
    this.totalShippingFeeSubject.next(totalShipping.toFixed(2));
  }

  /**
   * @description Getter method for total attachment fee.
   * @returns Observable with total attachment fee.
   */
  get totalAttachmentFee$(): Observable<string> {
    return this.totalAttachmentFeeSubject.asObservable();
  }

  /**
   * @description Setter method for setting total attachment fee to the subject.
   */
  set totalAttachmentFee(fee: string) {
    this.totalAttachmentFeeSubject.next(fee);
  }

  /**
   * @description Getter method for attachment fee loading state.
   * @returns Observable with loading state.
   */
  get isLoadingAttachmentFee$(): Observable<boolean> {
    return this.isLoadingAttachmentFeeSubject.asObservable();
  }

  /**
   * @description Setter method for setting attachment fee loading state.
   */
  set isLoadingAttachmentFee(isLoading: boolean) {
    this.isLoadingAttachmentFeeSubject.next(isLoading);
  }

  /**
   * @description Fetches wallet shipping types from API.
   * Only called when isWalletCheckMail is true.
   */
  loadShippingTypes(): void {
    if (!this.isWalletCheckMail()) return;

    this.sharedService.getWalletShippingTypes()
      .pipe(take(1))
      .subscribe((response) => {
        const shippingTypes = response.data.map((item: IShippingTypes) => ({
          ...item,
          cost: parseFloat(item.cost).toFixed(2)
        }));
        this.shippingTypesSubject.next(shippingTypes);
      });
  }

  /**
   * @description Processes multiple wallet payments using the multi-process API.
   * @param payload - Payload containing payment_ids and individual payment data.
   * @param headerOption - Http header options.
   * @returns Observable with success or failure response.
   */
  processWalletPaymentsMulti(
    payload: {
      payment_ids: string[];
      [key: string]: string[] | { mail_type: string; file_hidden: string[] };
    },
    headerOption?: HttpHeaders
  ): Observable<IApiRes<unknown>> {
    return this.http.post<IApiRes<unknown>>(
      `${this.ROOT_URL}/imports/wallet-checks/multi-process`,
      payload,
      { headers: headerOption }
    );
  }

  processCheckMailPreviewPrint(payload: {
    checkIds: string[];
  }){
    return this.http.post<IApiRes<{ url: string }>>(
      `${this.ROOT_URL}/checks/preview-file-print`,
      payload
    );
  }

  ngOnDestroy(): void {
    this.subscription.forEach((subscription) => {
      subscription?.unsubscribe();
    });
  }
}
