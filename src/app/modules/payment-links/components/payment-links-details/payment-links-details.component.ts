import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  signal
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowUpRightFromSquare,
  faArchive,
  faCircleCheck,
  faCopy,
  faCreditCard,
  faMoneyCheck,
  faSpinner,
  faShare,
  faDownload
} from '@fortawesome/pro-solid-svg-icons';
import { faCcVisa, faStripeS } from '@fortawesome/free-brands-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { SelectedPaymentLink } from 'src/app/modules/data-table/components/data-table/data-table.model';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import { Clipboard } from '@angular/cdk/clipboard';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { PaymentLinkService } from 'src/app/shared/service/payment-link/payment-link.service';
import { Subject, finalize, takeUntil } from 'rxjs';
import {
  IPaymentButtons,
  PaymentButtons
} from 'src/app/modules/payment-link/pages/payment-settings/paymentButtons.data';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { GetPaidMessageComponent } from 'src/app/modules/payment-link/modals/get-paid-message/get-paid-message.component';
import { PaymentLinksPreviewComponent } from '../payment-links-preview/payment-links-preview.component';
import { PaymentLinksMethods } from '../../models/payment-links.model';
import { PaymentLinksCustomLinksTableComponent } from '../payment-links-custom-links-table/payment-links-custom-links-table.component';
import { CodePreviewComponent } from '../code-preview/code-preview.component';
import { PaymentLinksService } from '../../services/payment-links.service';
import { SharePaymentLinkModalComponent } from '../../modals/share-payment-link-modal/share-payment-link-modal.component';

type PaymentMethodsList = {
  name: string;
  id: PaymentLinksMethods;
  icon?: IconDefinition;
  src?: string;
  color?: string;
};

@Component({
  selector: 'app-payment-links-details',
  standalone: true,
  imports: [
    FontAwesomeModule,
    CommonButtonV35Component,
    PaymentLinksPreviewComponent,
    MatTooltip,
    NgClass,
    PaymentLinksCustomLinksTableComponent,
    MatRadioGroup,
    MatRadioButton,
    ReactiveFormsModule,
    FormsModule,
    CodePreviewComponent,
    NgOptimizedImage
  ],
  templateUrl: './payment-links-details.component.html',
  styleUrl: './payment-links-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentLinksDetailsComponent implements OnDestroy {
  private clipBoard = inject(Clipboard);
  private paymentLinkApiService = inject(PaymentLinkService);
  private paymentLinksService = inject(PaymentLinksService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private alertService = inject(AlertService);
  public dialog = inject(MatDialog);

  selectedLink = input<SelectedPaymentLink | undefined>(undefined);
  loading = input(false);
  selectedLinkState = signal<SelectedPaymentLink | undefined>(undefined);

  faSpinner = faSpinner;
  faArrowUpRightFromSquare = faArrowUpRightFromSquare;
  faArchive = faArchive;
  faCopy = faCopy;
  faCircleCheck = faCircleCheck;
  faShare = faShare;
  faDownload = faDownload;

  // Loading states
  isTogglingActive = signal(false);
  isDuplicating = signal(false);
  isArchiving = signal(false);

  // QR Code URL computed from selected link using goqr.me API
  // This API supports CORS and allows image downloads
  qrCodeUrl = computed(() => {
    const link = this.selectedLink();
    if (!link?.link) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link.link)}`;
  });

  paymentButtonsObj = new PaymentButtons();
  destroy$ = new Subject<boolean>();
  eCButtonsV2: IPaymentButtons[] = [];
  selectedButton: IPaymentButtons['imageName'];
  selectedButtonDetails?: IPaymentButtons;

  dynamicIframeLinkLoading = false;
  dynamicIframeLink: { dynamicAmountLink: string; iframe: string } | undefined =
    undefined;

  urlCopied = signal(false);

  selectedListTab = computed(() => this.paymentLinksService.selectedListTab());

  tabs = [
    { name: 'Sub-Links', id: 'custom-link' },
    { name: 'Dynamic & Iframe Link', id: 'dynamic-link' },
    { name: 'E-Commerce Buttons', id: 'e-com-buttons' }
  ] as const;

  titles = {
    button:
      'Select the button on the right side to generate the code. When you copy and paste this code, a button will be displayed. Upon clicking it, a new window will open and the form will be displayed.',
    widget:
      'Select the button on the right side to generate the code. Once you copy and paste this code, a button will be displayed. Click it to open a modal inside your website.',
    snippet: 'Copy this code paste it in your website',
    iframe:
      'You can copy and paste this HTML code into your website to display this form'
  } as const;

  selectedTab: (typeof this.tabs)[number]['id'] = this.tabs[0].id;
  paymentMethodsList: PaymentMethodsList[] = [
    {
      name: 'PAY BY CHECK',
      id: 'CHECK',
      icon: faMoneyCheck,
      color: 'text-common-green-color'
    },
    {
      name: 'CREDIT CARD',
      id: 'CREDIT_CARD',
      icon: faCreditCard,
      color: 'text-common-yellow-color'
    },
    {
      name: 'DEBIT CARD',
      id: 'DEBIT_CARD',
      icon: faCcVisa as IconDefinition,
      color: 'text-common-violet-color'
    },
    {
      name: 'PAYPAL',
      id: 'PAYPAL',
      src: 'assets/images/payment-links/paypal.svg'
    },
    {
      name: 'BITPAY',
      id: 'BITPAY',
      src: 'assets/images/payment-links/bitpay.svg'
    },
    {
      name: 'STRIPE CHECKOUT',
      id: 'STRIPE',
      icon: faStripeS as IconDefinition,
      color: 'text-common-blue-color'
    }
  ];

  availableMethods = computed(() => {
    const data = this.selectedLink();
    if (!data) return undefined;

    return this.paymentMethodsList
      .map((el) => {
        if (el.id === 'CHECK') return el;

        if (data.bitpayCredentials && el.id === 'BITPAY') {
          return el;
        }
        if (data.paypalCredentials && el.id === 'PAYPAL') {
          return el;
        }
        if (data.stripeCredentials && el.id === 'DEBIT_CARD') {
          return el;
        }
        if (data.stripeCheckoutCredentials && el.id === 'STRIPE') {
          return el;
        }
        if (data.creditCardFormToken && el.id === 'CREDIT_CARD') {
          return el;
        }
        return undefined;
      })
      .filter(Boolean) as PaymentMethodsList[];
  });

  previewInput = computed(() => {
    const data = this.selectedLink();

    if (!data) return undefined;

    return {
      logo: data.logoUrl ?? undefined,
      companyName: data?.companyName || data.name,
      paymentMethods: this.setupPaymentMethods(data)
    };
  });

  constructor() {
    effect(() => {
      const link = this.selectedLink();
      if (!link) return;
      if (
        !!link.isArchived ||
        this.paymentLinksService.selectedListTab() === 'archived'
      )
        return;

      this.getDynamicAndIframeLink(link.id);
      this.getButtons(link.id);
    });
  }

  getButtons(id: string, amount?: string) {
    this.eCButtonsV2 = this.paymentButtonsObj.getV2Buttons({
      paymentId: id,
      amount
    });

    if (!this.selectedButton) {
      this.selectedButton = this.eCButtonsV2[0].imageName;
      this.selectedButtonDetails = this.eCButtonsV2[0];
    } else {
      const index = this.eCButtonsV2.findIndex(
        (val) => val.imageName === this.selectedButton
      );
      this.selectedButtonDetails = this.eCButtonsV2[index];
    }

    this.cdr.detectChanges();
  }

  getDynamicAndIframeLink(id: string) {
    this.dynamicIframeLinkLoading = true;
    this.cdr.detectChanges();
    this.paymentLinkApiService
      .getDandILink(id)
      .pipe(
        finalize(() => {
          this.dynamicIframeLinkLoading = false;
          this.cdr.detectChanges();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (!res.success) return;
        this.dynamicIframeLink = res.data;
        this.cdr.detectChanges();
      });
  }

  setupPaymentMethods(link: SelectedPaymentLink) {
    const availableValues = this.paymentMethodsList
      .map((el) => {
        if (el.id === 'CHECK') return el;

        if (link.bitpayCredentials && el.id === 'BITPAY') {
          return el;
        }
        if (link.paypalCredentials && el.id === 'PAYPAL') {
          return el;
        }
        if (link.stripeCredentials && el.id === 'DEBIT_CARD') {
          return el;
        }
        if (link.stripeCheckoutCredentials && el.id === 'STRIPE') {
          return el;
        }
        if (link.creditCardFormToken && el.id === 'CREDIT_CARD') {
          return el;
        }
        return undefined;
      })
      .filter(Boolean) as PaymentMethodsList[];

    return availableValues.map((el) => el.id);
  }

  openLink(url?: string) {
    if (!url) return;
    window.open(url, '_blank');
  }

  changeTab(item: (typeof this.tabs)[number]) {
    this.selectedTab = item.id;
  }

  copyLink(url?: string) {
    if (!url) return;
    this.clipBoard.copy(url);
    this.urlCopied.set(true);

    setTimeout(() => {
      this.urlCopied.set(false);
    }, 2000);
  }

  updateAmount(elm: HTMLInputElement, amount?: string) {
    // eslint-disable-next-line no-param-reassign
    elm.value = '';
    const id = this.selectedLink()?.id;
    if (!id) return;
    this.getButtons(id, amount);
  }

  updateLink() {
    const id = this.selectedLink()?.id;
    if (!id) return;
    this.router.navigate(['manage', 'payment-links', 'update', id]);
  }

  selectButton(val: IPaymentButtons) {
    this.selectedButton = val.imageName;
    this.selectedButtonDetails = val;
    this.cdr.detectChanges();
  }

  openMessage() {
    const modal = this.dialog.open(GetPaidMessageComponent, {
      maxWidth: '1200px',
      width: '90%',
      autoFocus: false
    });
    modal.afterClosed().subscribe((res) => {
      if (res) {
        this.alertService.successAlert({
          content: 'Message updated successfully',
          close: true
        });
      }
    });
  }

  openEPaymentSettings() {
    this.router.navigateByUrl('manage/payment-links/payment-settings');
  }

  /**
   * Toggle the active status of the payment link
   */
  toggleActiveStatus(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const link = this.selectedLink();
    if (!link?.id) return;

    // Revert the native checkbox's immediate visual flip; it will only
    // reflect the new state once the confirmation is accepted and the
    // API call succeeds (via the updated selectedLink() binding).
    checkbox.checked = link.isPaused !== 1;

    const confirmation = this.alertService.warningAlert({
      title: link.isPaused ? 'Activate Payment Link' : 'Deactivate Payment Link',
      content: link.isPaused
        ? 'Are you sure you want to activate this payment link?'
        : 'Are you sure you want to deactivate this payment link?',
      doneMsg: link.isPaused ? 'Yes, Activate' : 'Yes, Deactivate',
      cancelMsg: 'Cancel',
      isCancel: true
    });

    confirmation
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirm) => {
        if (!confirm) return;

        this.isTogglingActive.set(true);
        const apiCall = link.isPaused
          ? this.paymentLinkApiService.activePaymentLink(link.id)
          : this.paymentLinkApiService.inactivePaymentLink(link.id);

        apiCall
          .pipe(
            finalize(() => {
              this.isTogglingActive.set(false);
              this.cdr.detectChanges();
            }),
            takeUntil(this.destroy$)
          )
          .subscribe((res) => {
            if (res.success) {
              this.alertService.successAlert({
                content: link.isPaused
                  ? 'Payment link activated successfully'
                  : 'Payment link deactivated successfully',
                close: true
              });
              this.paymentLinksService.linkUpdated.next(
                link.isPaused === 1 ? 1 : 0
              );
            }
          });
      });
  }

  /**
   * Duplicate the payment link
   */
  duplicateLink() {
    const id = this.selectedLink()?.id;
    if (!id) return;
    this.router.navigate(['manage', 'payment-links', 'update', id], {
      queryParams: {
        isDuplicate: true
      }
    });
  }

  archiveLink() {
    const link = this.selectedLink();
    if (
      !link?.id ||
      link.isArchived ||
      this.paymentLinksService.selectedListTab() === 'archived'
    ) return;

    const confirmation = this.alertService.confirmAlert({
      content: 'Are you sure you want to archive this link?',
      doneMsg: 'Yes'
    });

    confirmation
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirm) => {
        if (confirm) {
          this.isArchiving.set(true);
          this.cdr.detectChanges();
          this.paymentLinkApiService
            .deletePaymentLinkMain(link.id)
            .pipe(
              finalize(() => {
                this.isArchiving.set(false);
                this.cdr.detectChanges();
              }),
              takeUntil(this.destroy$)
            )
            .subscribe((res) => {
              if (!res.success) return;
              this.alertService.successAlert({ content: res.data });
              this.paymentLinksService.linkDeleted.next(link.id);
            });
        }
      });
  }

  /**
   * Open the share modal with social media options
   */
  shareLink() {
    const link = this.selectedLink();
    if (!link?.link) return;

    this.dialog.open(SharePaymentLinkModalComponent, {
      maxWidth: '450px',
      width: '95%',
      autoFocus: false,
      data: {
        link: link.link,
        name: link.name || 'Payment Link',
        qrCodeUrl: this.qrCodeUrl()
      }
    });
  }

  /**
   * Download the QR code as an image
   * Uses the QR Server API which supports CORS
   */
  downloadQrCode() {
    const link = this.selectedLink();
    if (!link?.link) return;

    // Use QR Server API with download format parameter
    const downloadUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=png&data=${encodeURIComponent(link.link)}`;

    fetch(downloadUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch QR code');
        }
        return response.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payment-link-qr-${link.name || 'code'}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.alertService.successAlert({
          content: 'QR code downloaded successfully',
          close: true
        });
      })
      .catch(() => {
        this.alertService.warningAlert({
          title: 'Error',
          content: 'Failed to download QR code. Please try again.',
          isCancel: false,
          doneMsg: 'OK'
        });
      });
  }

  /**
   * Handle QR code image load error
   */
  onQrCodeError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  restorePaymentLink() {
    const id = this.selectedLink()?.id;
    if (!id) return;
    this.alertService
      .confirmAlert({ 
        content: 'Are you sure you want to restore this link?',
        doneMsg: 'Yes'
      })
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmation) => {
        if (!confirmation) return;
        this.paymentLinkApiService
          .restorePaymentLink(id)
          .pipe(takeUntil(this.destroy$))
          .subscribe((res) => {
            if (!res.success) return;
            this.alertService.successAlert({
              content: 'Payment link restored successfully',
              close: true
            });
            this.paymentLinksService.selectedListTab.set('active');
            this.cdr.detectChanges();
            this.paymentLinksService.linkRestored.next(id);
          });
      });
  }


  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
