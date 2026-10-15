import { Component, signal, inject, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { EmailBillListComponent } from '../../components/email-bill-list/email-bill-list.component';
import { IAttachment, IEmailBillItem, IExtractedItem } from '../../model/Bill';
import { InvoiceViewComponent } from '../../components/invoice-view/invoice-view.component';
import { InvoiceBillStateService, IInvoiceDetails } from '../../services/invoice-bill-state.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BillService } from 'src/app/shared/service/Bill/bill.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { Store } from '@ngrx/store';
import { payeesActions } from 'src/app/modules/store/payees/payees.actions';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import { IApiRes } from 'src/app/models/api';
import { Subject, takeUntil } from 'rxjs';



@Component({
  selector: 'app-bill-invoice-page',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, NgClass, EmailBillListComponent, InvoiceViewComponent],
  templateUrl: './bill-invoice-page.component.html',
  styleUrl: './bill-invoice-page.component.scss'
})
export class BillInvoicePageComponent implements OnDestroy {
  // Inject services
  private invoiceBillStateService = inject(InvoiceBillStateService);
  private alertService = inject(AlertService);
  private billService = inject(BillService);
  private payeeService = inject(PayeeService);
  private sharedService = inject(SharedService);
  private store = inject(Store);
  private datePipe = inject(DatePipe);
  readonly isItemsLoading = this.invoiceBillStateService.isAddBillFormLoading;
  readonly isAddBillOpened= this.invoiceBillStateService.isFormVisible;

  readonly isEmailInboxVisible = signal<boolean>(true);

  
  @ViewChild(EmailBillListComponent) emailBillListComponent!: EmailBillListComponent;
  
  selectedEmailBill = signal<IEmailBillItem | null>(null);
  destroy$ = new Subject<boolean>();
  private cancelOngoingCalls$ = new Subject<void>();
  
  readonly invoiceDetails = this.invoiceBillStateService.invoiceData;

  /**
   * Handle email bill selection from the list
   */
  onEmailBillSelected(item: IEmailBillItem | undefined): void {
    // Cancel any ongoing API calls
    this.cancelOngoingCalls$.next();
    
    if (!item) {
      this.selectedEmailBill.set(null);
      this.invoiceBillStateService.setInvoiceData(null);
      return;
    }
    
    this.selectedEmailBill.set(item);

    if (item.extraction_status === 'failed') {
      const invoiceDetails = this.transformToInvoiceDetails(item);
      invoiceDetails.extractionStatus = 'failed';
      this.invoiceBillStateService.setInvoiceData(invoiceDetails);
      return;
    }
    
    const hasExtractedItems = item.extracted_data && 
                             item.extracted_data.length > 0 && 
                             item.extracted_data[0].items && 
                             item.extracted_data[0].items.length > 0;

    const hasExtractedVendor = item.extracted_data && 
                              item.extracted_data.length > 0 && 
                              item.extracted_data[0].vendor_info && 
                              item.extracted_data[0].vendor_info.name;

    if (hasExtractedItems || hasExtractedVendor) {
      
      this.invoiceBillStateService.setAddBillFormLoading(true);
      
      if (hasExtractedItems) {
        const itemsData = item.extracted_data![0].items!.filter(extractedItem => extractedItem.ITEM).map(item=>{
          return {
            item: item.ITEM || '',
            quantity: item.QUANTITY || '0',
            price: item.PRICE || '0',
            description: item.ITEM || ''
          };
        });

         this.billService.bulkInsertItems(itemsData).pipe(
           takeUntil(this.cancelOngoingCalls$),
           takeUntil(this.destroy$)
         ).subscribe({
           next: (response: IApiRes<{id: string, encript_id: string, item: string, quantity: string, price: string, description: string}[]>) => {
            if (response.success && response.data) {
              item.extracted_data![0].items = response.data.map((returnedItem: {id: string, encript_id: string, item: string, quantity: string, price: string, description: string}, index: number) => ({
                ...item.extracted_data![0].items![index],
                id: returnedItem.encript_id || `temp_${index + 1}` 
              }));
            }
            
            if (hasExtractedVendor) {
              this.handlePayeeCreation(item);
            } else {
              const invoiceDetails = this.transformToInvoiceDetails(item);
              this.invoiceBillStateService.setInvoiceData(invoiceDetails);
              this.invoiceBillStateService.setAddBillFormLoading(false);
            }
          },
          error: (error) => {
            item.extracted_data![0].items = item.extracted_data![0].items!.map((extractedItem: IExtractedItem, index: number) => ({
              ...extractedItem,
              id: `fallback_${index + 1}` // Generate fallback IDs
            }));
            
            if (hasExtractedVendor) {
              this.handlePayeeCreation(item);
            } else {
              const invoiceDetails = this.transformToInvoiceDetails(item);
              this.invoiceBillStateService.setInvoiceData(invoiceDetails);
              this.invoiceBillStateService.setAddBillFormLoading(false);
            }
          }
        });
      } else if (hasExtractedVendor) {
        // No items, just handle payee creation
        this.handlePayeeCreation(item);
      }
    } else {
      // No items or vendor to process, proceed with normal transformation
      const invoiceDetails = this.transformToInvoiceDetails(item);
      this.invoiceBillStateService.setInvoiceData(invoiceDetails);
    }
  }

  /**
   * Handle payee creation from extracted vendor information
   */
  private handlePayeeCreation(item: IEmailBillItem): void {
    const vendorInfo = item.extracted_data?.[0]?.vendor_info;
    
    if (vendorInfo?.name) {
      this.payeeService.getPayees(1, vendorInfo.name).pipe(
        takeUntil(this.cancelOngoingCalls$),
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response: IApiRes<IPayeeDropdown[]>) => {
          if (response.success && response.data && response.data.length > 0) {
            const existingPayee = response.data[0];
            this.setPayeeAndCompleteFlow(item, existingPayee, false);
          } else {
            this.createNewPayeeFromVendor(item, vendorInfo as { name: string, phone: string, address: string, address_line_1: string, address_line_2: string, city: string, state: string, country: string, zip: string });
          }
        },
        error: (error) => {
          this.createNewPayeeFromVendor(item, vendorInfo as { name: string, phone: string, address: string, address_line_1: string, address_line_2: string, city: string, state: string, country: string, zip: string });
        }
      });
    } else {
      // No vendor info, proceed with normal transformation
      const invoiceDetails = this.transformToInvoiceDetails(item);
      this.invoiceBillStateService.setInvoiceData(invoiceDetails);
      this.invoiceBillStateService.setAddBillFormLoading(false);
    }
  }

  /**
   * Create new payee from vendor information using the modal service approach
   */
  private createNewPayeeFromVendor(item: IEmailBillItem, vendorInfo: { name: string, phone: string, address: string, address_line_1: string, address_line_2: string, city: string, state: string, country: string, zip: string }): void {
    const payeeData = {
      payeeTypeId: '2', // Vendor type
      name: vendorInfo.name || '',
      payeeNickName: '',
      payeeEmail: item.from_email || '',
      payeePhone: vendorInfo.phone.replace(/\s/g, '') || '',
      payeeCompanyName: vendorInfo.name || '',
      payeeAddressLine1: vendorInfo.address_line_1 || '',
      payeeAddressLine2: vendorInfo.address_line_2 || '', 
      payeeCity: vendorInfo.city || '',
      payeeState: vendorInfo.state || '',
      payeeCountry: vendorInfo.country || '',
      payeeZip: vendorInfo.zip || '',
      merchantCategory: '',
      entityType: 'individual',
      
      // Required fields with empty defaults
      customerAccountNumber: '',
      vendorAccountNumber: '',
      employeeAccountNumber: '',
      isRequestedBankInfo: '0',
      bankData: [],
      internationalWirePayeeAccounts: [],
      
      // Customer fields
      customerBankAccountId: '',
      customerCategory: '',
      customerDefaultPayMethod: '',
      customerFirstName: '',
      customerLastName: '',
      customerType: '',
      customerCompanyName: '',
      
      // Vendor fields
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
      
      // Employee fields
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

    // Create payee using existing PayeeService
    this.payeeService.createPayee(payeeData).pipe(
      takeUntil(this.cancelOngoingCalls$),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: IApiRes<IPayeeDropdown>) => {
        if (response.success && response.data) {
          this.store.dispatch(payeesActions.addCreatedPayeeIntoPayees({ payee: response.data }));
          this.setPayeeAndCompleteFlow(item, response.data, true);
        } else {
          this.handlePayeeCreationError(item, vendorInfo.name);
        }
      },
      error: (error) => {
        this.handlePayeeCreationError(item, vendorInfo.name);
      }
    });
  }

  /**
   * Set payee information and complete the invoice flow
   */
  private setPayeeAndCompleteFlow(item: IEmailBillItem, payee: IPayeeDropdown, isNewPayee: boolean): void {
    this.sharedService.setNewPayeeCreatedData({
      payeeId: payee.id,
      payeeName: payee.name
    });
    
    // Transform and set invoice data with payee ID
    const invoiceDetails = this.transformToInvoiceDetails(item);
    invoiceDetails.vendor!.id = payee.id;
    this.invoiceBillStateService.setInvoiceData(invoiceDetails);
    this.invoiceBillStateService.setAddBillFormLoading(false);
    
    // Show success message for new payees
    if (isNewPayee) {
      this.alertService.successAlert({
        title: 'Success',
        content: `Payee "${payee.name}" created successfully!`
      });
    }
  }

  /**
   * Handle payee creation errors
   */
  private handlePayeeCreationError(item: IEmailBillItem, vendorName: string): void {
    // On error, set payee name without ID (user can manually select/create)
    this.sharedService.setNewPayeeCreatedData({
      payeeName: vendorName
    });
    
    const invoiceDetails = this.transformToInvoiceDetails(item);
    this.invoiceBillStateService.setInvoiceData(invoiceDetails);
    this.invoiceBillStateService.setAddBillFormLoading(false);
    
    // Show info message about manual selection needed
    this.alertService.infoAlert({
      title: 'Payee Creation',
      content: `Could not automatically create payee "${vendorName}". Please select or create manually.`
    });
  }

  /**
   * Transform email bill data to invoice details format
   */
  private transformToInvoiceDetails(emailBill: IEmailBillItem): IInvoiceDetails {

    const extractedDataArray = emailBill.extracted_data;
    const extractedData = extractedDataArray && extractedDataArray.length > 0 ? extractedDataArray[0] : null;

    // Extract vendor info
    const vendorInfo = extractedData?.vendor_info;
    const invoiceInfo = extractedData?.invoice_info;
    const receiverInfo = extractedData?.receiver_info;
    const itemsData = extractedData?.items || [];

    return {
      id: emailBill.id,
      messageId: emailBill.message_id,
      invoiceNumber: invoiceInfo?.invoice_id || '',
      invoiceDate: invoiceInfo?.invoice_date || (emailBill.received_at ? this.datePipe.transform(emailBill.received_at, 'MM/dd/yyyy') || '' : ''),
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
        amount: (parseFloat(item.PRICE?.replace(/,/g, '') || '0') || 0) , 
        taxRate: 0,
        taxAmount: 0
      })),

      processingMetadata: emailBill.processing_metadata ? {
        extractionConfidence: emailBill.processing_metadata.extraction_confidence,
        extractionMethod: emailBill.processing_metadata.extraction_method,
        processingTimeMs: emailBill.processing_metadata.processing_time_ms,
        errorMessage: emailBill.processing_metadata.error_message,
        retryCount: emailBill.processing_metadata.retry_count,
        lastRetryAt: emailBill.processing_metadata.last_retry_at
      } : undefined,

      attachments: emailBill.attachments?.map((attachment: IAttachment) => ({
        id: attachment.id,
        filename: attachment.filename,
        file_nick_name: attachment.file_nick_name, // Map display name
        fileSize: attachment.file_size,
        fileType: attachment.file_type,
        fileUrl: attachment.file_url,
        public_url: attachment.public_url, // Map direct access URL
        uploadedAt: attachment.uploaded_at,
        encrypted_id: attachment.encrypted_id
      })) || []
    };
  }


  /**
   * Handle form opened event from invoice view
   */
  onFormOpened(event: { isModalMode: boolean }): void {
    if (!event.isModalMode) {
      this.isEmailInboxVisible.set(false);
    }
  }

  /**
   * Handle form closed event from invoice view
   */
  onFormClosed(): void {
    this.invoiceBillStateService.hideForm();
    this.isEmailInboxVisible.set(true);
  }

  /**
   * Handle bill saved event from invoice view
   */
  onBillSaved(invoiceData: IInvoiceDetails): void {
    this.alertService.successAlert({
      title: 'Success',
      content: 'Invoice successfully converted to bill and removed from inbox!'
    });
    
    this.reloadEmailBillsList();
    this.selectedEmailBill.set(null);
    this.invoiceBillStateService.setInvoiceData(null);
  }

  /**
   * Handle bill updated event from invoice view
   */
  onBillUpdated(invoiceData: IInvoiceDetails): void {
    this.reloadEmailBillsList();
    this.selectedEmailBill.set(null);
    this.invoiceBillStateService.setInvoiceData(null);
  }

  /**
   * Get status class for styling
   */
  getStatusClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'bg-common-secondary-yellow-color text-common-yellow-color';
      case 'processed':
      case 'extracted':
        return 'bg-common-secondary-green-color text-common-green-color';
      case 'failed':
        return 'bg-common-secondary-red-color text-common-red-color';
      default:
        return 'bg-secondary-background-color text-secondary-text-color';
    }
  }


  /**
   * Reload the email bills list to reflect changes after bill creation
   */
  private reloadEmailBillsList(): void {
    if (this.emailBillListComponent) {
      this.emailBillListComponent.loadEmailBills();
    }
  }

  ngOnDestroy(): void {
    this.invoiceBillStateService.clearAll();
    this.isEmailInboxVisible.set(true);
    this.selectedEmailBill.set(null);
    this.cancelOngoingCalls$.next();
    this.cancelOngoingCalls$.complete();
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
