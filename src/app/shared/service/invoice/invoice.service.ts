import { DatePipe } from '@angular/common';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import {
  DestroyRef,
  Injectable,
  OnDestroy,
  computed,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, Subscription, finalize, of } from 'rxjs';
import {
  catchError,
  debounceTime,
  map,
  startWith,
  switchMap,
  tap
} from 'rxjs/operators';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { IApiRes, IApiResMesssage, IApiResWithMsg } from 'src/app/models/api';
import { ICheckMailTrackDetails } from 'src/app/modules/check/model/check';
import {
  AddCreditmemoInterface,
  AddinvoiceItem,
  AddinvoiceTaxInterface,
  AddPaymentInterface,
  IAddinterfaceRes,
  IAddTaxRes,
  IAttachmentsList,
  IAuditList,
  IAuditTrailList,
  ICommentList,
  ICreditMemoDetail,
  ICreditViewData,
  IEmailSmsItems,
  IgetCreditBalance,
  IgetInvoiceNo,
  IgetSingleTaxData,
  IInvoiceData,
  IInvoiceDropdown,
  IInvoiceMailTrack,
  IInvoiceRule,
  IInvoiceSummary,
  IMailData,
  INewInvoice,
  IOpenAttachmentsRes,
  IPrintData,
  ItaxList
} from 'src/app/modules/invoices/model/invoice';
import { environment } from 'src/environments/environment';
import { IRevenueTimelineData } from 'src/app/shared/V4/revenue-chart-line-graph-v4/revenue-chart-line-graph-v4.component';
import { IVendorData } from 'src/app/shared/V4/vendor-status-chart-v4/vendor-status-chart-v4.component';
import { getMailTrackUrl } from 'src/app/shared/utils/v4-external.util';
import { CheckService } from '../check/check.service';
import { LocalStorageService } from '../storage/local-storage.service';

export interface IInvoiceOverviewStats {
  unpaidThisMonth: { count: number; amount: string };
  paidThisMonth: { count: number; amount: string };
  overdueThisMonth: { count: number; amount: string };
  totalThisMonth: { count: number; amount: string };
  averageCollection: number;
}

export interface IRiskIndicatorItem {
  count: number;
  amount: number;
}
export interface IInvoiceRiskIndicators {
  overdue: IRiskIndicatorItem;
  dueThisWeek: IRiskIndicatorItem;
  upcoming: IRiskIndicatorItem;
  duplicates: IRiskIndicatorItem;
  highValue: IRiskIndicatorItem;
}

interface IRawTimelineItem {
  month: string;
  paid_amount: string;
  pending_amount: string;
}
interface IRawClientItem {
  client_name: string;
  paid?: { amount?: string };
  overdue?: { amount?: string };
  unpaid?: { amount?: string };
  partial?: { amount?: string };
  total_amount: string;
}
interface IRawRiskItem {
  count?: number;
  total_amount?: string;
}
interface IRawRiskIndicatorsData {
  overdue?: IRawRiskItem;
  due_this_week?: IRawRiskItem;
  upcoming_30_days?: IRawRiskItem;
  duplicates?: IRawRiskItem;
  high_value?: IRawRiskItem;
}

@Injectable({
  providedIn: 'root'
})
export class InvoiceService implements OnDestroy {
  private checkService = inject(CheckService);
  private localStorageService = inject(LocalStorageService);
  private http = inject(HttpClient);
  private v3DataTableService = inject(V3DataTableService);
  private datePipe = inject(DatePipe);

  private static readonly INVOICE_DATE_FIELD = 'ocw_invoices.invoice_date';

  private readonly invoiceSummarySignal = signal<IInvoiceSummary | null>(null);
  private readonly invoiceSummaryLoadingSignal = signal(false);
  private readonly invoiceSummaryErrorSignal = signal(false);

  readonly invoiceSummary = this.invoiceSummarySignal.asReadonly();
  readonly invoiceSummaryLoading = this.invoiceSummaryLoadingSignal.asReadonly();
  readonly invoiceSummaryError = this.invoiceSummaryErrorSignal.asReadonly();

  private defaultMailTrackState = {
    mailTrackDetails: undefined,
    isLoading: false
  };

  private invoiceMailTrackSignal = signal<IInvoiceMailTrack>(
    this.defaultMailTrackState
  );

  mailTrackSignal = computed(
    () => this.invoiceMailTrackSignal()?.mailTrackDetails
  );

  mailTrackLoadingSignal = computed(
    () => this.invoiceMailTrackSignal()?.isLoading
  );

  ROOT_URL = environment.rootUrl;
  listItemScrollEvent = new Subject<boolean>();
  invoiceSubscription: Subscription[] = [];

  //* ********************** Invoice Tax section *********************//

  /**
   * @description -API function for adds the tax information to the invoice.
   * @param taxcontext -Payload for the API
   * @returns
   */
  addtax(
    taxcontext: AddinvoiceTaxInterface = {
      tax_name: '',
      tax_percentage: 0,
      note: ''
    }
  ): Observable<IAddTaxRes> {
    return this.http.post<IAddTaxRes>(
      `${this.ROOT_URL}/invoice-taxes`,
      taxcontext
    );
  }

  /**
   * @description -API function for Handle scrolling to load more tax data.
   * @param page -Payload for the API
   * @param term -Payload for the API
   */
  gettax(page: number, term = ''): Observable<{ data: ItaxList[] }> {
    return this.http.get<{ data: ItaxList[] }>(
      `${this.ROOT_URL}/invoice-taxes?page=${page}&&term=${term}`
    );
  }

  /**
   * @description -API function for Updates the tax information in the invoice.
   * @param id -Payload for the API
   * @param taxcontext -Payload for the API
   */
  updateTax(
    id: string,
    taxcontext: AddinvoiceTaxInterface
  ): Observable<IApiResMesssage> {
    return this.http.put<IApiResMesssage>(
      `${this.ROOT_URL}/invoice-taxes/${id}`,
      taxcontext
    );
  }

  /**
   * @description -API function for delete tax
   * @param id -Payload for the API
   * */
  deleteTax(id: string | number): Observable<boolean | IApiResMesssage> {
    return this.http.delete<boolean | IApiResMesssage>(
      `${this.ROOT_URL}/invoice-taxes/${id}`
    );
  }

  /**
   * @description -API function for Handle the selection of a tax.
   */
  getSingleTaxData(id: string): Observable<{ data: IgetSingleTaxData }> {
    return this.http.get<{ data: IgetSingleTaxData }>(
      `${this.ROOT_URL}/invoice-taxes/${id}`
    );
  }

  //* ********************** Invoice Item section *********************//

  /**
   * @description -API function for Handle searching for invoice items based on the search term.
   * @param page -Payload for the API
   * @param term -Payload for the API
   */
  getinvoiceitem(
    page: number,
    term = ''
  ): Observable<IApiRes<IInvoiceDropdown[]>> {
    let params = new HttpParams();
    params = params.append('page', page);
    if (term !== undefined) {
      params = params.append('term', term);
    }
    return this.http.get<IApiRes<IInvoiceDropdown[]>>(
      `${this.ROOT_URL}/invoice-items`,
      { params }
    );
  }

  /**
   * @description -API function for Handle changes in the selected invoice item.
   * @param id -Payload for the API
   */
  getSingleInvoiceItem(
    id: string,
    payeeId?: string
  ): Observable<IApiRes<IInvoiceDropdown>> {
    const url = payeeId
      ? `${this.ROOT_URL}/invoice-items/${id}/${payeeId}`
      : `${this.ROOT_URL}/invoice-items/${id}`;

    return this.http.get<IApiRes<IInvoiceDropdown>>(url);
  }

  /**
   * @description -API function for adds the item to the invoice.
   * @param addinvoiceItemContext -Payload for the API
   */
  addInvoiceItem(
    addinvoiceItemContext: AddinvoiceItem
  ): Observable<IApiResWithMsg<{ Id: string }>> {
    return this.http.post<IApiResWithMsg<{ Id: string }>>(
      `${this.ROOT_URL}/invoice-items`,
      addinvoiceItemContext
    );
  }

  updateInvoiceItem(
    id: string,
    addinvoiceItemContext: AddinvoiceItem
  ): Observable<IApiResMesssage> {
    return this.http.put<IApiResMesssage>(
      `${this.ROOT_URL}/invoice-items/${id}`,
      addinvoiceItemContext
    );
  }

  /**
   * @description -API function for delete Invoice item
   * @param id -Payload for the API
   * @returns
   */
  deleteinvoiceitem(id: string): Observable<IApiResMesssage> {
    return this.http.delete<IApiResMesssage>(
      `${this.ROOT_URL}/invoice-items/${id}`
    );
  }

  //* ********************** Credit Memo section *********************//

  /**
   * @description -API payload for Handles add credit memo Invoice submit
   * @param creditmemocontext -Payload for the API
   * @returns
   */
  addCreditmemo(
    creditmemocontext: AddCreditmemoInterface
  ): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/credit-memos`,
      creditmemocontext
    );
  }

  /**
   * @description -API function for edit Credit Memo
   * @param id -Id of deleting credit memo
   * @returns
   */
  deleteSingleCreditmemo(id: string): Observable<IApiResMesssage> {
    return this.http.delete<IApiResMesssage>(
      `${this.ROOT_URL}/credit-memos/${id}`
    );
  }

  /**
   * @description -API function for void Credit Memo
   * @param id -Id of voiding credit memo
   * @returns
   */
  voidSingleCreditMemo(id: string): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/credit-memos/${id}/void`,
      {}
    );
  }

  /**
   * @description -API function for unVoid Credit Memo
   * @param id -Id of unVoiding credit memo
   * @returns
   */
  unvoidSingleCreditMemo(id: string): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/credit-memos/${id}/unvoid`,
      {}
    );
  }

  markAsCompletedsingle(id: string): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/credit-memos/${id}/mark-as-complete`,
      {}
    );
  }

  /**
   * @description -API function for Delete multiple selected credit memos
   * @param data -Payload for the API
   */
  multiDelete(data: { ids: string[] }): Observable<IApiResMesssage> {
    return this.http.delete<IApiResMesssage>(
      `${this.ROOT_URL}/credit-memos/multidelete`,
      {
        body: data
      }
    );
  }

  /**
   * @description -API function for Voids multiple selected credit memos.
   * @param data -Payload for the API
   */
  multiVoid(data: { ids: string[] }): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/credit-memos/bulkvoid`,
      data
    );
  }

  /**
   * @description -API function for Edit a single credit memo.
   * @param id -Payload for the API
   */
  getSinglecreditmemo(id: string): Observable<{ data: ICreditMemoDetail }> {
    return this.http.get<{ data: ICreditMemoDetail }>(
      `${this.ROOT_URL}/credit-memos/${id}`
    );
  }

  /**
   * @description -API function for getting creditmemo status
   */
  getStatus(): Observable<{ data: string[] }> {
    return this.http.get<{ data: string[] }>(
      `${this.ROOT_URL}/status/credit-memo`
    );
  }

  /**
   * @description -API function for Retrieve the audit trail for the credit invoice.
   * @param id -Payload for the API
   * @returns
   */
  auditTrailCredit(id: string): Observable<{ data: IAuditList[] }> {
    return this.http.get<{ data: IAuditList[] }>(
      `${this.ROOT_URL}/credit-memos/${id}/activities`
    );
  }

  /**
   * @description -API function for Fetch credit data using the credit service
   * @param id -Payload for the API
   * @returns
   */
  creditView(id: string): Observable<{ data: ICreditViewData }> {
    return this.http.get<{ data: ICreditViewData }>(
      `${this.ROOT_URL}/credit-memos/${id}/view`
    );
  }

  /**
   * @description -API function for Handle updating of Creditmemo.
   * @param id -Payload for the API
   * @param creditmemocontext -Payload for the API
   */
  updateCreditmemo(
    id: string,
    creditmemocontext: AddCreditmemoInterface
  ): Observable<IApiResMesssage> {
    return this.http.put<IApiResMesssage>(
      `${this.ROOT_URL}/credit-memos/${id}`,
      creditmemocontext
    );
  }

  /**
   * @description -API function for Retrieve the credit balance for the selected bank and payee.
   * @param data -Payload for the API
   * @returns
   */
  getCreditBalance(data: {
    payeeId: string;
    bankAccountId: string;
  },headers?: HttpHeaders): Observable<{ data: IgetCreditBalance }> {
    return this.http.post<{ data: IgetCreditBalance }>(
      `${this.ROOT_URL}/credit-memos/balance`,
      data,{headers}
    );
  }

  /**
   * @description -API function for Retrieve the comments associated with the credit invoice.
   * @param id -Payload for the API
   * @returns
   */
  getCreditComments(id: string): Observable<{ data: ICommentList[] }> {
    return this.http.get<{ data: ICommentList[] }>(
      `${this.ROOT_URL}/credit-memos/${id}/comments`,
      {}
    );
  }

  /**
   * @description -API function for Retrieve the attachments associated with the credit invoice
   * @param id -Payload for the API
   */
  getCreditattachments(id: string): Observable<{ data: IAttachmentsList[] }> {
    return this.http.get<{ data: IAttachmentsList[] }>(
      `${this.ROOT_URL}/credit-memos/${id}/attachments`,
      {}
    );
  }

  /**
   * @description -API function for Print a single credit memo.
   * @param id -Payload for the API
   * @returns
   */
  singleprintCredit(
    id: string
  ): Observable<{ success: boolean; data: IPrintData }> {
    return this.http.post<{ success: boolean; data: IPrintData }>(
      `${this.ROOT_URL}/credit-memos/${id}/print`,
      ''
    );
  }

  /**
   * @description -API function for Print multiple selected credit memos.
   * @param data -Payload for the API
   */
  multiprintcredit(data: {
    ids: string[];
  }): Observable<{ success: boolean; data: IPrintData }> {
    return this.http.post<{ success: boolean; data: IPrintData }>(
      `${this.ROOT_URL}/credit-memos/bulk-print`,
      data
    );
  }

  /**
   * @description -API function for Delete an applied credit memo from the invoice.
   * @param data -Payload for the API
   *  */
  deleteAppliedCredit(data: {
    paymentId: string;
    invoiceId: string;
  }): Observable<IApiResMesssage> {
    return this.http.delete<IApiResMesssage>(
      `${this.ROOT_URL}/credit-memos/delete-applied-credit`,
      { body: data }
    );
  }

  //* ********************** Invoice section *********************//

  /**
   * @description -API function for single invoice void
   * @param id -Payload for the API
   */
  DeleteSingleInvoice(id: string): Observable<IApiResMesssage> {
    return this.http.delete<IApiResMesssage>(`${this.ROOT_URL}/invoices/${id}`);
  }

  /**
   * @description -API function for void single invoice
   * @param id -Payload for the API
   */
  voidSingleInvoice(id: string): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/invoices/${id}/void`,
      {}
    );
  }

  /**
   * @description -API function for unvoid single invoice
   * @param id -Payload for the API
   */
  UnvoidSingleInvoice(id: string): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/invoices/${id}/unvoid`,
      {}
    );
  }

  /**
   * @description -API for multi delete Invoice
   * @param data -Payload for the API
   * @returns
   */
  MultiDeleteInvoice(data: { ids: string[] }): Observable<IApiResMesssage> {
    return this.http.delete<IApiResMesssage>(`${this.ROOT_URL}/invoices`, {
      body: data
    });
  }

  /**
   * @description -API function for add the payment to the invoice,
   * @param id -Payload for the API
   * @param addpayementContext -Payload for the API
   */
  addpayement(
    id: string,
    addpayementContext: AddPaymentInterface
  ): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/invoices/${id}/payments`,
      addpayementContext
    );
  }

  /**
   * @description  -API function for Multi void Invoices
   * @param data -Payload for the API
   * @returns
   */
  multiVoidInvoice(data: { ids: string[] }): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/invoices/multi-void`,
      data
    );
  }

  /**
   * @description -API function for Retrieve the audit trail for the invoice.
   * @param id -Payload for the API
   * @returns
   */
  auditTrailInvoice(id: string): Observable<{ data: IAuditTrailList[] }> {
    return this.http.get<{ data: IAuditTrailList[] }>(
      `${this.ROOT_URL}/invoices/${id}/activities`
    );
  }

  invoiceView(id: string): Observable<{ data: IInvoiceData }> {
    return this.http.get<{ data: IInvoiceData }>(
      `${this.ROOT_URL}/invoices/${id}`
    );
  }

  /**
   * @description -API function for Add Invoice.
   * @param addinvoiceContext -Payload for the API
   * @returns
   */
  addinvoice(addinvoiceContext: INewInvoice): Observable<IAddinterfaceRes> {
    return this.http.post<IAddinterfaceRes>(
      `${this.ROOT_URL}/invoices`,
      addinvoiceContext
    );
  }

  /**
   * @description -API function for get invoice
   * @param id -Payload for the API
   * @returns
   */
  getInvoiceData(id: string): Observable<{ data: IInvoiceData }> {
    return this.http.get<{ data: IInvoiceData }>(
      `${this.ROOT_URL}/invoices/${id}`
    );
  }

  /**
   * @description API function for update invoice
   */
  updateInvoice(
    id: string,
    addinvoiceContext: INewInvoice
  ): Observable<IApiResMesssage> {
    return this.http.put<IApiResMesssage>(
      `${this.ROOT_URL}/invoices/${id}`,
      addinvoiceContext
    );
  }

  /**
   * @description -API function for Set the form data when cloning an invoice.
   * @param id -Payload for the API
   * @returns
   */
  getInvoiceNo(id: string): Observable<{ data: IgetInvoiceNo }> {
    return this.http.get<{ data: IgetInvoiceNo }>(
      `${this.ROOT_URL}/invoices/${id}/getlastinvoiceno`
    );
  }

  /**
   * @description -API function for getting mail details.
   * @param data -Payload for the API
   * @returns
   */
  getMaildetails(data: { ids: string[] }): Observable<{ data: IMailData }> {
    return this.http.post<{ data: IMailData }>(
      `${this.ROOT_URL}/invoices/mail`,
      data
    );
  }

  /**
   * @description API function for get status of invoice
   */
  getStatusInvoice(): Observable<{ data: string[] }> {
    return this.http.get<{ data: string[] }>(`${this.ROOT_URL}/status/invoice`);
  }

  /**
   * @description API function for getting invoice summary totals for a date range.
   * @param payload -Date range payload ({ start_date, end_date } in YYYY-MM-DD)
   */
  getInvoiceSummary(payload: {
    start_date: string;
    end_date: string;
  }): Observable<IApiRes<IInvoiceSummary>> {
    return this.http.post<IApiRes<IInvoiceSummary>>(
      `${this.ROOT_URL}/invoices/summary`,
      payload
    );
  }

  /**
   * Keeps the invoice summary in sync with the grid. Refetches on initial load,
   * on date-filter change, and on any CRUD refresh — all funnel through
   * refreshV3DataTableSubject$. Call once from the list component's ngOnInit;
   * the subscription is torn down with the component via destroyRef.
   */
  watchInvoiceSummary(destroyRef: DestroyRef): void {
    this.v3DataTableService.refreshV3DataTableSubject$
      .pipe(
        startWith(true),
        debounceTime(150),
        map(() => this.resolveInvoiceSummaryRange()),
        tap(() => this.invoiceSummaryLoadingSignal.set(true)),
        switchMap((range) =>
          this.getInvoiceSummary({
            start_date: range.start,
            end_date: range.end
          }).pipe(catchError(() => of(null)))
        ),
        takeUntilDestroyed(destroyRef)
      )
      .subscribe((res) => {
        this.invoiceSummaryLoadingSignal.set(false);
        if (res) {
          this.invoiceSummaryErrorSignal.set(false);
          this.invoiceSummarySignal.set(res.data);
        } else {
          this.invoiceSummaryErrorSignal.set(true);
        }
      });
  }

  private resolveInvoiceSummaryRange(): { start: string; end: string } {
    const activeFilter =
      this.v3DataTableService.defaultPayload?.filterModel?.[
        InvoiceService.INVOICE_DATE_FIELD
      ];
    if (activeFilter?.dateFrom && activeFilter?.dateTo) {
      return { start: activeFilter.dateFrom, end: activeFilter.dateTo };
    }
    return {
      start: '2000-01-01',
      end: this.datePipe.transform(new Date(), 'yyyy-MM-dd') ?? ''
    };
  }

  /**
   * @description -API function for Submits the email/SMS data.
   * @param data -Payload for the API
   * @returns
   */
  sendEmail(data: IEmailSmsItems): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/invoices/send-email`,
      data
    );
  }

  /**
   * @description -API function for Retrieve attachments associated with the invoice.
   * @param id -Payload for the API
   * */
  getAttachments(id: string): Observable<{ data: IAttachmentsList[] }> {
    return this.http.get<{ data: IAttachmentsList[] }>(
      `${this.ROOT_URL}/invoices/${id}/attachments`,
      {}
    );
  }

  /**
   * @description -API function for multi Void Invoice
   * @param id -Payload for the API
   */
  singleprint(id: string): Observable<{ success: boolean; data: IPrintData }> {
    return this.http.post<{ success: boolean; data: IPrintData }>(
      `${this.ROOT_URL}/invoices/${id}/print`,
      ''
    );
  }

  /**
   * @description -API function for multi print invoices
   * @param data -Payload for the API
   */
  multiprint(data: {
    ids: string[];
  }): Observable<{ success: boolean; data: IPrintData }> {
    return this.http.post<{ success: boolean; data: IPrintData }>(
      `${this.ROOT_URL}/invoices/bulk-print`,
      data
    );
  }

  /**
   * @description -API function for Retrieve comments for the invoice.
   * @param id -Payload for the API
   */
  getComments(id: string): Observable<{ data: ICommentList[] }> {
    return this.http.get<{ data: ICommentList[] }>(
      `${this.ROOT_URL}/invoices/${id}/comments`,
      {}
    );
  }

  /**
   * @description -API function for Open an attachment in a new window.
   * @param invoiceID -Payload for the API
   * @param attachmentId _Payload for the API
   */
  openAttachment(
    invoiceID: string,
    attachmentId: string
  ): Observable<IOpenAttachmentsRes> {
    return this.http.get<IOpenAttachmentsRes>(
      `${this.ROOT_URL}/invoices/${invoiceID}/attachments/${attachmentId}`,
      {}
    );
  }

  /**
   * @description API function for Resend Email
   * @param data -Payload for the API
   * */
  resendEmail(data: { id: string; type: number }): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/invoices/resend-email`,
      data
    );
  }

  mapBankAccountInvoice(mapData: FormData): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/thirdparty-app/map-bank-account-invoice`,
      mapData
    );
  }

  Bankchecking(
    bank_id: string,
    id: string,
    type: string,
    providerType?: string
  ): Observable<IApiResMesssage> {
    return this.http.get<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/thirdparty-app/check-bank-mapped/${bank_id}/${id}/${type}/${providerType}`
    );
  }

  mapNetSuiteAccountInvoice(data: FormData): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/merge/bank-account-mapping-invoice/netsuite`,
      data
    );
  }

  mapAccountingInvoice(data: FormData): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/merge/map-bank-account-invoice`,
      data
    );
  }

  getInvoiceMailTrack(id: string): Observable<IApiRes<ICheckMailTrackDetails>> {
    return this.http.get<IApiRes<ICheckMailTrackDetails>>(
      `${this.ROOT_URL}/invoices/tracking/${id}`
    );
  }

  setInvoiceRules(payload: IInvoiceRule) {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/invoice-rules`,
      payload
    );
  }

  editInvoiceRules(ruleId: string, payload: IInvoiceRule) {
    return this.http.put<IApiResMesssage>(
      `${this.ROOT_URL}/invoice-rules/${ruleId}`,
      payload
    );
  }

  deleteinvoiceRule(selectedIds: string[]): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/invoice-rules/multi-delete`,
      { ids: selectedIds }
    );
  }

  getSampleFile(type: 'rule' | 'customer' | 'item') {
    return this.http.get<IApiRes<{ sampleFileUrl: string }>>(
      `${this.ROOT_URL}/imports/fishbowl/invoice-${type}s/step1`
    );
  }

  importData(payload: FormData, type: 'rule' | 'customer' | 'item') {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/imports/fishbowl/invoice-${type}s/step2`,
      payload
    );
  }

  /**
   * @description Get invoice mail track details.
   * @param {string}id - Selected invoice id.
   */
  invoiceMailTrack(id: string, mode: 'list' | 'view') {
    this.invoiceMailTrackSignal.update((value) => ({
      ...value,
      isLoading: true
    }));
    this.invoiceSubscription.push(
      this.getInvoiceMailTrack(id)
        .pipe(
          finalize(() => {
            this.invoiceMailTrackSignal.update((value) => ({
              ...value,
              isLoading: false
            }));
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.invoiceMailTrackSignal.update((value) => ({
              ...value,
              mailTrackDetails: res.data
            }));
            if (mode === 'list') {
              if (res.data.trackingData.success) {
                this.checkService.openTrackingModal(res.data, 'invoice', id);
              } else if (res.data.trackingCode && this.localStorageService.getItem('isV4LayoutEnabled') === 1) {
                window.open(getMailTrackUrl(res.data.trackingCode), '_blank');
              } else if (res.data.trackingUrl) {
                window.open(res.data.trackingUrl, '_blank');
              }
            }
          }
        })
    );
  }

  getInvoiceOverviewStats(): Observable<IInvoiceOverviewStats> {
    return this.http
      .get<{
        data: IInvoiceOverviewStats;
      }>(`${this.ROOT_URL}/invoices/overview/quick-cards`)
      .pipe(map((res) => res.data));
  }

  getInvoiceRevenueTimeline(): Observable<IRevenueTimelineData[]> {
    return this.http
      .get<{
        data: { timeline?: IRawTimelineItem[] } | IRawTimelineItem[];
      }>(`${this.ROOT_URL}/invoices/overview/revenue-timeline`)
      .pipe(
        map((res) => {
          const {data} = res;
          const timeline: IRawTimelineItem[] =
            (Array.isArray(data) ? data : data.timeline) ?? [];
          return timeline.map((item) => ({
            month: item.month,
            paid: parseFloat(item.paid_amount) || 0,
            pending: parseFloat(item.pending_amount) || 0
          }));
        })
      );
  }

  getInvoiceTopClients(): Observable<IVendorData[]> {
    return this.http
      .get<{
        data: IRawClientItem[];
      }>(`${this.ROOT_URL}/invoices/overview/top-clients`)
      .pipe(
        map((res) => {
          const clients: IRawClientItem[] = res.data ?? [];
          return clients.map((c) => ({
            name: c.client_name,
            fullName: c.client_name,
            paid: parseFloat(c.paid?.amount || '0') || 0,
            overdue: parseFloat(c.overdue?.amount || '0') || 0,
            pending: parseFloat(c.unpaid?.amount || '0') || 0,
            partial: parseFloat(c.partial?.amount || '0') || 0,
            total: parseFloat(c.total_amount) || 0
          }));
        })
      );
  }

  getInvoiceRiskIndicators(): Observable<IInvoiceRiskIndicators> {
    return this.http
      .get<{
        data: IRawRiskIndicatorsData;
      }>(`${this.ROOT_URL}/invoices/overview/risk-indicators`)
      .pipe(
        map((res) => {
          const d: IRawRiskIndicatorsData = res.data ?? {};
          const parse = (
            obj: IRawRiskItem | undefined
          ): IRiskIndicatorItem => ({
            count: obj?.count ?? 0,
            amount: parseFloat(obj?.total_amount || '0') || 0
          });
          return {
            overdue: parse(d.overdue),
            dueThisWeek: parse(d.due_this_week),
            upcoming: parse(d.upcoming_30_days),
            duplicates: parse(d.duplicates),
            highValue: parse(d.high_value)
          };
        })
      );
  }

  ngOnDestroy(): void {
    this.invoiceSubscription.forEach((sub) => {
      sub.unsubscribe();
    });
    this.invoiceMailTrackSignal.set(this.defaultMailTrackState);
  }
}
