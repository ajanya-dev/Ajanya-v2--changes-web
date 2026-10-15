import { Injectable, signal, computed, inject } from '@angular/core';
import { formatDate } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { Store } from '@ngrx/store';
import { BillService } from 'src/app/shared/service/Bill/bill.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { payeesActions } from 'src/app/modules/store/payees/payees.actions';
import {
  IEmailBillItem,
  IExtractedItem,
  IAttachment
} from 'src/app/modules/bill/model/Bill';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import { IApiRes } from 'src/app/models/api';

export interface IInvoiceDetails {
  id?: number;
  messageId?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  amountDue?: number;
  subject?: string;
  receivedAt?: string;
  extractionStatus?: string;
  currency?: string;
  paymentTerms?: string;
  poNumber?: string;
  notes?: string;
  vendor?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  billTo?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  items?: Array<{
    id?: string | number;
    name?: string;
    description?: string;
    quantity?: number;
    price?: number;
    amount?: number;
    taxRate?: number;
    taxAmount?: number;
  }>;
  processingMetadata?: {
    extractionConfidence?: number;
    extractionMethod?: string;
    processingTimeMs?: number;
    errorMessage?: string;
    retryCount?: number;
    lastRetryAt?: string;
  };
  attachments?: Array<{
    id: number;
    filename: string;
    file_nick_name?: string; // Added for display name
    fileSize: number;
    fileType: string;
    fileUrl: string;
    public_url?: string; // Added for direct access URL
    uploadedAt: string;
    encrypted_id: string;
  }>;
}

export interface IBillFormData {
  payeeVendor?: string;
  payeeId?: string;
  bankAccount?: string;
  invoiceNo?: string;
  poNo?: string;
  invoiceDate?: string;
  dueDate?: string;
  amount?: number;
  accountNo?: string;
  memo?: string;
  category?: string;
  items?: Array<{
    id?: string | number;
    name?: string;
    description?: string;
    quantity?: number;
    price?: number;
    amount?: number;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class InvoiceBillStateService {
  private billService = inject(BillService);
  private payeeService = inject(PayeeService);
  private sharedService = inject(SharedService);
  private alertService = inject(V4AlertService);
  private store = inject(Store);

  private cancelProcessing$ = new Subject<void>();

  // Core data signals
  private _invoiceData = signal<IInvoiceDetails | null>(null);
  private _billFormData = signal<IBillFormData>({});
  private _isFormVisible = signal<boolean>(false);
  private _mappedEmail = signal<string>('');
  private _billAutomationEnabled = signal(false);
  private _isEmailToBillMapped = signal(false);
  private _isBillAutomationCallDone = signal(false);

  // Public readonly signals
  readonly invoiceData = this._invoiceData.asReadonly();
  readonly billFormData = this._billFormData.asReadonly();
  readonly isFormVisible = this._isFormVisible.asReadonly();
  readonly mappedEmail = this._mappedEmail.asReadonly();
  readonly billAutomationEnabled = this._billAutomationEnabled.asReadonly();
  readonly isEmailToBillMapped = this._isEmailToBillMapped.asReadonly();
  readonly isBillAutomationCallDone = this._isBillAutomationCallDone.asReadonly();

  isAddBillFormLoading = signal<boolean>(false);

  // Bill saved trigger for cross-component communication
  private _billSavedTrigger = signal<number>(0);
  readonly billSavedTrigger = this._billSavedTrigger.asReadonly();

  // Computed signals for reactive updates
  readonly hasInvoiceData = computed(() => this._invoiceData() !== null);
  readonly totalAmount = computed(() => {
    const items = this._billFormData().items || [];
    return items.reduce((total, item) => total + (item.amount || 0), 0);
  });

  setMappedEmail(mappedEmail: string): void {
    this._mappedEmail.set(mappedEmail);
  }

  setBillAutomationEnabled(enabled: boolean): void {
    this._billAutomationEnabled.set(enabled);
  }

  setIsEmailToBillMapped(mapped: boolean): void {
    this._isEmailToBillMapped.set(mapped);
  }

  setIsBillAutomationCallDone(done: boolean): void {
    this._isBillAutomationCallDone.set(done);
  }

  // Invoice data methods
  setInvoiceData(data: IInvoiceDetails | null): void {
    this._invoiceData.set(data);
    if (data) {
      this.syncInvoiceToBillForm(data);
    }
  }

  updateInvoiceData(updates: Partial<IInvoiceDetails>): void {
    const current = this._invoiceData();
    if (current) {
      this._invoiceData.set({ ...current, ...updates });
    }
  }



  updateBillFormData(updates: Partial<IBillFormData>): void {
    const current = this._billFormData();
    this._billFormData.set({ ...current, ...updates });
    // Trigger immediate sync for real-time updates
    setTimeout(() => this.syncBillFormToInvoice(), 0);
  }

  // Form visibility methods
  showForm(): void {
    this._isFormVisible.set(true);
  }

  hideForm(): void {
    this._isFormVisible.set(false);
  }

  setAddBillFormLoading(loading: boolean): void {
    this.isAddBillFormLoading.set(loading);
  }

  triggerBillSaved(): void {
    this._billSavedTrigger.update(v => v + 1);
  }

  // Sync methods for real-time updates
  private syncInvoiceToBillForm(invoiceData: IInvoiceDetails): void {
    this._billFormData.set({
      payeeVendor: invoiceData.vendor?.name || '',
      payeeId: invoiceData.vendor?.id || '',
      invoiceNo: invoiceData.invoiceNumber || '',
      invoiceDate: invoiceData.invoiceDate || '',
      dueDate: invoiceData.dueDate || '',
      amount: invoiceData.amountDue || 0,
      memo: `Invoice from ${invoiceData.vendor?.name || ''}`,
      items: invoiceData.items?.map(item => ({
        name: item.name || '',
        description: item.description || '',
        quantity: item.quantity || 0,
        price: item.price || 0,
        amount: item.amount || 0
      })) || []
    });
  }

  private syncBillFormToInvoice(): void {
    const billData = this._billFormData();
    const currentInvoice = this._invoiceData();
    
    if (currentInvoice) {
      const updatedInvoice: IInvoiceDetails = {
        ...currentInvoice,
        invoiceNumber: billData.invoiceNo || currentInvoice.invoiceNumber,
        invoiceDate: billData.invoiceDate || currentInvoice.invoiceDate,
        dueDate: billData.dueDate || currentInvoice.dueDate,
        amountDue: billData.amount || currentInvoice.amountDue,
        vendor: {
          ...currentInvoice.vendor,
          id: billData.payeeId || currentInvoice.vendor?.id,
          name: billData.payeeVendor || currentInvoice.vendor?.name
        },
        items: billData.items?.map(item => ({
          name: item.name || '',
          description: item.description || '',
          quantity: item.quantity || 0,
          price: item.price || 0,
          amount: item.amount || 0
        })) || currentInvoice.items
      };
      
      this._invoiceData.set(updatedInvoice);
    }
  }




  // Process selected email bill item
  processSelectedItem(item: IEmailBillItem): void {
    this.cancelProcessing$.next();
    this.setAddBillFormLoading(true);

    if (item.extraction_status === 'failed') {
      const invoiceDetails = this.transformToInvoiceDetails(item);
      invoiceDetails.extractionStatus = 'failed';
      this.setInvoiceData(invoiceDetails);
      this.setAddBillFormLoading(false);
      return;
    }

    const hasExtractedItems =
      item.extracted_data &&
      item.extracted_data.length > 0 &&
      item.extracted_data[0].items &&
      item.extracted_data[0].items.length > 0;

    const hasExtractedVendor =
      item.extracted_data &&
      item.extracted_data.length > 0 &&
      item.extracted_data[0].vendor_info &&
      item.extracted_data[0].vendor_info.name;

    if (hasExtractedItems || hasExtractedVendor) {
      if (hasExtractedItems) {
        const extractedData = item.extracted_data;
        if (!extractedData?.length) return;
        const firstExtracted = extractedData[0];
        const { items } = firstExtracted;
        if (!items) return;

        const itemsData = items
          .filter((extractedItem) => extractedItem.ITEM)
          .map((ei) => ({
            item: ei.ITEM || '',
            quantity: ei.QUANTITY || '0',
            price: ei.PRICE || '0',
            description: ei.ITEM || ''
          }));

        this.billService
          .bulkInsertItems(itemsData)
          .pipe(takeUntil(this.cancelProcessing$))
          .subscribe({
            next: (
              response: IApiRes<
                {
                  id: string;
                  encript_id: string;
                  item: string;
                  quantity: string;
                  price: string;
                  description: string;
                }[]
              >
            ) => {
              if (response.success && response.data) {
                firstExtracted.items = response.data.map(
                  (returnedItem, index) => ({
                    ...items[index],
                    id: returnedItem.encript_id || `temp_${index + 1}`
                  })
                );
              }

              if (hasExtractedVendor) {
                this.handlePayeeCreation(item);
              } else {
                const invoiceDetails = this.transformToInvoiceDetails(item);
                this.setInvoiceData(invoiceDetails);
                this.setAddBillFormLoading(false);
              }
            },
            error: () => {
              firstExtracted.items = items.map(
                (extractedItem: IExtractedItem, index: number) => ({
                  ...extractedItem,
                  id: `fallback_${index + 1}`
                })
              );

              if (hasExtractedVendor) {
                this.handlePayeeCreation(item);
              } else {
                const invoiceDetails = this.transformToInvoiceDetails(item);
                this.setInvoiceData(invoiceDetails);
                this.setAddBillFormLoading(false);
              }
            }
          });
      } else if (hasExtractedVendor) {
        this.handlePayeeCreation(item);
      }
    } else {
      const invoiceDetails = this.transformToInvoiceDetails(item);
      this.setInvoiceData(invoiceDetails);
      this.setAddBillFormLoading(false);
    }
  }

  private handlePayeeCreation(item: IEmailBillItem): void {
    const vendorInfo = item.extracted_data?.[0]?.vendor_info;

    if (vendorInfo?.name) {
      this.payeeService
        .getPayees(1, vendorInfo.name)
        .pipe(takeUntil(this.cancelProcessing$))
        .subscribe({
          next: (response: IApiRes<IPayeeDropdown[]>) => {
            if (response.success && response.data && response.data.length > 0) {
              const existingPayee = response.data[0];
              this.setPayeeAndCompleteFlow(item, existingPayee, false);
            } else {
              this.createNewPayeeFromVendor(
                item,
                vendorInfo as {
                  name: string;
                  phone: string;
                  address: string;
                  address_line_1: string;
                  address_line_2: string;
                  city: string;
                  state: string;
                  country: string;
                  zip: string;
                }
              );
            }
          },
          error: () => {
            this.createNewPayeeFromVendor(
              item,
              vendorInfo as {
                name: string;
                phone: string;
                address: string;
                address_line_1: string;
                address_line_2: string;
                city: string;
                state: string;
                country: string;
                zip: string;
              }
            );
          }
        });
    } else {
      const invoiceDetails = this.transformToInvoiceDetails(item);
      this.setInvoiceData(invoiceDetails);
      this.setAddBillFormLoading(false);
    }
  }

  private createNewPayeeFromVendor(
    item: IEmailBillItem,
    vendorInfo: {
      name: string;
      phone: string;
      address: string;
      address_line_1: string;
      address_line_2: string;
      city: string;
      state: string;
      country: string;
      zip: string;
    }
  ): void {
    const payeeData = {
      payeeTypeId: '2',
      name: vendorInfo.name || '',
      payeeNickName: '',
      payeeEmail: item.from_email || '',
      payeePhone: vendorInfo.phone?.replace(/\s/g, '') || '',
      payeeCompanyName: vendorInfo.name || '',
      payeeAddressLine1: vendorInfo.address_line_1 || '',
      payeeAddressLine2: vendorInfo.address_line_2 || '',
      payeeCity: vendorInfo.city || '',
      payeeState: vendorInfo.state || '',
      payeeCountry: vendorInfo.country || '',
      payeeZip: vendorInfo.zip || '',
      merchantCategory: '',
      entityType: 'individual',
      customerAccountNumber: '',
      vendorAccountNumber: '',
      employeeAccountNumber: '',
      isRequestedBankInfo: '0',
      bankData: [],
      internationalWirePayeeAccounts: [],
      customerBankAccountId: '',
      customerCategory: '',
      customerDefaultPayMethod: '',
      customerFirstName: '',
      customerLastName: '',
      customerType: '',
      customerCompanyName: '',
      vendorBankAccountId: '',
      vendorCategory: '',
      vendorDefaultPayMethod: '',
      vendorFirstName: '',
      vendorLastName: '',
      vendorType: '',
      vendorPaymentTerms: '',
      vendorTaxId: '',
      vendor_1099: '',
      vendorCompanyName: vendorInfo.name || '',
      employeeFirstName: '',
      employeeLastName: '',
      employeeDob: '',
      employeeSsn: '',
      employeeType: '',
      employeeHourlyRate: '',
      employeePaymentSchedule: '',
      employeeFillingStatus: '',
      employeeOvertimeRate: '',
      employeeYtdEarning: '',
      employeeYtdTax: '',
      employeeBankAccountId: '',
      employeeCategory: '',
      employeeDefaultPayMethod: '',
      is_requested_bank_info: 0,
      permission_email: 0,
      permission_sms: 0,
      merchant_category: ''
    };

    this.payeeService
      .createPayee(payeeData)
      .pipe(takeUntil(this.cancelProcessing$))
      .subscribe({
        next: (response: IApiRes<IPayeeDropdown>) => {
          if (response.success && response.data) {
            this.store.dispatch(
              payeesActions.addCreatedPayeeIntoPayees({ payee: response.data })
            );
            this.setPayeeAndCompleteFlow(item, response.data, true);
          } else {
            this.handlePayeeCreationError(item, vendorInfo.name);
          }
        },
        error: () => {
          this.handlePayeeCreationError(item, vendorInfo.name);
        }
      });
  }

  private setPayeeAndCompleteFlow(
    item: IEmailBillItem,
    payee: IPayeeDropdown,
    isNewPayee: boolean
  ): void {
    this.sharedService.setNewPayeeCreatedData({
      payeeId: payee.id,
      payeeName: payee.name
    });

    const invoiceDetails = this.transformToInvoiceDetails(item);
    if (invoiceDetails.vendor) {
      invoiceDetails.vendor.id = payee.id;
    } else {
      invoiceDetails.vendor = { id: payee.id };
    }
    this.setInvoiceData(invoiceDetails);
    this.setAddBillFormLoading(false);

    if (isNewPayee) {
      this.alertService.successAlert({
        content: `Payee "${payee.name}" created successfully!`,
        close: true,
        timeout: 2500
      });
    }
  }

  private handlePayeeCreationError(
    item: IEmailBillItem,
    vendorName: string
  ): void {
    this.sharedService.setNewPayeeCreatedData({
      payeeName: vendorName
    });

    const invoiceDetails = this.transformToInvoiceDetails(item);
    this.setInvoiceData(invoiceDetails);
    this.setAddBillFormLoading(false);

    this.alertService.infoAlert({
      title: 'Payee Creation',
      content: `Could not automatically create payee "${vendorName}". Please select or create manually.`
    });
  }

  private transformToInvoiceDetails(
    emailBill: IEmailBillItem
  ): IInvoiceDetails {
    const extractedDataArray = emailBill.extracted_data;
    const extractedData =
      extractedDataArray && extractedDataArray.length > 0
        ? extractedDataArray[0]
        : null;

    const vendorInfo = extractedData?.vendor_info;
    const invoiceInfo = extractedData?.invoice_info;
    const receiverInfo = extractedData?.receiver_info;
    const itemsData = extractedData?.items || [];

    return {
      id: emailBill.id,
      messageId: emailBill.message_id,
      invoiceNumber: invoiceInfo?.invoice_id || '',
      invoiceDate:
        invoiceInfo?.invoice_date ||
        (emailBill.received_at
          ? formatDate(emailBill.received_at, 'MM/dd/yyyy', 'en-US')
          : ''),
      dueDate: invoiceInfo?.due_date || '',
      amountDue: parseFloat(invoiceInfo?.total_amount || '0') || 0,
      subject: emailBill.subject || '',
      receivedAt: emailBill.received_at || '',
      extractionStatus: emailBill.extraction_status || '',
      currency: 'USD',
      paymentTerms: '',
      poNumber: '',
      notes: '',
      vendor: {
        name: vendorInfo?.name || '',
        email: emailBill.from_email || '',
        phone: vendorInfo?.phone || '',
        address: vendorInfo?.address || ''
      },
      billTo: {
        name: receiverInfo?.name || '',
        email: emailBill.to_email || '',
        phone: '',
        address: receiverInfo?.address || ''
      },
      items: itemsData.map((item: IExtractedItem, index: number) => ({
        id: item.id || `item_${index + 1}`,
        description: item.ITEM || '',
        quantity: parseFloat(item.QUANTITY?.replace(/,/g, '') || '0') || 0,
        price: parseFloat(item.UNIT_PRICE?.replace(/,/g, '') || '0') || 0,
        amount: parseFloat(item.PRICE?.replace(/,/g, '') || '0') || 0,
        taxRate: 0,
        taxAmount: 0
      })),
      processingMetadata: emailBill.processing_metadata
        ? {
            extractionConfidence:
              emailBill.processing_metadata.extraction_confidence,
            extractionMethod: emailBill.processing_metadata.extraction_method,
            processingTimeMs: emailBill.processing_metadata.processing_time_ms,
            errorMessage: emailBill.processing_metadata.error_message,
            retryCount: emailBill.processing_metadata.retry_count,
            lastRetryAt: emailBill.processing_metadata.last_retry_at
          }
        : undefined,
      attachments:
        emailBill.attachments?.map((attachment: IAttachment) => ({
          id: attachment.id,
          filename: attachment.filename,
          file_nick_name: attachment.file_nick_name,
          fileSize: attachment.file_size,
          fileType: attachment.file_type,
          fileUrl: attachment.file_url,
          public_url: attachment.public_url,
          uploadedAt: attachment.uploaded_at,
          encrypted_id: attachment.encrypted_id
        })) || []
    };
  }

  // Clear all data
  clearAll(): void {
    this._invoiceData.set(null);
    this._billFormData.set({});
    this._isFormVisible.set(false);
  }
}
