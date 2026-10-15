/* eslint-disable @typescript-eslint/no-explicit-any */
import { ColGroupDef, ColDef } from '@ag-grid-community/core';

export interface IDtHeaderElements {
  panelButtons?: {
    name: string;
    id: string;
    options?: { isItButton: boolean };
  }[];
  buttons: {
    name?: string;
    id: string;
    icon?: string;
    cssClass?: string;
    toolTip?: string;
    includes?: {
      id: string;
      name: string;
      icon: string;
      toolTip?: string;
      cssClass?: string;
    }[];
    RoundIcon?: string;
    borderCss?: string;
  }[];
  /**
   * Slug for help video button.
   * src/app/shared/components/demo-video/readme.txt
   */
  videoButton?: { slug: string }[];
}

export interface IDtFloatingFilterProp {
  selectBox?: {
    /**
     * Id of the column to show the select box.
     */
    id: string;
    /**
     * Options of the select box.
     */
    values: { value: string | number; name: string }[];
  }[];
  /**
   * Set Default date range of the date picker.
   */
  selectDate?: IDtDateFilterItem[];
}

export interface IDtDateFilterItem {
  id: string;
  initialRange?: string;
  isPrimary?: boolean;
  isCustomDateFilter?: {
    enabled: boolean;
    prop: {
      startDate: string;
      endDate: string;
    };
  };
}

export interface IDtCellrendererBtn {
  action: {
    name: string;
    id: string;
    icon: string;
    svg?: string;
    toolTip?: string;
    color?: string;
    divider?: boolean;
  }[];
}

export interface IDtStatusArray {
  dataTableId: number;
  dataTableName: string;
  field: string;
}

export interface IDtAttachComntArray {
  attachment: 0 | 1;
  comment: 0 | 1;
  id: string;
  reprint: number;
}
export interface IDtResponse {
  rowCount: number;
  rowData: { [key: string]: unknown }[];
  storeInfo: unknown;
  input?: any;
}

export interface IPayloadDataTable {
  accountId: string;
  fromDate: string | null;
  toDate: string | null;
  type: string;
  transferType: string;
  txnType: string;
}

export interface IDtColumnFields {
  /**
   * Id of the column.
   */
  id: string;
  /**
   * Display name of the column.
   */
  name: string;
  /**
   * Disable column by default.
   * @default false
   */
  isDisabled?: boolean;
  /**
   * Column definition.
   */
  colDef: any;
  isChecked: boolean;
}

export interface IDtActionCompProp {
  /** To Visible action button
   * @default false
   */
  actionButton?: boolean;
  /** To Visible view button
   * @default false
   */
  eyeButton?: boolean;
  /** To Visible delete button
   * @default false
   */
  deleteButton?: boolean;
  /** To Visible edit button
   * @default false
   */
  editButton?: boolean;
  /** ID of the current table */
  tableId?: number;
  /** Whether to know the bank is verified or not
   *  (Not a good practice , someone added )
   */
  bankNotVerified?: boolean;
  /** To Visible Map button. */
  dangerButton?: boolean;
  /** To Visible Card Button. */
  cardButton?: boolean;
  /** To Visible setting button. */
  settingsButton?: boolean;
  /** To Visible audit button. */
  auditButton?: boolean;
}
export interface IDataTableMain {
  /**
   * End point for data table.
   * refer - src\app\modules\data-table\readme.txt
   */
  tableId: number;

  /**
   * @description
   * For importing check data.
   */
  importFilteredCheckData: (type: string) => void;

  /**
   * @description
   * Manually get fetched data for custom export pdf, excel, etc
   */
  getTableData: () => { header: any[]; rowsArr: any[] };

  /**
   * @description
   * Get column definition provided parameters
   */
  // getExportParams: () => any;

  /**
   * @description
   * Mobile responsive related.
   */
  mobileAllToggle: () => void;

  /**
   * @description
   * Mobile view for action buttons.
   */
  mobileActionToggle: () => void;

  /**
   * @description
   * Emits an event with id to the parent component on clicking panel buttons.
   */
  onPanelButtonClick: (id: string | number) => void;

  /**
   * @description
   * Emits an event with id to the parent component on clicking header buttons.
   */
  onHeaderButtonClick: (id: string | number) => void;

  /**
   * @description
   * Sets column filter.
   */
  onSetColumn: () => void;

  /**
   * @description
   * Resets column size.
   */
  onResetColumn: () => void;

  /**
   * @description
   * Number of rows per page change.
   */
  onPageSizeChanged: (event: any) => void;

  /**
   * @description
   * Set start and end row based on pagination size.
   */
  setStartEndRow: () => void;

  /**
   * @description
   * Emits an event row selection change.
   */
  onRowSelectionChanged: (event: any) => void;

  /**
   * @description
   * Emits an event onRowClick.
   */
  onRowClick: (event: any) => void;

  /**
   * @description
   * Pagination previous page.
   */
  onPrevious: (event: any) => void;

  /**
   * @description
   * Pagination next page.
   */
  onNext: (event: any) => void;

  /**
   * @description
   * Emits an event when ag-grid is ready.
   */
  onGridReady: (params: any) => void;

  /**
   * @description
   * Contains statements to execute after getting data for data table.
   */
  onGetTableListDataSuccess: (
    params: any,
    requestPayload: any,
    response: any,
    scrollRemove: any,
    attachCommentCache: any
  ) => void;

  /**
   * @description
   * Check tracking url for checklist only.
   */
  getCheckTrackingUrl: (rowData: any[]) => void;

  /**
   * @description
   * After row data is rendered.
   */
  onRenderRowData: (params: any, response: any, scrollRemove: any) => void;

  /**
   * @description
   * Cache datatable data.
   */
  cacheDtData: (payload: any, response: any) => void;

  /**
   * @description
   * Cache attachment & comment data.
   */
  cacheAttachCommentData: (data: any) => void;

  /**
   * @description
   * Determines if it's the first payload or not.
   * Based on this data is cached.
   */
  isInitialPayload: (data: any) => boolean;

  /**
   * @description
   * Gets add attachment and comment data.
   */
  getAddAttachmentAddComment: (
    params: any,
    response: any,
    requestPayload: any,
    attachCommentCache: any
  ) => void;

  /**
   * @description
   * Default date filter for data tables.
   */
  initialDateFilter: (params: any) => void;
}

export interface IDataTable {
  /**
   * Custom components to customise the behaviour of the table.
   * For example you can customise how cells are rendered, how values are edited and also create your own filters.
   */
  frameworkComponents?: { [p: string]: { new (): any } } | any;
  /**
   * Column definitions of the table.
   */
  columnDefs: (ColDef | ColGroupDef)[] | null;
  /**
   *To disable the columns of the table,
   */
  columnFields: IDtColumnFields[] | undefined;
  /**
   * End point for data table.
   * refer - src\app\modules\data-table\readme.txt
   */
  tableId: number;
  /**
   * Buttons that placed in the header or top of the table.
   */
  headerElements: IDtHeaderElements;
  /**
   * To set default selected panel button.
   */
  selectedPanelButton?: string | number;
  /**
   * Extra payload to be added api in request.
   */
  postData?: any;
  /**
   * Configuration for export option.
   */
  exportConfig?: { heading: string; ignoreColumns?: string[] };
  /**
   * @description
   * Find which header button is clicked.
   */
  onHeaderBtn?: (event: any) => void;
  /**
   * @description
   * Get selected rows.
   */
  onCellActionbtn?: (event: any) => void;
  /**
   * @description
   * Get view button click event.
   */
  onCellActionView?: (event: any) => void;
  /**
   * @description
   * Get danger click event.
   */
  onCellRendererDangerEvent?: (event: any) => void;
  /**
   * @description
   * Get row click event.
   */
  onRowClicked?: (event: any) => void;
  /**
   * @description
   * Get row select event.
   */
  onRowSelected?: (event: any) => void;
  /**
   * @description
   * Get store info.
   */
  getStoreInfo?: (event: any) => void;
}

export interface ISelectedSingleRow {
  selectedRow?: { [key: string]: any };
  selectedRows?: { [key: string]: any }[];
  id?: string;
  tableId?: number;
}

export interface IDataTableResponse<T = any> {
  rowData: T[];
  rowCount: number;
  queryGeneratedTime: number;
}
