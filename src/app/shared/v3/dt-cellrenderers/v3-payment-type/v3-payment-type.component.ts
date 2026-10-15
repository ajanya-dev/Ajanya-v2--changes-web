import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
  Component,
  inject
} from '@angular/core';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { ICommonTransactionTableData } from 'src/app/models/v3-common';
import { ICellRendererParams } from '@ag-grid-community/core';
import {
  IPayAsItem,
  IUpdatePaymentBody,
  TPaymentSource
} from 'src/app/modules/payments/model/payments';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { Subscription } from 'rxjs';
import { V3PaymentsTableService } from 'src/app/modules/v3-payments-table/shared/components/v3-payments-table/v3-payments-table.service';
import { V3PaymentsTableData } from 'src/app/modules/v3-payments-table/shared/components/v3-payments-table/v3-payments-table-data';
import { CommonModule } from '@angular/common';
import { AngularMaterialModule } from 'src/app/modules/angular-material/angular-material.module';
import { PaymentTypeAccessService } from 'src/app/shared/service/common/shared/payment-type-access/payment-type-access.service';
import { V3DataTableService } from '../../../../modules/v3-data-table/services/v3-data-table.service';
import { faCaretDown } from '@fortawesome/pro-solid-svg-icons';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  standalone: true,
  imports: [CommonModule, AngularMaterialModule,FontAwesomeModule,CommonFilterIconComponent],
  selector: 'app-v3-payment-type',
  templateUrl: './v3-payment-type.component.html',
  styleUrls: ['./v3-payment-type.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class V3PaymentTypeComponent implements OnDestroy {
  /* Injectors */
  private paymentsService = inject(PaymentsService);
  private alertService = inject(AlertService);
  private v3DataTableService = inject(V3DataTableService);
  private v3PaymentsTableService = inject(V3PaymentsTableService);
  private changeDetectionRef = inject(ChangeDetectorRef);
  private paymentTypeAccessService = inject(PaymentTypeAccessService);
  private dataTableService = inject(DataTableService);

  faCaretDown = faCaretDown;
  
  showFilterIcon = false;

  /* Variables */
  commonTransactionTableRowData: ICommonTransactionTableData;

  convertedSourceType: TPaymentSource;
  payFromItems = V3PaymentsTableData.getPayFromItems();
  avaliablePaymentTypes: IPayAsItem[] | undefined;
  subscriptions: Subscription[] = [];
  isFieldReadOnly = true;
  temporaryPaymentType = {
    paymentType: '',
    paymentTypeCode: ''
  };

  updatePayload: IUpdatePaymentBody;

  dynamicColorScheme = '';

  private currentPaymentTypeValue = '';

  public get currentPaymentType() {
    return this.currentPaymentTypeValue;
  }

  public set currentPaymentType(value) {
    this.currentPaymentTypeValue = value;
    this.changeDetectionRef.markForCheck();
  }

  /* Functions */

  /**
   * This function is called on initialisation of the floating component.
   * @param params This contains data like ```rowNode``` as well as the row data
   * we are getting from the backend.
   */
  agInit(params: ICellRendererParams<ICommonTransactionTableData>) {
    if (params.data) {
      this.commonTransactionTableRowData = params.data;
      this.temporaryPaymentType.paymentType =
        this.commonTransactionTableRowData.transfer_type;
      this.temporaryPaymentType.paymentTypeCode =
        this.commonTransactionTableRowData.transfer_type_code;

      if (params.data.transfer_type) {
        if (params.data.transfer_type === 'CHECK') {
          this.currentPaymentType =
            params.data.transfer_mode || params.data.transfer_type;
        } else {
          this.currentPaymentType = params.data.transfer_type;
        }
      } else {
        this.currentPaymentType = 'None';
      }

      this.setPaymentTypes();

      if (
        params.data?.third_party_name !== null &&
        params.data?.source?.name === ''
      ) {
        this.isFieldReadOnly = true;
      }

      if (params.data?.status === 'PENDING' && ![50,52,151,152,800,801,807].includes(params.data?.cheque_status)) {
        if (
          params.data?.third_party_name !== null &&
          params.data?.source?.name === ''
        ) {
          this.isFieldReadOnly = true;
        } else {
          this.isFieldReadOnly = false;
        }
      }

      this.dynamicColorScheme =
        this.commonTransactionTableRowData.transfer_type_code;
      this.listenForSourceTypeChange();
    }
  }

  /**
   * @description This function subscribes to the getter that gets fired when the
   * source type is changed.
   */
  listenForSourceTypeChange() {
    this.subscriptions.push(
      this.v3PaymentsTableService.dynamicSourceNameClearing$.subscribe({
        next: (res) => {
          if (res.uuid === this.commonTransactionTableRowData.uu_id) {
            if (res.uuid === this.commonTransactionTableRowData.uu_id) {
              const payOptions = this.payFromItems.filter(
                (elem) =>
                  elem.id === this.commonTransactionTableRowData.source.source
              )[0].payOptions as IPayAsItem[];
              if (payOptions.length) {
                const isInvalid =
                  payOptions.filter(
                    (elem) =>
                      elem.id ===
                      this.commonTransactionTableRowData.transfer_type_code
                  ).length === 0;
                if (isInvalid) {
                  this.currentPaymentType = 'None';
                  this.commonTransactionTableRowData.transfer_type_code = '';
                  this.dynamicColorScheme = 'none';
                }
              }
              this.setPaymentTypes();
            }
          }
        }
      })
    );
  }

  /**
   * @description Each type has a certain allowed payment types list which we have in a separate JSON file.
   * This function assigns those types dynamically.
   * @param source The type of payment.
   */
  setPaymentTypes(source = this.commonTransactionTableRowData.source.source) {
    if ((source as string) === 'WALLET' || source === 'wallet') {
      this.avaliablePaymentTypes = this.payFromItems.find(
        (ele) => ele.id === 'wallet'
      )?.payOptions;
    } else if ((source as string) === 'BANK' || source === 'bankaccount') {
      const activeTypes =['ach', 'check'];
      this.avaliablePaymentTypes = this.payFromItems.find(
        (ele) => ele.id === 'bankaccount'
      )?.payOptions?.filter(option => activeTypes.includes(option.id));
    } else if ((source as string) === 'CARD' || source === 'card') {
      const activeTypes =['ach', 'wire', 'checkMail'];
      this.avaliablePaymentTypes = this.payFromItems.find(
        (ele) => ele.id === 'card'
      )?.payOptions?.filter(option => activeTypes.includes(option.id));
    } else if ((source as string) === 'CLOUD BANK' || source === 'cloud') {
      this.avaliablePaymentTypes = this.payFromItems.find(
        (ele) => ele.id === 'cloud'
      )?.payOptions;
    }
    if (!this.avaliablePaymentTypes) {
      this.avaliablePaymentTypes = this.payFromItems[0]?.payOptions;
    }
  }

  /**
   * @description We are getting the payment type as a string and we need to convert it to a
   * certain ```TPaymentSource``` interface that accepts only certain types.
   */
  setSourceType() {
    if (
      (this.commonTransactionTableRowData.source.source as string) === 'BANK' ||
      (this.commonTransactionTableRowData.source.source as string) ===
        'bankaccount'
    ) {
      this.convertedSourceType = 'bankaccount';
    } else if (
      (this.commonTransactionTableRowData.source.source as string) ===
        'CLOUD BANK' ||
      (this.commonTransactionTableRowData.source.source as string) === 'cloud'
    ) {
      this.convertedSourceType = 'cloud';
    } else if (
      (this.commonTransactionTableRowData.source.source as string) ===
        'WALLET' ||
      (this.commonTransactionTableRowData.source.source as string) === 'wallet'
    ) {
      this.convertedSourceType = 'wallet';
    } else if (
      (this.commonTransactionTableRowData.source.source as string) === 'CARD' ||
      (this.commonTransactionTableRowData.source.source as string) === 'card'
    ) {
      this.convertedSourceType = 'card';
    } else {
      this.convertedSourceType =
        this.commonTransactionTableRowData.source.source;
    }
  }

  /**
   * @description Gets called when we change the payment type.
   * @param paymentOption This is one of the types we have mentioned in our JSON file.
   */
  changePaymentType(paymentOption: { label: string; id: string }) {
    if (!this.paymentTypeAccessService.onInputChanges(paymentOption.id)) {
      // if choosen disabled payment option, then prevent next steps
      return;
    }
    const alertServiceData = {
      content: 'Are you sure you want to change this field?',
      doneMsg: 'Yes',
      cancelMsg: 'Cancel',
      isOk: true,
      isCancel: true
    };
    const action = this.alertService.infoAlert(alertServiceData);

    action.afterClosed().subscribe((response) => {
      if (response) {
        let paymentOptionId = paymentOption.id;
        if (paymentOption.id === 'check_mail') {
          paymentOptionId = 'checkMail';
        }
        this.commonTransactionTableRowData.transfer_type_code = paymentOptionId;
        this.currentPaymentType = paymentOption.label;
        this.dynamicColorScheme =
          this.commonTransactionTableRowData.transfer_type_code;
        const transferType = paymentOptionId;
        this.setSourceType();
        const sourceId = this.getSourceId();
        this.updatePayload = {
          amount: Number(this.commonTransactionTableRowData.amount),
          transferType,
          sourceType: this.convertedSourceType,
          sourceId
        };
        const isFieldInvalid = this.checkValidation();
        if (!isFieldInvalid) {
          this.subscriptions.push(
            this.paymentsService
              .updatePayment(
                this.commonTransactionTableRowData.uu_id,
                this.updatePayload
              )
              .subscribe({
                next: (res) => {
                  if (res.success) {
                    this.commonTransactionTableRowData.source_id =
                      res.data.sourceId;
                    this.commonTransactionTableRowData.source_name = res.data
                      .source as string;
                    this.commonTransactionTableRowData.transfer_type_code =
                      res.data.transferTypeCode;
                    this.currentPaymentType = res.data.transferType;
                    this.dynamicColorScheme = res.data.transferTypeCode;
                    this.v3DataTableService.refreshV3DataTable();
                    this.v3PaymentsTableService.isSourceSelected.next({
                      uuid: this.commonTransactionTableRowData.uu_id,
                      transferType: res.data.transferTypeCode,
                      transferId: res.data.transferId
                    });
                  }
                },
                error: () => {
                  this.currentPaymentType =
                    this.temporaryPaymentType.paymentType;
                  this.dynamicColorScheme =
                    this.temporaryPaymentType.paymentTypeCode;
                }
              })
          );
        }
      }
    });
  }

  /**
   * @description Check if the fields are valid or not
   * @returns -Returns true if all fields are present
   */
  checkValidation() {
    const sourceType = this.commonTransactionTableRowData.source.source;
    const sourceId = this.commonTransactionTableRowData.source_id;
    const transferType = this.commonTransactionTableRowData.transfer_type_code;

    if (!sourceType || !sourceId || !transferType) {
      return true;
    }
    return false;
  }

  /**
   * @description Retrieves the source ID for the payment update process
   * @returns - The source ID for updating the payment
   */
  getSourceId() {
    if (this.convertedSourceType === 'wallet') {
      const id = this.commonTransactionTableRowData.source.uuId;
      if (!id) {
        return this.commonTransactionTableRowData.source.info?.uuId;
      }
      return id;
    }
    if (this.convertedSourceType === 'card') {
      const id = this.commonTransactionTableRowData.source.cardId;
      if (!id) {
        return this.commonTransactionTableRowData.source.source_id;
      }
      return id;
    }
    const id = this.commonTransactionTableRowData.source.source_id;
    if (!id) {
      return this.commonTransactionTableRowData.source_id;
    }
    return id;
  }

  onFilterClicked(): void {
    let filterField = this.currentPaymentType;
    if(filterField === 'VIRTUAL CARD'){
      filterField= 'Virtual Card' ;
    } else if(filterField === 'PRINT'){
      filterField= 'Print' ;
    } else if(filterField === 'MAIL CHECK'){
      filterField= 'Mail Check' ;
    } else if(filterField === 'EMAIL CHECK'){
      filterField= 'Email Check' ;
    } else if(filterField === 'WIRE'){
      filterField= 'Wire' ;
    }else if(filterField === 'MAIL'){
      filterField= 'Mail' ;
    }else if(filterField === 'CHECK'){
      filterField= 'Check' ;
    }else if(filterField === 'INTERNATIONAL PAYMENT'){
      filterField= 'International Payment' ;
    }
    const cellValue = {
      filter: filterField,
      field: 'Type',
      payee: undefined
    };
    this.dataTableService.selectedCellValueSignal.set(cellValue);
  }

  showFilterIconForRow(show?:boolean){
    if(show){
      this.showFilterIcon = true;
    } else {
      this.showFilterIcon = false;
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach((item) => {
      item.unsubscribe();
    });
  }
}
