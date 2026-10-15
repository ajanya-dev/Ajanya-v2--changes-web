import { AlertService } from 'src/app/shared/service/alert/alert.service';
import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { ActivatedRoute, Data, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AdpService } from 'src/app/shared/service/integration/adp.service';
import { IADPPayrollComponentConfig } from 'src/app/modules/integration/model/integration';
import { MatDialog } from '@angular/material/dialog';
import { ViewAuditTrailModalComponent } from 'src/app/shared/modal/common-modal/view-audit-trail-modal/view-audit-trail-modal.component';
import { MatTooltip } from '@angular/material/tooltip';
import { OcwBackButtonComponent } from '../../../../../shared/components/ocw-back-button/ocw-back-button.component';
import { NgIf, NgFor, NgClass } from '@angular/common';

/**
 * Represents a payroll item.
 */
interface IPayrollItem {
  eventName?: string;
  id: string;
  payData?: string;
  payrollAmount?: string;
  payrollQuarter?: string;
  payrollRunNumber?: string;
  payrollWeekNumber?: string;
  payrollYear?: string;
  processingAmount: number;
  processedAmount?: number;
  status?: string;
  unlocked: number;
}

/**
 * Component responsible for managing ADP Payroll.
 */
@Component({
  selector: 'app-adp-payroll',
  templateUrl: './adp-payroll.component.html',
  styleUrls: ['./adp-payroll.component.scss'],
  standalone: true,
  imports: [NgIf, OcwBackButtonComponent, NgFor, NgClass, MatTooltip]
})
export class AdpPayrollComponent implements OnInit, OnDestroy, OnChanges {
  /**
   * Input configuration for ADP Payroll component.
   */
  @Input() config: IADPPayrollComponentConfig = {
    hideBack: false,
    companyId: undefined,
    isSubComponent: false
  };

  /**
   * Array to store subscriptions.
   */
  subscriptions: Subscription[] = [];

  /**
   * List of payroll items.
   */
  payrollList: IPayrollItem[];

  /**
   * Company ID.
   */
  companyId = '';

  /**
   * Company name.
   */
  companyName: string | undefined;

  /**
   * Credit card processing fee.
   */
  creditcardProcessingFee = 2.95;

  /**
   * Selected payroll item.
   */
  selectedItem: IPayrollItem;

  /**
   * Cash required amount.
   */
  CashRequirdAmount: number;

  /**
   * Constructor for AdpPayrollComponent.
   *
   * @param adpService - Service for ADP integration.
   * @param activatedRoute - Service to access route parameters.
   * @param alert - Service for displaying alerts.
   * @param router - Angular router service.
   * @param matDialog - Material Dialog service.
   */
  constructor(
    private adpService: AdpService,
    private activatedRoute: ActivatedRoute,
    private alert: AlertService,
    private router: Router,
    private matDialog: MatDialog
  ) {}

  /**
   * Initialization method called when the component is created.
   */
  ngOnInit(): void {
    this.initiateParams();
  }

  /**
   * Initialize component parameters based on route parameters.
   */
  initiateParams() {
    if (!this.config.isSubComponent) {
      this.subscriptions.push(
        this.activatedRoute.params.subscribe((res: Data) => {
          this.companyId = res?.id;
          this.companyName = res?.name;
          this.getPayrollList();
        })
      );
    }
  }

  /**
   * Handle changes to input properties.
   *
   * @param changes - Object containing changed properties.
   */
  ngOnChanges(changes: SimpleChanges) {
    if (changes.config && this.config.companyId) {
      this.companyId = this.config.companyId;
      this.companyName = this.config.companyName;
      this.getPayrollList();
    }
  }

  /**
   * Calculate the cash required amount for a payroll item.
   *
   * @param item - The payroll item.
   * @returns The calculated cash required amount.
   */
  payrollValues(item: IPayrollItem) {
    this.CashRequirdAmount =
      Number(item?.processingAmount) +
      Number((item?.processingAmount * this.creditcardProcessingFee) / 100);
    return this.CashRequirdAmount;
  }

  /**
   * Remove loaded skeleton elements.
   */
  removeLoadedSkelton() {
    const main_common_module: NodeListOf<HTMLElement> =
      document.querySelectorAll('.main_common_module .skelton')!;
    main_common_module.forEach((item) => item.classList.remove('skelton'));
  }

  /**
   * Trigger synchronization of payroll data.
   */
  syncNow() {
    this.subscriptions.push(
      this.adpService.syncPayrollData(this.companyId).subscribe((res) => {
        if (res.success) {
          this.alert.successAlert({ content: 'Successfully Synced' });
          this.getPayrollList();
        }
      })
    );
  }

  /**
   * Retrieve the list of payroll items.
   */
  getPayrollList() {
    this.subscriptions.push(
      this.adpService.getAdpPayroll(this.companyId).subscribe((res) => {
        if (res.success) {
          this.removeLoadedSkelton();
          this.payrollList = [];
          res.data.forEach((element: { [key: string]: any }) => {
            this.payrollList.push({
              eventName: element?.eventName,
              id: element?.id,
              payData: element?.payData,
              payrollAmount: element?.payrollAmount,
              payrollQuarter: element?.payrollQuarter,
              payrollRunNumber: element?.payrollRunNumber,
              payrollWeekNumber: element?.payrollWeekNumber,
              payrollYear: element?.payrollYear,
              processingAmount:
                element.status == 0 || element.status == 11
                  ? element?.payrollAmount
                  : element?.processedAmount,
              status: element.status,
              unlocked: element.unlocked
            });
          });
          this.setItemToProcess();
        }
      })
    );
  }

  /**
   * Set the selected item to process.
   */
  setItemToProcess() {
    for (const item of this.payrollList) {
      if (item.status == '0') {
        this.selectedItem = item;
        break;
      }
    }
  }

  /**
   * Set the processing amount for a payroll item.
   * @param item - The payroll item.
   * @param processAmount - The processing amount.
   */
  setProcessingAmount(item: IPayrollItem, processAmount: number) {
    item.processingAmount = processAmount;
  }

  /**
   * Process a payroll item.
   * @param item - The payroll item to process.
   */
  processPayroll(item: IPayrollItem) {
    const dRef = this.alert.confirmAlert({
      content: `You are processing payroll of $${item.processingAmount}, Please confirm`,
      doneMsg: 'Yes'
    });
    this.subscriptions.push(
      dRef.afterClosed().subscribe((res) => {
        if (res) {
          const sendingData = {
            payrollId: item.id,
            amount: item.payrollAmount!,
            processingAmount: String(item.processingAmount!)
          };
          this.subscriptions.push(
            this.adpService
              .processPayroll(this.companyId, sendingData)
              .subscribe(
                (res) => {
                  if (res.success) {
                    this.alert.successAlert({
                      title: 'Success',
                      content: res.message,
                      close: false
                    });
                    this.goToTransactions();
                  }
                },
                (err) => {
                  if (err.error.errorCode == 630) {
                    this.alert.warningAlert({
                      title: 'Card Declined!',
                      content:
                        "<span style='color:red'>Your card issuer declined your card</span>. Call them or add a new business credit card.<span style='color:red'> Payroll amount selected is not processed.</span>",
                      close: false
                    });
                  }
                }
              )
          );
        }
      })
    );
  }

  /**
   * Get the CSS class for the payroll code based on its status.
   * @param status - The status of the payroll item.
   */
  getPayrollCodeClass(status: number): string {
    switch (status) {
      case 3:
      case 11:
        return 'red-payrollcode';
      case 2:
        return 'green-payrollcode';
      default:
        return '';
    }
  }

  /**
   * Open the audit trail for a payroll item.
   *
   * @param id - The ID of the payroll item.
   */
  openAudit(id: string): void {
    this.matDialog.open(ViewAuditTrailModalComponent, {
      maxWidth: '800px',
      width: '93%',
      data: {
        heading: 'ADP Payroll',
        slug: 'integrations/adp/events',
        id: id,
        hideColumns: ['userName']
      }
    });
  }

  /**
   * Navigate to the payroll transactions page.
   */
  goToTransactions() {
    this.router.navigate(['manage/thirdparty_app/adp/payroll-transactions']);
  }

  /**
   * Destroy component and unsubscribe from subscriptions.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
  }
}
