import {
  IDefaultPayload,
  ISelectBoxFilterArray,
  ISelectBoxFilterValues
} from '../../../models/v3-datatable';
import {
  ICommentsAndAttachmentsCount,
  IDtFilteredCols
} from 'src/app/models/v3-common';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { ICoulmnDefFieldsResponse } from 'src/app/models/v3-datatable';
import { environment } from 'src/environments/environment';
import { GridApi, RowNode } from '@ag-grid-community/core';
import { IApiRes, IApiResWithMsg } from 'src/app/models/api';
import { DataTableCacheService } from '../../../shared/service/indexedDb/data-table-cache.service';
import { IPayeeDropdown } from '../../payee/payee-v2/model/payee';
import { DateRange } from '@angular/material/datepicker';

@Injectable({
  providedIn: 'root'
})
export class V3DataTableService {
  /* Injectors */
  private http = inject(HttpClient);
  private cacheService = inject(DataTableCacheService);

  /* Variables */
  ROOT_URL = environment.rootUrl;

  private updateV3DataTableSubject = new Subject<ISelectBoxFilterArray>();
  private updateV3DataTableByRemovingFilterSubject = new Subject<string[]>();
  private v3RowSelectionSubject = new Subject<RowNode<any>[]>();
  private hasV3DataTableLoadedSubject = new Subject<boolean>();
  public refreshV3DataTableSubject$ = new Subject<boolean>();
  private defaultPayloadUpdatedSubject$ = new Subject<boolean>();
  private commentsAndAttachmentsLoadedSubject$ = new Subject<boolean>();
  private clickEyeButton = new Subject<boolean>();
  private changePaymentTableTab = new Subject<boolean>();
  public postData$ = new Subject<{ [key: string]: string }>();
  public routingNumber = new BehaviorSubject<{ [key: string]: string }>({});
  /** Emitted when a nav link for a table that's already active is re-clicked, so the table can reset to its default unfiltered view. */
  public resetToDefaultView$ = new Subject<void>();

  rowData: any[];
  emptyRowData = new Subject<number>();

  defaultPayload: IDefaultPayload;
  gridApi: GridApi;
  initialSelectBoxFilter: ISelectBoxFilterValues | undefined;

  selectedDateRange: DateRange<Date> | undefined;
  dateRangeName: string | undefined;
  selectedCheckStatus: string | undefined;
  filteredSourceType: ISelectBoxFilterArray | undefined;
  filteredTransferType: ISelectBoxFilterArray | undefined;
  filteredStatusType: ISelectBoxFilterArray | undefined;
  filteredCheckType: ISelectBoxFilterArray | undefined;
  dataTablePayload: IDefaultPayload | undefined;
  selectedPayee: IPayeeDropdown | undefined;
  isClickEyeButton = false;
  filteredAmount: ISelectBoxFilterArray | undefined;
  filteredDescription: ISelectBoxFilterArray | undefined;
  filteredCreatedAt: ISelectBoxFilterArray | undefined;
  filteredReference: ISelectBoxFilterArray | undefined;
  CurrentPage: number;

  /** Skip the cached paint on the next load and show only server data. */
  hardRefresh = signal(false);

  /* Functions */

  /**
   * @description This function when called
   * resets the payload we are passing to the
   * `getTableListData()` API.
   */
  resetV3DataTablePayload() {
    this.defaultPayload = {
      startRow: 0,
      endRow: 50,
      rowGroupCols: [],
      valueCols: [],
      pivotCols: [],
      pivotMode: false,
      groupKeys: [],
      filterModel: {},
      sortModel: []
    };
  }

  /**
   * @description Drops the cached response for a single table, so its next
   * load refetches from the server. Call this from the place that mutated the
   * data, naming the table the mutation affects.
   */
  invalidateTableCache(tableId: number) {
    this.cacheService.deleteV3Data(tableId);
  }

  async v3DataTableCacheCheck(
    tableId: number,
    requestPayload: IDefaultPayload
  ) {
    const cachedResponse = await this.cacheService.getDataById(tableId);
    return cachedResponse;
  }

  setPostdata(postData: { [key: string]: string }) {
    this.postData$.next(postData);
  }

  setRoutingNumber(routingNumber: { [key: string]: string }) {
    this.routingNumber.next(routingNumber);
  }

  /**
   * The main function we are using to
   * refresh the V3 Data Table.
   */
  refreshV3DataTable() {
    this.hardRefresh.set(true);
    this.refreshV3DataTableSubject$.next(true);
  }

  /**
   * @description This is the main AG Grid
   * API where we get the row data from
   * the backend.
   *
   * @param tableId This parameter is what we pass to get the table data.
   * @param postData These are some additional parameters that we pass when calling the
   * AG Grid API.
   * @returns It returns the row data for the data tables
   */
  getTableListData<IDynamicResponseType>(
    tableId: number,
    postData?: unknown
  ): Observable<ICoulmnDefFieldsResponse<IDynamicResponseType>> {
    return this.http.post<ICoulmnDefFieldsResponse<IDynamicResponseType>>(
      `${this.ROOT_URL}/ag-grid/${tableId}`,
      postData
    );
  }

  getTableColumnData(tableId: number): Observable<IApiRes<IDtFilteredCols>> {
    return this.http.get<IApiRes<IDtFilteredCols>>(
      `${this.ROOT_URL}/data-table/${tableId}`
    );
  }

  postcolumnVisible(
    tableId: number,
    visibility: { visibility: string[] }
  ): Observable<any> {
    return this.http.put(
      `${this.ROOT_URL}/data-table/${tableId}/visibility`,
      visibility
    );
  }

  /**
   * API function for filter and export from payments data table in v3.
   * @param body - Payload for the API.
   */
  filterAndExport(body: Record<string, string>) {
    return this.http.post<IApiRes<{ url: string, message: string }>>(
      `${this.ROOT_URL}/zil-payments/export`,
      body
    );
  }

  /**
   * @description Method to get comments and attachments count for the ids of the given table type.
   * @param dataTable - Data table name.
   * @param ids - Ids of required items.
   * @returns Observable with comments and attachments data.
   */
  getCommentsAndAttachments(
    dataTable: string,
    ids: { ids: string[] }
  ): Observable<IApiRes<ICommentsAndAttachmentsCount[]>> {
    return this.http.post<IApiRes<ICommentsAndAttachmentsCount[]>>(
      `${this.ROOT_URL}/${dataTable}/transactions/get-count`,
      ids
    );
  }

  /**
   * API function for exporting receive payments tabel
   */
  exportTable(
    body: {
      type: string;
      fromDate: string | Date;
      toDate: string | Date;
      items: string[];
    },
    table: string
  ) {
    return this.http.post<IApiResWithMsg<{ url: string; message: string }>>(
      `${this.ROOT_URL}/${table}/export`,
      body
    );
  }

  /**
   * @description Setter of Adding Filters to the payload
   * and works as a refresh table if the data is passed
   * as undefined.
   */
  set updateV3DataTable(data: ISelectBoxFilterArray) {
    this.updateV3DataTableSubject.next(data);
  }

  /**
   * @description Getter of Adding Filters to the payload
   * and works as a refresh table if the data is passed
   * as undefined.
   */
  get updateV3DataTable$(): Observable<ISelectBoxFilterArray> {
    return this.updateV3DataTableSubject.asObservable();
  }

  /**
   * @description Setter of Removing Filters from the payload
   */
  set updateV3DataTableByRemovingFilter(data: string[]) {
    this.updateV3DataTableByRemovingFilterSubject.next(data);
  }

  /**
   * @description Getter of Removing Filters from the payload
   */
  get updateV3DataTableByRemovingFilter$(): Observable<string[]> {
    return this.updateV3DataTableByRemovingFilterSubject.asObservable();
  }

  /**
   * @description Setter of Sending Row Selection Data
   */
  set v3RowSelectionData(data: RowNode<any>[]) {
    this.v3RowSelectionSubject.next(data);
  }

  /**
   * @description Getter of Receiving Row Selection Data
   */
  get v3RowSelectionData$(): Observable<RowNode<any>[]> {
    return this.v3RowSelectionSubject.asObservable();
  }

  /**
   * @description Setter of Checking if V3 Data API Table Has Loaded
   */
  set hasV3DataTableLoaded(data: boolean) {
    this.hasV3DataTableLoadedSubject.next(data);
  }

  /**
   * @description Getter of Checking if V3 Data API Table Has Loaded
   */
  get hasV3DataTableLoaded$(): Observable<boolean> {
    return this.hasV3DataTableLoadedSubject.asObservable();
  }

  /**
   * @description Setter method for default payload changes.
   */
  set defaultPayloadUpdated(status: boolean) {
    this.defaultPayloadUpdatedSubject$.next(status);
  }

  /**
   * @description Getter method for default payload changes.
   */
  get defaultPayloadUpdated$(): Observable<boolean> {
    return this.defaultPayloadUpdatedSubject$.asObservable();
  }

  /**
   * @description Setter of Sending True After Get
   * Count API is Completed
   */
  set commentsAndAttachmentsLoaded(data: boolean) {
    this.commentsAndAttachmentsLoadedSubject$.next(data);
  }

  /**
   * @description Getter of Sending True After Get
   * Count API is Completed
   */
  get commentsAndAttachmentsLoaded$(): Observable<boolean> {
    return this.commentsAndAttachmentsLoadedSubject$.asObservable();
  }

  /**
   * @description We are generating a colour code based on the
   * name of the user so that the colour is not random and it has some
   * logic attached to it so that each name can be associated with a colour.
   *
   * @param keyAlphabet This is the main parameter we pass into the function. This
   * is the first letter of the first name of the user.
   */
  static generateNameBasedColorCode(keyAlphabet: string): string {
    const alphabetCharacterCode = keyAlphabet?.charCodeAt(0);
    const constants = [345, 112, 965];

    const rgb = [];

    for (let i = 0; i < 3; i++) {
      let currentSpectrum = alphabetCharacterCode * constants[i];
      if (currentSpectrum > 255) {
        const threeDigitNumberLimiter = parseInt(
          currentSpectrum.toString().slice(0, 3)
        );
        const threeDigitNumberLimiterDivider = parseInt(
          threeDigitNumberLimiter.toString().slice(0, 1)
        );
        currentSpectrum =
          threeDigitNumberLimiter - (threeDigitNumberLimiterDivider - 1) * 100;
      }
      rgb.push(currentSpectrum);
    }

    return `rgb(${rgb.join(', ')})`;
  }

  /**
   * @description Setter method for the eye button click in payments table.
   * @param {boolean} data - The data to be set for the eye button.
   */
  set v3EyeButton(data: boolean) {
    this.clickEyeButton.next(data);
  }
  /**
   * @description Getter method to check the click event of the eye button in payments table.
   * @returns {Observable<boolean>} An observable emitting boolean values.
   */
  get v3EyeButton$(): Observable<boolean> {
    return this.clickEyeButton.asObservable();
  }

  /**
   * @description Setter method for the change table type in payments table.
   *  @param {boolean} data - The data to be set for the tab switch.
   */
  set switchPaymentTableTab(data: boolean) {
    this.changePaymentTableTab.next(data);
  }
  /**
   * @description Getter method to check the any changes in tab in payments table.
   * @returns {Observable<boolean>} An observable emitting boolean values.
   */
  get switchPaymentTableTab$(): Observable<boolean> {
    return this.changePaymentTableTab.asObservable();
  }

  /**
   * @description reset the stored filter values when filter value change to `All`.
   * This function created for payments table.
   * @param {string} value - The value indicating the filter type.
   */
  removeFilters(value: string): void {
    this.gridApi.deselectAll();
    switch (value) {
      case 'source_type':
        if (this.filteredSourceType) {
          this.filteredSourceType = undefined;
        }
        break;
      case 'transfer_mode':
        if (this.filteredTransferType) {
          this.filteredTransferType = undefined;
        }
        break;
      case 'status':
        if (this.filteredStatusType) {
          this.filteredStatusType = undefined;
        }
        break;
      case 'transfer_type':
        if (this.filteredCheckType) {
          this.filteredCheckType = undefined;
        }
        break;
      default:
        break;
    }
  }

  /**
   * @description reset the stored search box filter values when clear the filters.
   * @param {string} value - The value indicating the filter type.
   */
  removeSearchBoxFilters(value: string): void {
    switch (value) {
      case 'amount':
        if (this.filteredAmount) {
          this.filteredAmount = undefined;
        }
        break;
      case 'description':
        if (this.filteredDescription) {
          this.filteredDescription = undefined;
        }
        break;
      case 'created_by.name':
        if (this.filteredCreatedAt) {
          this.filteredCreatedAt = undefined;
        }
        break;
      case 'reference_no':
        if (this.filteredReference) {
          this.filteredReference = undefined;
        }
        break;
      default:
        break;
    }
  }

  /**
   * @description Updates the payload data based on the filtered source, transfer, status, and check types.
   * Merges the filtered types into the default payload's filterModel.
   *
   * This function created for payments table.
   * @param removeFilter - filter to be removed.
   */
  updatePayloadData(removeFilter?: string[]) {
    if (removeFilter) {
      for (let i = 0; i < removeFilter.length; i += 1) {
        delete this.defaultPayload.filterModel[removeFilter[i]];
      }
      if (this.filteredSourceType) {
        this.defaultPayload.filterModel = {
          ...this.defaultPayload.filterModel,
          ...this.filteredSourceType
        };
      }
      if (this.filteredTransferType) {
        this.defaultPayload.filterModel = {
          ...this.defaultPayload.filterModel,
          ...this.filteredTransferType
        };
      }
      if (this.filteredStatusType) {
        this.defaultPayload.filterModel = {
          ...this.defaultPayload.filterModel,
          ...this.filteredStatusType
        };
      }
      if (this.filteredCheckType) {
        this.defaultPayload.filterModel = {
          ...this.defaultPayload.filterModel,
          ...this.filteredCheckType
        };
      }
      if (this.filteredAmount) {
        this.defaultPayload.filterModel = {
          ...this.defaultPayload.filterModel,
          ...this.filteredAmount
        };
      }
      if (this.filteredReference) {
        this.defaultPayload.filterModel = {
          ...this.defaultPayload.filterModel,
          ...this.filteredReference
        };
      }
    }
    this.gridApi.deselectAll();
  }

  /**
   * @description Clears stored data and resets various properties to their initial state.
   * Store the value in below global variables in the case of payments table.
   */
  clearStoredData() {
    this.selectedDateRange = undefined;
    this.dateRangeName = undefined;
    this.selectedCheckStatus = undefined;
    this.filteredSourceType = undefined;
    this.filteredTransferType = undefined;
    this.filteredStatusType = undefined;
    this.filteredCheckType = undefined;
    this.dataTablePayload = undefined;
    this.selectedPayee = undefined;
    this.isClickEyeButton = false;
    this.filteredAmount = undefined;
    this.filteredDescription = undefined;
    this.filteredCreatedAt = undefined;
    this.filteredReference = undefined;
    if (this.defaultPayload) {
      this.defaultPayload.filterModel = {};
    }
  }
}
