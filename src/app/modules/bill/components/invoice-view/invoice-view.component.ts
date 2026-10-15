import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  inject,
  computed,
  effect,
  HostListener,
  signal
} from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faFileInvoice,
  faCalendar,
  faDollarSign,
  faBuilding,
  faPhone,
  faMapMarkerAlt,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import { faCopy } from '@fortawesome/pro-regular-svg-icons';
import { AddBillModalComponent } from 'src/app/modules/bill/modals/add-bill-modal/add-bill-modal.component';
import {
  InvoiceBillStateService,
  IInvoiceDetails,
  IBillFormData
} from '../../services/invoice-bill-state.service';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Clipboard } from '@angular/cdk/clipboard';
import {  MatTooltipModule } from '@angular/material/tooltip';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';

@Component({
  selector: 'app-invoice-view',
  standalone: true,
  imports: [
    CommonModule,
    FontAwesomeModule,
    AddBillModalComponent,
    DatePipe,
    CurrencyPipe,
    MatTooltipModule,
    OcwBackButtonComponent

  ],
  templateUrl: './invoice-view.component.html',
  styleUrl: './invoice-view.component.scss'
})
export class InvoiceViewComponent implements OnInit {
  @Input() invoiceData: IInvoiceDetails | null = null;
  @Output() formClosed = new EventEmitter<void>();
  @Output() formOpened = new EventEmitter<{ isModalMode: boolean }>();
  @Output() billSaved = new EventEmitter<IInvoiceDetails>();
  @Output() billUpdated = new EventEmitter<IInvoiceDetails>();
  alwaysShowPdf = signal(true);

  // Inject the service
  private invoiceBillStateService = inject(InvoiceBillStateService);
  private dialog = inject(MatDialog);
  private sanitizer = inject(DomSanitizer);
  private clipboard = inject(Clipboard);


  // Use service signals
  readonly isFormVisible = this.invoiceBillStateService.isFormVisible;
  readonly currentInvoiceData = this.invoiceBillStateService.invoiceData;
  readonly billFormData = this.invoiceBillStateService.billFormData;
  readonly mappedEmail = this.invoiceBillStateService.mappedEmail;

  // PDF viewing
  urlSafe: SafeResourceUrl;
  pdfLoaded: boolean = false;
  

  // Screen size detection
  private isModalMode = false;
  tooltip = signal('Copy');

  // Computed property for template
  readonly shouldShowEmbeddedForm = computed(() => {
    return this.isFormVisible() && !this.isModalMode;
  });

  // Modal data for AddBillModalComponent - computed to be reactive
  billModalData = computed(() => {
    const currentData = this.currentInvoiceData();
    if (currentData) {
      return {
        mode: 'new',
        invoiceData: currentData,
        extractedData: {
          payee: currentData.vendor?.name || '',
          inv_no: currentData.invoiceNumber,
          inv_date: currentData.invoiceDate,
          due_date: currentData.dueDate,
          amount: currentData.amountDue,
          memo: `Invoice from ${currentData.vendor?.name || ''}`,
          vendor: currentData.vendor,
          billTo: currentData.billTo,
          items: currentData.items
        }
      };
    } else {
      return { mode: 'new', invoiceData: null, extractedData: {} };
    }
  });

  // Icons
  faFileInvoice = faFileInvoice;
  faCalendar = faCalendar;
  faDollarSign = faDollarSign;
  faBuilding = faBuilding;
  faPhone = faPhone;
  faMapMarkerAlt = faMapMarkerAlt;
  faXmark = faXmark;
  faCopy = faCopy;

  ngOnInit(): void {
    if (this.invoiceData) {
      this.invoiceBillStateService.setInvoiceData(this.invoiceData);
    }
    this.checkScreenSize();

    effect(() => {
      const formData = this.invoiceBillStateService.billFormData();
      setTimeout(() => {
        this.syncFormDataToInvoice(formData);
      }, 0);
    });
  }

  constructor() {
    effect(() => {
      const invoiceData = this.currentInvoiceData();
      if (invoiceData) {
          this.getPdfUrl();
      }
    });
  }

  /**
   * Listen for window resize events to detect screen size changes
   */
  @HostListener('window:resize', ['$event'])
  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.checkScreenSize();
  }

  /**
   * Check if current screen size should use modal mode (1024px - 1440px)
   */
  private checkScreenSize(): void {
    const width = window.innerWidth;
    this.isModalMode = width >= 1024 && width <= 1440;
  }

  /**
   * @description Refresh modal data when form is shown
   */
  refreshModalData(): void {
    const currentData = this.currentInvoiceData();
    if (currentData) {
      this.invoiceBillStateService.setInvoiceData(currentData);
    }
  }

  /**
   * Split address into multiple lines for better display
   */
  getAddressLines(address: string): string[] {
    if (!address) return [];

    const lines = address
      .split(/[,\n\r]+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 1 && lines[0].length > 50) {
      const words = lines[0].split(' ');
      const result = [];
      let currentLine = '';

      for (const word of words) {
        if (
          currentLine.length + word.length + 1 > 50 &&
          currentLine.length > 0
        ) {
          result.push(currentLine.trim());
          currentLine = word;
        } else {
          currentLine += (currentLine ? ' ' : '') + word;
        }
      }

      if (currentLine.trim()) {
        result.push(currentLine.trim());
      }

      return result;
    }

    return lines;
  }

  /**
   * Sync form data changes to invoice data
   */
  private syncFormDataToInvoice(formData: IBillFormData): void {
    if (!formData || Object.keys(formData).length === 0) return;

    const currentInvoice = this.currentInvoiceData();
    if (currentInvoice) {
      const updatedInvoice = {
        ...currentInvoice,
        invoiceNumber: formData.invoiceNo || currentInvoice.invoiceNumber,
        invoiceDate: formData.invoiceDate || currentInvoice.invoiceDate,
        dueDate: formData.dueDate || currentInvoice.dueDate,
        amountDue: formData.amount || currentInvoice.amountDue,
        vendor: {
          ...currentInvoice.vendor,
          name: formData.payeeVendor || currentInvoice.vendor?.name
        },
        items: formData.items || currentInvoice.items
      };

      this.invoiceBillStateService.updateInvoiceData(updatedInvoice);
    }
  }

  /**
   * Show the form section - responsive behavior
   */
  showForm(): void {
    this.refreshModalData();
    if (this.isModalMode) {
      this.openAddBillModal();
      // Emit form opened event with modal mode info
      this.formOpened.emit({ isModalMode: true });
    } else {
      this.invoiceBillStateService.showForm();
      this.formOpened.emit({ isModalMode: false });
    }
  }

  /**
   * Open Add Bill Modal with pre-filled data
   */
  private openAddBillModal(): void {
    const currentData = this.currentInvoiceData();
    if (!currentData) return;

    const dialogRef = this.dialog.open(AddBillModalComponent, {
      maxWidth: '800px',
      width: '93%',
      maxHeight: '95%',
      disableClose: true,
      data: {
        mode: 'new',
        invoiceData: currentData,
        extractedData: {
          payee: currentData.vendor?.name || '',
          inv_no: currentData.invoiceNumber,
          inv_date: currentData.invoiceDate,
          due_date: currentData.dueDate,
          amount: currentData.amountDue,
          memo: `Invoice from ${currentData.vendor?.name || ''}`,
          vendor: currentData.vendor,
          billTo: currentData.billTo,
          items: currentData.items
        }
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.billSaved.emit(currentData);
      }
    });
    this.formOpened.emit();
  }

  /**
   * Hide the form section
   */
  hideForm(): void {
    this.invoiceBillStateService.hideForm();
    this.formClosed.emit();
  }

  /**
   * Handle bill saved event from modal
   */
  onBillSavedFromModal(billData: IBillFormData): void {
    this.invoiceBillStateService.updateBillFormData(billData);
    this.billSaved.emit(this.currentInvoiceData()!);
    this.hideForm();
  }

  /**
   * Handle bill updated event from modal
   */
  onBillUpdatedFromModal(billData: IBillFormData): void {
    this.invoiceBillStateService.updateBillFormData(billData);
    this.billUpdated.emit(this.currentInvoiceData()!);
  }

  /**
   * Handle real-time form value changes from modal
   */
  onFormValueChange(formData: IBillFormData): void {
    this.invoiceBillStateService.updateBillFormData(formData);
  }

  /**
   * Get PDF URL for failed extraction cases
   */
  getPdfUrl(): void {
    const invoiceData = this.currentInvoiceData();

    if (invoiceData?.attachments && invoiceData.attachments.length > 0) {
      const firstAttachment = invoiceData.attachments[0];
      const pdfUrl = firstAttachment.public_url || firstAttachment.fileUrl;

      if (pdfUrl) {
        // Reset loading state
        this.pdfLoaded = false;
        
        // Add parameters for seamless integration with white background
        const urlWithParams = pdfUrl.includes('#')
          ? `${pdfUrl}&toolbar=0&navpanes=0&scrollbar=0&view=FitH&zoom=100&pagemode=none&disableworker=true&statusbar=0&messages=0&background=white&bgcolor=white&fgcolor=black`
          : `${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH&zoom=100&pagemode=none&disableworker=true&statusbar=0&messages=0&background=white&bgcolor=white&fgcolor=black`;

        this.urlSafe =
          this.sanitizer.bypassSecurityTrustResourceUrl(urlWithParams);
      }
    }
  }

  /**
   * Validates whether a given string is a valid HTTP or HTTPS URL.Used to prevent security issue.
   * @param {string} url - The string to be validated as a URL.
   * @returns {boolean} - Returns `true` if the URL is valid and uses either the 'http' or 'https' protocol. Otherwise, returns `false`.
   */
  isValidUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch (_) {
      return false; // Invalid URL
    }
  }

  /**
   * Open PDF in new tab as fallback
   */
  openPdfInNewTab(): void {
    const invoiceData = this.currentInvoiceData();
    if (invoiceData?.attachments && invoiceData.attachments.length > 0) {
      const firstAttachment = invoiceData.attachments[0];
      const pdfUrl = firstAttachment.public_url || firstAttachment.fileUrl;
      if (pdfUrl) {
        window.open(pdfUrl, '_blank');
      }
    }
  }

  copyEmail(): void {
    const email = this.mappedEmail();
    if (email) {
      this.clipboard.copy(email);
      this.tooltip.set('Copied!');
      setTimeout(() => {
        this.tooltip.set('Copied!');
        this.tooltip.set('Copy');
      }, 2000);
    }
  }

  /**
   * Handle PDF load event
   */
  onPdfLoad(): void {
    this.pdfLoaded = true;
  }

}
