import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import {
  IRefillCoupon,
  IUserEarningData
} from 'src/app/modules/more/model/affiliate';
import { RequestToPayoutModalComponent } from 'src/app/modules/more/modals/request-to-payout-modal/request-to-payout-modal.component';
import { AffiliateProgramsService } from 'src/app/shared/service/affiliate-programs/affiliate-programs.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { ScriptService } from 'src/app/core/services/script.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

import {
  faPenLine,
  faSave,
  faCopy,
  faPaperPlane,
  faEdit
} from '@fortawesome/pro-solid-svg-icons';
import {
  NgClass,
  CurrencyPipe,
  NgStyle,
  NgOptimizedImage
} from '@angular/common';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import {
  faCircleCheck,
  faCircleDollar,
  faCircleInfo,
  faClockThree,
  faShareFromSquare,
  faShareNodes,
  faUserPlus
} from '@fortawesome/pro-regular-svg-icons';
import { Chart, registerables } from 'chart.js';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';
import { CommonButtonV35Component } from '../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { ShareReferralLinkComponent } from '../../modals/share-referral-link/share-referral-link.component';
import { ReferAndEarnCommissionModalComponent } from '../refer-and-earn-commission-modal/refer-and-earn-commission-modal.component';
import { ReferAndEarnMlmModalComponent } from '../refer-and-earn-mlm-modal/refer-and-earn-mlm-modal.component';
import { AffilateTermsAndConditionComponent } from '../../modals/affilate-terms-and-condition/affilate-terms-and-condition.component';

Chart.register(...registerables);

/**
 * Component for displaying and managing affiliate referral links.
 */
@Component({
  selector: 'app-affiliate-pap-my-link',
  templateUrl: './affiliate-pap-my-link.component.html',
  styleUrls: ['./affiliate-pap-my-link.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    CommonButtonV35Component,
    FormsModule,
    ReactiveFormsModule,
    FaIconComponent,
    ControlMessageComponent,
    CurrencyPipe,
    NgStyle,
    MatTooltipModule,
    MatTooltip,
    NgOptimizedImage
  ]
})
export class AffiliatePapMyLinkComponent implements OnInit, OnDestroy {
  // graph data for initaila load

  /**
   * Input for affiliate earnings data.
   */
  @Input() earningData: IUserEarningData;

  /**
   * Input for loading indicator status.
   */
  @Input() loading: boolean;

  @ViewChild('tooltip') tooltip: MatTooltip;
  @ViewChild('inputField') inputField: ElementRef;

  private affiliateService = inject(AffiliateProgramsService);
  private alertService = inject(AlertService);
  private matDialog = inject(MatDialog);
  private scriptService = inject(ScriptService);
  private earningsChart: Chart | null = null;

  /**
   * Array to hold active subscriptions.
   */
  subscriptions: Subscription[] = [];

  /**
   * Loading indicator for URL.
   */
  urlLoading = false;

  faPenLine = faPenLine;
  faSave = faSave;
  faEdit = faEdit;
  faCopy = faCopy;
  faPaperPlane = faPaperPlane;
  faShare = faShareFromSquare;
  faCicleInfo = faCircleInfo;
  faShareNode = faShareNodes;
  faCircleDollar = faCircleDollar;
  faCircleCheck = faCircleCheck;
  faClockThree = faClockThree;
  faUserPlus = faUserPlus;

  /**
   * Loading indicator for slug change.
   */
  slugLoading = false;

  /**
   * Form group for referral link management.
   */
  referralForm: FormGroup;

  /**
   * Current slug value.
   */
  currentSlug = '';

  /**
   * Base URL for the referral link.
   */
  baseUrl = '';

  isLoading = false;
  sliderValue = 0;
  sliderValuePosition = 10; // Initial position
  validator = false;
  couponList = signal<IRefillCoupon[]>([]);
  isChangeStatus = signal(false);
  affilateCode: string;
  couponAmount: string = '';
  earnigsDataYear: string = '';

  private chartData = {
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    values: [0, 0, 0, 0, 0, 0]
  };

  multiLevelCommissionData=[
    {
      percent:'50%',
      description:"Of the referred person's first-month fees"
    },
    {
      percent:'5%',
      description:"Of first 12 monthly fees"
    },
    {
      percent:'2%',
      description:"Of credit card fee, equals 5.9 bps"
    }
  ];

  /**
   * Initializes the component and retrieves initial data.
   */
  ngOnInit(): void {
    this.getChartData();
    this.addSocialScript();
    this.getAffiliateCode();
    this.initForm();
    // this.updateSliderBackground(this.sliderValue);
    this.focusInputField();
  }

  /**
   * Initializes the referral link management form.
   */
  initForm() {
    this.referralForm = new FormGroup({
      referralLink: new FormControl('', [
        Validators.required,
        Validators.minLength(4),
        Validators.maxLength(10)
      ])
    });
    this.referralForm.controls.referralLink.disable();
  }

  /**
   * Retreiving Chart Data for earnings.
   */
  getChartData() {
    this.affiliateService.getchartData().subscribe({
      next: (res) => {
        if (res.success) {
          this.chartData.months = [];
          this.chartData.values = [];
          this.earnigsDataYear = res.data.year;
          res.data.monthly_earnings_chart.forEach((item) => {
            this.chartData.months.push(item.month);
            this.chartData.values.push(item.value);
          });
        }
        this.initEarningsChart();
      },
      error: (err) => {}
    });
  }

  /**
   * Enables editing of the referral link.
   */
  onEdit() {
    this.referralForm.controls.referralLink.enable();
    const input = document.getElementById('link');

    if (input) {
      input.focus();
    }
  }

  /**
   * Saves the changes to the referral link.
   */
  onSave() {
    if (this.currentSlug === this.referralForm.controls.referralLink.value) {
      this.referralForm.controls.referralLink.disable();
      return;
    }
    this.referralForm.markAllAsTouched();
    if (this.referralForm.invalid) return;
    this.changeSlug(this.referralForm.controls.referralLink.value);
  }

  /**
   * Changes the affiliate slug.
   *
   * @param affiliateCode - The new affiliate slug to set.
   */
  changeSlug(affiliateCode: string) {
    this.slugLoading = true;
    this.subscriptions.push(
      this.affiliateService
        .changeSlug(affiliateCode)
        .pipe(
          finalize(() => {
            this.slugLoading = false;
          })
        )
        .subscribe({
          next: (res) => {
            this.alertService.successAlert({ content: res.data });
            this.currentSlug = this.referralForm.controls.referralLink.value;
            this.referralForm.controls.referralLink.disable();
          },
          error: () => {
            this.referralForm.controls.referralLink.setValue(this.currentSlug);
            this.referralForm.controls.referralLink.disable();
          }
        })
    );
  }

  /**
   * Method for copying referral link
   */
  shareLink() {
    this.matDialog.open(ShareReferralLinkComponent, {
      maxWidth: '500px',
      width: '93%',
      data: {
        link: this.baseUrl + this.referralForm.controls.referralLink.value
      },
      disableClose: true
    });
  }

  /**
   * Retrieves the affiliate code and base URL for the referral link.
   */
  getAffiliateCode() {
    this.urlLoading = true;
    this.subscriptions.push(
      this.affiliateService
        .getReferLink()
        .pipe(
          finalize(() => {
            this.getRefilCouponDetails(true);
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.referralForm.controls.referralLink.setValue(
                res.data.affiliate_code
              );
              this.affilateCode = res.data.affiliate_code;
              this.baseUrl = res.data.affiliate_link_base_url;
            }
          }
        })
    );
  }

  /**
   * Opens the request to payout modal dialog.
   */
  onWithdraw() {
    this.matDialog.open(RequestToPayoutModalComponent);
  }

  /**
   * Adds the AddThis social sharing script if not already added to the DOM.
   */
  addSocialScript() {
    if (!document.getElementById('addthis_social')) {
      const src =
        'https://s7.addthis.com/js/300/addthis_widget.js#pubid=ra-5b79fd595dfa1c2d';
      this.scriptService.addScript('', 'addthis_social', src);
    }
  }

  getRefilCouponDetails(initialLoad?: boolean): void {
    this.subscriptions.push(
      this.affiliateService
        .getRfilCoupon()
        .pipe(
          finalize(() => {
            if (initialLoad) {
              this.urlLoading = false;
            }
          })
        )
        .subscribe({
          next: (res) => {
            if (res.data) {
              this.couponList.set(res.data);
              if (res.data?.length > 0) {
                this.currentSlug = '';
              } else {
                this.currentSlug = this.affilateCode;
              }
            }
          }
        })
    );
  }

  updateCouponCode(): void {
    if (!this.currentSlug) {
      this.alertService.infoAlert({
        content: 'To generate your coupon code, please enter a unique code.'
      });
      return;
    }
    const couponAmount = parseFloat(this.couponAmount);
    if (couponAmount < 0 || couponAmount > 1000) {
      this.alertService.infoAlert({
        content: 'The credit amount must be between $00.00 and $1000.00'
      });
      return;
    }

    this.isLoading = true;
    this.subscriptions.push(
      this.affiliateService
        .updateRefilCoupon({
          amount: couponAmount,
          coupon_code: this.currentSlug
        })
        .pipe(
          finalize(() => {
            this.isLoading = false;
            this.couponAmount = '';
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.getRefilCouponDetails();
              this.alertService.successAlert({ content: res.message });
            }
          }
        })
    );
  }

  updateSliderValue(event: Event): void {
    const inputValue = event.target as HTMLInputElement;
    this.validator =
      Number(inputValue.value) < 0 || Number(inputValue.value) > 1000;
    this.sliderValue = Number(inputValue.value);

    if (inputValue.value === '') {
      this.sliderValue = 1;
    }

    this.updateSliderBackground(this.sliderValue);
    this.updateSliderValuePosition(this.sliderValue);
    this.focusInputField();
  }

  updateSliderValuePosition(value: number): void {
    const min = 0;
    const max = 1000;
    const range = max - min;
    const percentage = ((value - min) / range) * 100;
    this.sliderValuePosition = percentage;
  }

  updateSliderBackground(value: number): void {
    const min = 0;
    const max = 1000;
    const percentage = ((value - min) / (max - min)) * 100;
    const slider = document.querySelector('.slider') as HTMLElement;
    slider.style.background = `linear-gradient(to right, var(--common-blue-color) 0%, var(--common-blue-color) ${percentage}%, #fff ${percentage}%, #fff 100%)`;
    const showTickMark = document.querySelector(
      '.slider-value-box'
    ) as HTMLElement;
    showTickMark.style.left = `${percentage}%`;
  }

  /**
   * Copies the current slug to the clipboard and displays a tooltip.
   */
  copyCoupon() {
    if (this.currentSlug) {
      const currentLink = this.baseUrl + this.currentSlug;
      navigator.clipboard
        .writeText(currentLink as string)
        .then(() => {
          this.tooltip.message = 'Copied!';
          this.tooltip.show();
          setTimeout(() => {
            this.tooltip.message = 'Copy Link';
            this.tooltip.hide();
          }, 2000);
        })
        .catch(() => {});
    } else {
      const defaultUrl =
        this.baseUrl + this.referralForm.controls.referralLink.value;
      navigator.clipboard.writeText(defaultUrl as string).then(() => {
        this.tooltip.message = 'Copied!';
        this.tooltip.show();
        setTimeout(() => {
          this.tooltip.message = 'Copy Link';
          this.tooltip.hide();
        }, 2000);
      });
    }
  }

  toggleStatus(id: string, status: number) {
    if (this.isChangeStatus()) return;
    const statusAlert = this.alertService.confirmAlert({
      content:
        status === 1
          ? 'Are you sure you want to make this coupon inactive?'
          : 'Are you sure you want to make this coupon active?',
      doneMsg: 'Yes',
      cancelMsg: 'No'
    });
    statusAlert.afterClosed().subscribe((response) => {
      if (response) {
        this.isChangeStatus.set(true);
        const payload = {
          uu_id: id,
          status: status === 1 ? 0 : 1
        };
        this.subscriptions.push(
          this.affiliateService
            .changeCouponStatus(payload)
            .pipe(
              finalize(() => {
                this.isChangeStatus.set(false);
              })
            )
            .subscribe((res) => {
              if (res.success) {
                this.alertService.successAlert({ content: res.message });
                // Update the status in the couponList signal
                this.couponList.update((coupons) =>
                  coupons.map((coupon) =>
                    coupon.uu_id === id
                      ? { ...coupon, status: payload.status }
                      : coupon
                  )
                );
              }
            })
        );
      }
    });
  }

  referAndEarnCommissionDetails() {
    this.matDialog.open(ReferAndEarnCommissionModalComponent, {
      width: '800px',
      disableClose: true,
      panelClass: 'paddingless-modal'
    });
  }

  mlmDetails() {
    this.matDialog.open(ReferAndEarnMlmModalComponent, {
      width: '600px',
      disableClose: true,
      panelClass: 'paddingless-modal'
    });
  }

  openTermsAndCondition() {
    this.matDialog.open(AffilateTermsAndConditionComponent, {
      width: '500px',
      panelClass: 'paddingless-modal'
    });
  }

  validateNumberInput(event: KeyboardEvent, maxLength: number): boolean {
    this.focusInputField();
    const current: string = this.sliderValue.toString();
    if (current.length >= maxLength) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  focusInputField() {
    setTimeout(() => {
      this.inputField.nativeElement.focus();
    });
  }

  private initEarningsChart() {
    const canvas = document.getElementById(
      'earningsChart'
    ) as HTMLCanvasElement;
    if (!canvas) return;

    // Create gradient
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(116, 119, 231, 0.4)');
    gradient.addColorStop(1, 'rgba(116, 119, 231, 0.0)');

    this.earningsChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: this.chartData.months,
        datasets: [
          {
            label: 'Total Earnings',
            data: this.chartData.values,
            borderColor: 'rgba(116, 119, 231, 1)',
            backgroundColor: gradient,
            tension: 0.4,
            fill: true,
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointBackgroundColor: 'rgba(116, 119, 231, 1)',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(116, 119, 231, 1)',
            pointHoverBorderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            titleColor: '#333',
            bodyColor: '#333',
            bodyFont: {
              size: 14,
              weight: 'bold'
            },
            padding: 10,
            borderColor: '#ddd',
            borderWidth: 1,
            displayColors: false,
            callbacks: {
              label(context) {
                return `$${context.parsed.y}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: true,
              color: 'rgba(200, 200, 200, 0.15)'
            },
            ticks: {
              color: '#999',
              font: {
                size: 12
              }
            },
            border: {
              display: false
            }
          },
          y: {
            beginAtZero: true,
            border: {
              display: false
            },
            grid: {
              color: 'rgba(200, 200, 200, 0.25)'
            },
            ticks: {
              color: '#999',
              font: {
                size: 12
              },
              callback(value) {
                return value.toLocaleString();
              },
              stepSize: 200
            }
          }
        }
      }
    });
  }

  /**
   * Unsubscribes from active subscriptions on component destruction.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
    if (this.earningsChart) {
      this.earningsChart.destroy();
    }
  }
}
