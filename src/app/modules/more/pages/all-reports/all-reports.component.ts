import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription, finalize } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { TReportIds } from 'src/app/modules/more/model/all-reports';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { ReportsService } from 'src/app/shared/service/all-reports/reports.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';
import { PayeeReportModalComponent } from '../../modals/payee-report-modal/payee-report-modal.component';
import { FormNecReportModalComponent } from '../../modals/form-nec-report-modal/form-nec-report-modal.component';
import { CommonReportModalComponent } from '../../modals/common-report-modal/common-report-modal.component';
import { SearchFilterPipe } from '../../../../pipes/search-filter.pipe';
import { customReportLsit, reportList } from './reports-list.data';
import { PaymentReportModalComponent } from '../../modals/payment-report-modal/payment-report-modal.component';

/**
 * Angular component representing the All Reports page.
 * @class
 */
@Component({
  selector: 'app-all-reports',
  templateUrl: './all-reports.component.html',
  styleUrls: ['./all-reports.component.scss'],
  standalone: true,
  imports: [FormsModule,SearchFilterPipe,NgOptimizedImage]
})
export class AllReportsComponent implements OnInit, OnDestroy {

  /**
   * @param {MatDialog} dialog - The Angular Material MatDialog for opening modals.
   * @param {HeaderService} headerService - The service for header data.
   * @param {Router} router
   * @param {UserService} userService
   * @param {AlertService} alertService -The alert service
   */

  private dialog = inject(MatDialog);
  private headerService = inject(HeaderService);
  private reportsService = inject(ReportsService);
  private alertService = inject(AlertService);
  private route = inject(Router);

  /**
   * An array of subscriptions to manage subscriptions.
   * @type {Subscription[]}
   */
  subscription: Subscription[] = [];
  isLoading = true;
  isViewPayeeDisabled = false;
  reportItems = reportList;
  customReport = customReportLsit;
  /**
   * Search input for filtering reports.
   * @type {string}
   */
  searchInput = '';
  
  ngOnInit(): void {
    this.loadedHeaderDataAndProcess();
    this.checkPermission();
  }

  /**
   * Method to check permission for view report
   */
  checkPermission(){
    this.subscription.push(
      this.reportsService.getReportPermission()
      .pipe(finalize(() => { this.isLoading = false;})).subscribe((res) => {
        if(res){
          if(res.payee_view_permission === 0){
              this.isViewPayeeDisabled = true;
          }
        }
        this.isLoading = false;
      })
    );
  }

  /**
   * Loads header data and processes custom reports based on legal status.
   * @method
   */
  loadedHeaderDataAndProcess() {
    const headerSubscription = this.headerService._headerData.subscribe(
      (headerData) => {
        if (headerData && headerData.personalInfo?.isLegalEnabled === '1') {
          this.addCustomReportsToList();
          headerSubscription.unsubscribe();
        }
      }
    );
  }

  /**
   * Adds custom reports to the list based on legal status.
   * @method
   */
  addCustomReportsToList() {
    this.customReport.forEach((newReport) => {
      const existingReport = this.reportItems.find(
        (report) => report.id === newReport.id
      );

      if (!existingReport) {
        this.reportItems.push(newReport);
      }
    });
  }

  /**
   * Retrieves and opens the selected report modal.
   * @method
   * @param {TReportIds} id - The ID of the selected report.
   */
  getReport(id: TReportIds): void {
    switch (id) {
      case 'payee-report':
        this.openPayeeReportModal();
        break;
      case 'nec':
        this.openNECFormModal();
        break;
      case 'check-register-report':
        this.openCheckRegisterReportModal();
        break;
      case 'job-processing-summary':
        this.openJobProcesingSummaryModal();
        break;
      case 'user-summary-report':
        this.openUserSummaryReportModal();
        break;
      case 'void-report':
        this.onNavigateCheckHistoryPage('void');
        break;
      case 'delete-report':
        this.onNavigateCheckHistoryPage('delete');
        break;
      case 'payment':
        this.openPaymentReportModal();
        break;
      default:
        break;
    }
  }

  /**
   * Opens the Payee Report modal.
   * @method
   */
  openPayeeReportModal(): void {
    if(this.isViewPayeeDisabled){
      this.alertService.warningAlert({content:`You don't have permission to view payee. Please contact the company owner.`});
      return;
    }
    this.dialog.open(PayeeReportModalComponent, {
      width: '600px',
      disableClose: true
    });
  }

  /**
   * Opens the Check Register Report modal.
   * @method
   */
  openCheckRegisterReportModal() {
    this.dialog.open(CommonReportModalComponent, {
      width: '600px',
      disableClose: true,
      data: { reportId: 'check-register-report' }
    });
  }

  /**
   * Opens the Job Processing Summary modal.
   * @method
   */
  openJobProcesingSummaryModal() {
    this.dialog.open(CommonReportModalComponent, {
      width: '600px',
      disableClose: true,
      data: { reportId: 'job-processing-summary' }
    });
  }

  /**
   * Opens the User Summary Report modal.
   * @method
   */
  openUserSummaryReportModal() {
    this.dialog.open(CommonReportModalComponent, {
      width: '600px',
      disableClose: true,
      data: { reportId: 'user-summary-report' }
    });
  }

  /**
   * Opens the Form 1099-NEC Report modal.
   * @method
   */
  openNECFormModal(): void {
    if(this.isViewPayeeDisabled){
      this.alertService.warningAlert({content:`You don't have permission to view payee. Please contact the company owner.`});
      return;
    }
    this.dialog.open(FormNecReportModalComponent, {
      minWidth: '25%',
      maxHeight: '60%',
      disableClose: true
    });
  }

  onNavigateCheckHistoryPage(type:'void'|'delete'): void{
    this.route.navigateByUrl(`/manage/more/report/${type}`);
  }
  
  openPaymentReportModal(): void {
    this.dialog.open(PaymentReportModalComponent, {
      width: '550px',
      disableClose: true
    });
  }

  /**
   * Angular lifecycle hook called when the component is destroyed.
   * Unsubscribes from all subscriptions to prevent memory leaks.
   * @method
   */
  ngOnDestroy(): void {
    this.subscription.forEach((el) => {
      el?.unsubscribe();
    });
  }
}
