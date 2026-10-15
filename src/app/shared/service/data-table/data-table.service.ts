import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { GridApi } from '@ag-grid-community/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  IDtActionCompProp,
  IDtAttachComntArray,
  IDtCellrendererBtn,
  IDtColumnFields,
  IDtFloatingFilterProp,
  IDtStatusArray,
  ISelectedSingleRow
} from 'src/app/modules/data-table/model/datatable';
import { IApiRes, IApiResWithMsg } from 'src/app/models/api';
import {
  IDataTableCheck,
  IExportFilterDataAch,
  IExportFilterDataWallet
} from 'src/app/modules/data-table/model/datatable-component';
import { DateRange } from '@angular/material/datepicker';
import { IDefaultPayload, IRequestPayload } from 'src/app/models/v3-datatable';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';

interface isDisableInterface {
  isDisable: boolean;
  selectedIds: string[];
}

export interface IDtSelectSingleIdSubject {
  selectedRow: Record<string, unknown>;
  id?: string;
  tableId?: number;
}


export interface ICellValue {
  filter: string;
  field: string;
  payee?: IPayeeDropdown;
  isDate?: boolean;
  isBank?: boolean;
  subFilter?: { name: string; value: string; source_id?: string };
}

@Injectable({
  providedIn: 'root'
})
export class DataTableService {
  ROOT_URL = environment.rootUrl;

  private http = inject(HttpClient);

  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  columnFields!: IDtColumnFields[];
  cellRenderer: IDtCellrendererBtn['action'];
  selectedRows = new BehaviorSubject<{
    selectedRows: unknown[] | undefined;
    tableId: number | undefined;
  } | null>(null);

  headerButtonClassList$ = new BehaviorSubject<{
    ids: string[];
    cssClass: string[];
    action: string;
  }>({ ids: [], cssClass: [], action: '' });

  action: IDtActionCompProp | undefined;
  mainFilter = new BehaviorSubject<
    { data: string | number; fieldId: string | undefined } | any
  >({ data: '' });

  attachmenCommentStatus = new BehaviorSubject<
    IDtAttachComntArray[] | undefined
  >(undefined);

  isDisable = new BehaviorSubject<isDisableInterface>({
    isDisable: false,
    selectedIds: []
  });

  loadingActionRow = new BehaviorSubject<string | null>(null);

  refresher = new BehaviorSubject<{
    status: boolean;
    tableId: number | undefined;
  }>({ status: false, tableId: undefined });

  selectedBoxValues!: IDtFloatingFilterProp['selectBox'] | undefined;
  dateRangeValues: IDtFloatingFilterProp['selectDate'] | undefined;

  selectedsingleId = new BehaviorSubject<ISelectedSingleRow>({});
  selectedViewSingleId$ = new BehaviorSubject<ISelectedSingleRow>({});
  selectedDangerSingleId$ = new BehaviorSubject<ISelectedSingleRow>({});
  paginationChange$ = new BehaviorSubject<boolean>(false);

  selectAllCheckbox = new BehaviorSubject<boolean | null>(null);
  selectAllCheckbox$ = this.selectAllCheckbox.asObservable();

  private gridApi: GridApi;
  private actionStore: { tableId: IDtActionCompProp | undefined } = {
    tableId: undefined
  };

  private actionListStore: {
    tableId: IDtCellrendererBtn['action'] | undefined;
  } = { tableId: undefined };

  private floatingFilterData: { tableId: IDtFloatingFilterProp | undefined } = {
    tableId: undefined
  };

  deselectAll$ = new Subject();
  paginationSizeController = new BehaviorSubject<number>(50);
  dataTablePayload: IDefaultPayload | IRequestPayload | undefined;
  isEyeButtonClicked = false;
  selectedDateRangeCheque: DateRange<Date> | undefined;
  dateRangeNameCheque: string | undefined;
  selectedDateRangeChequeCreated: DateRange<Date> | undefined;
  dateRangeNameChequeCreated: string | undefined;
  destroyPayload = true;
  selectedCellValueSignal = signal<ICellValue | undefined>(undefined);

  get gridOptionApi() {
    return this.gridApi;
  }

  set gridOptionApi(e: GridApi) {
    this.gridApi = e;
  }

  setDataFromParent(
    columnFields?: IDtColumnFields[] | undefined,
    floatingFilterComponent?: IDtFloatingFilterProp | undefined,
    cellRenderer?: IDtCellrendererBtn | undefined,
    actionComponentProp?: IDtActionCompProp | undefined,
    tableId?: number
  ): void {
    if (floatingFilterComponent) {
      this.selectedBoxValues = floatingFilterComponent?.selectBox; //select box
      this.dateRangeValues = floatingFilterComponent?.selectDate; //daterange
      if (tableId) {
        this.floatingFilterData.tableId = floatingFilterComponent;
      }
    }
    if (columnFields) {
      this.columnFields = columnFields;
    }
    if (cellRenderer) {
      this.cellRenderer = cellRenderer?.action;
      if (tableId) {
        this.actionListStore.tableId = cellRenderer?.action;
      }
    }
    if (tableId && actionComponentProp?.tableId) {
      actionComponentProp.tableId = tableId;
      this.actionStore.tableId = actionComponentProp;
    }
    this.action = actionComponentProp;
  }

  setCellRendererAction(action: IDtCellrendererBtn['action']) {
    //  THIS IS FOR ACTION VALUE CHANGE
    this.cellRenderer = action;
  }

  getActionMode(tableId?: number) {
    if (tableId && this.actionStore.tableId) {
      return this.actionStore.tableId;
    }
    return this.action; //this contains both eye button and action buttons actions.
  }

  setDataFromFrameWorkComponent(
    selectedRows?: unknown[],
    tableId?: number
  ): void {
    this.selectedRows.next({ selectedRows, tableId });
  }

  setHeaderButtonClassList(data: {
    ids: string[];
    cssClass: string[];
    action: string;
  }): void {
    this.headerButtonClassList$.next({
      ids: data.ids,
      cssClass: data.cssClass,
      action: data.action
    });
  }

  setActionButtonDisable(istrue: boolean, selectedId: string[]): void {
    this.isDisable.next({ isDisable: istrue, selectedIds: selectedId });
  }

  // ACTION BUTTON
  setDataFromActionComp(
    rowDetails: { [key: string]: unknown },
    btnId?: string,
    tableId?: number
  ): void {
    this.selectedsingleId.next({ selectedRow: rowDetails, id: btnId, tableId });
    this.selectedsingleId.next({});
  }

  // ACTION VIEW BUTTON
  setDataFromActionViewComp(
    rowDetails: { [key: string]: unknown },
    btnId: string | undefined,
    tableId?: number
  ): void {
    this.selectedViewSingleId$.next({
      selectedRow: rowDetails,
      id: btnId,
      tableId
    });
    this.selectedViewSingleId$.next({});
  }

  // ACTION DANGER BUTTON
  setDataFromActionDangerComp(
    rowDetails: { [key: string]: unknown },
    btnId: string | undefined,
    tableId?: number
  ): void {
    this.selectedDangerSingleId$.next({
      selectedRow: rowDetails,
      id: btnId,
      tableId
    });
    this.selectedDangerSingleId$.next({});
  }

  // GET SELECT BOX VALUES
  getSelectBoxData(): {
    data: IDtColumnFields[];
    values: IDtFloatingFilterProp['selectBox'];
  } {
    return {
      data: this.columnFields,
      values: this.selectedBoxValues
    };
  }

  //GET ACTION CELL RENDERER VALUES
  getCellrendrerData(tableId?: number) {
    return {
      data: this.columnFields,
      values: tableId ? this.actionListStore.tableId : this.cellRenderer
    };
  }

  //DATA TABLE REFRESHER
  setRefreshStatus(status: boolean, tableId?: number) {
    this.refresher.next({ status, tableId });
  }

  getRefreshStatus(): Observable<{
    status: boolean;
    tableId: number | undefined;
  }> {
    return this.refresher;
  }

  getDateFieldId(): IDtFloatingFilterProp['selectDate'] | undefined {
    return this.dateRangeValues;
  }

  //set main filter
  setMainFilter(data: string | number, fieldId?:string): void {
    this.mainFilter.next({ data, fieldId });
    // this.mainFilter.next('null');
  }

  //get main filter
  getMainFilter() {
    return this.mainFilter;
  }

  clearMainFilter() {
    this.mainFilter.next(null);
  }

  // SET ATTACHMENT AND COMMENT STATUS
  setAttachmentCommentStatus(data: IDtAttachComntArray[]) {
    this.attachmenCommentStatus.next(data);
  }

  // GET ATTACHMENT AND COMMENT STATUS
  getAttachmentCommentStatus() {
    return this.attachmenCommentStatus;
  }

  // ATTACHMENT AND COMMENTS STATUS ARRAY FOR EACH DATA TABLE
  _statusArray: IDtStatusArray[] = [
    {
      dataTableId: 3,
      field: 'encrypted_id',
      dataTableName: 'request-payments'
    }, // <-- request payment
    { dataTableId: 2, field: 'action', dataTableName: 'bills' }, // <-- bills
    { dataTableId: 1, field: 'action', dataTableName: 'checks' }, // <-- check
    { dataTableId: 16, field: 'action', dataTableName: 'cheque-drafts' }, // <-- check-draft
    { dataTableId: 29, field: 'action', dataTableName: 'cash-expenses' }, // <-- cash expenses
    { dataTableId: 4, field: 'action', dataTableName: 'invoices' }, // <-- expenses
    { dataTableId: 12, field: 'action', dataTableName: 'vendor-credits' }, // <-- vendor credit
    { dataTableId: 11, field: 'action', dataTableName: 'credit-memos' },
    { dataTableId: 18, field: 'action', dataTableName: 'deposit-slips' }, // <--deposit slip
    { dataTableId: 76, field: 'id', dataTableName: 'integrations/merge' }
  ];

  // GET  SATATUS ARRAY
  getA$Cstatus(tableId: number) {
    return this._statusArray.filter((val) => {
      return val.dataTableId == tableId;
    });
  }

  setSelectAllCheckboxValue(value: boolean) {
    this.selectAllCheckbox.next(value);
  }

  /* ---------------------------------------------API Call-------------------------------------------------------*/
  getTableColumnData(tableId: number): Observable<any> {
    return this.http.get<any>(`${this.ROOT_URL}/data-table/${tableId}`);
  }

  postcolumnOrder(tableId: number, order: any): Observable<any> {
    return this.http.put<any>(
      `${this.ROOT_URL}/data-table/${tableId}/order`,
      order
    );
  }

  postcolumnSize(tableId: number, size: any): Observable<any> {
    return this.http.put<any>(
      `${this.ROOT_URL}/data-table/${tableId}/size`,
      size
    );
  }

  postcolumnVisible(tableId: number, visibility: any): Observable<any> {
    return this.http.put<any>(
      `${this.ROOT_URL}/data-table/${tableId}/visibility`,
      visibility
    );
  }

  getAddAttachmentAddComment(dataTable: string, Ids: any): Observable<any> {
    return this.http.post<any>(`${this.ROOT_URL}/${dataTable}/get-count`, Ids);
  }

  filterAndExportAll(
    data: IDataTableCheck
  ): Observable<{ data: { url: string } }> {
    return this.http.post<{ data: { url: string } }>(
      `${this.ROOT_URL}/checks/csv-export`,
      data
    );
  }

  filterAndExportWallet(
    data: IExportFilterDataWallet
  ): Observable<IApiRes<string>> {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/wallets/export`,
      data
    );
  }

  filterAndExportPdf(
    data: IDataTableCheck
  ): Observable<{ success: boolean; url: string; message?: string }> {
    return this.http.post<{ success: boolean; url: string; message?: string }>(
      `${this.ROOT_URL}/checks/pdf-export`,
      data
    );
  }

  sendFilteredMailForChecks(data: {
    message: string;
  }): Observable<IApiRes<string>> {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/checks/email-export`,
      data
    );
  }

  payeeFilterAndExportAll(data: {
    type: string;
    items: string[];
  }): Observable<IApiResWithMsg<{ url: string }>> {
    return this.http.post<IApiResWithMsg<{ url: string }>>(
      `${this.ROOT_URL}/payees/payee-export`,
      data
    );
  }

  getTableListData(postData: any, tableId: number): Observable<any> {
    return this.http.post(
      `${this.ROOT_URL}/ag-grid/${tableId}`,
      postData,
      this.httpOptions
    );
  }

  sendEmail(emailBody: FormData): Observable<IApiRes<boolean>> {
    return this.http.post<IApiRes<boolean>>(`${this.ROOT_URL}/ag-grid/export-email`, emailBody);
  }

  filterAndExportAchTransfer(
    body: IExportFilterDataAch,
    achType: string
  ): Observable<IApiRes<string>> {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/wallets/${achType}/export`,
      body
    );
  }
}
