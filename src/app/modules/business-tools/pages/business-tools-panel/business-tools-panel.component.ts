import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { BusinessToolsService } from 'src/app/shared/service/business-tools/business-tools.service';
import { IBusinessTools } from 'src/app/modules/business-tools/model/business-tools';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { ProcessCardService } from 'src/app/shared/service/provess-card/process-card.service';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { FormsModule } from '@angular/forms';
import { NgClass, JsonPipe } from '@angular/common';
import { ThemeService } from '../../../../shared/service/theme/theme.service';
import { SearchFilterPipe } from '../../../../pipes/search-filter.pipe';
import { CommonOnInitService } from 'src/app/shared/service/common-onInit/common-on-init.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';

@Component({
  selector: 'app-business-tools-panel',
  templateUrl: './business-tools-panel.component.html',
  styleUrls: ['./business-tools-panel.component.scss'],
  standalone: true,
  imports: [NgClass, FormsModule, JsonPipe, SearchFilterPipe]
})
export class BusinessToolsPanelComponent implements OnInit, OnDestroy {
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  public businessToolsService = inject(BusinessToolsService);
  private router = inject(Router);
  private themeService = inject(ThemeService);
  private alert = inject(AlertService);
  private processCardService = inject(ProcessCardService);
  public gettingStartedService = inject(GettingStartedService);
  private commonOnInitService = inject(CommonOnInitService);
  private headerService = inject(HeaderService);

  businessTools: IBusinessTools[];
  availableBusinessTools: IBusinessTools[] = [];
  upcomingBusinessTools: IBusinessTools[] = [];
  term: string;
  resultFound = true;
  subscriptions: Subscription[] = [];
  isLoading: boolean;
  searchInput = '';
  upperCardClass: string;
  isDarkMode: boolean;
  isProcessCardEligble = 0;
  applicationStatus: 0;
  isDataLoaded = false;
  dummyCards = Array.from({ length: 12 }, (_, i) => i + 1);
  isInfoAlertOpened = false;

  ngOnInit(): void {
    this.getDarkModeStatus();
    this.getBusinessTools();
    this.headerService.isSubHeaderVisible.next({ hidden: false, animation: false });
  }

  /**
   * @description Checking process card status.
   */
  checkProcessCardEligble() {
    this.subscriptions.push(
      this.processCardService.processCardStstus().subscribe((res) => {
        if (res.success) {
          this.isProcessCardEligble = res?.data?.isProcessCardEligble;
          this.applicationStatus = res?.data?.applicationStatus;
          this.getUpdatedProcessCardStatus();
        }
      })
    );
  }

  /**
   * @description Get process card status.
   */
  getUpdatedProcessCardStatus() {
    this.subscriptions.push(
      this.processCardService.getProcessCardStatus().subscribe((res) => {
        if (res) {
          this.checkProcessCardEligble();
          this.navigation();
        }
      })
    );
  }

  /**
   * @description Opening pages based on applicaton status.
   */
  navigation() {
    if (this.applicationStatus === 0) {
      this.router.navigateByUrl('/manage/business-tools/process-card');
    } else if (this.applicationStatus === 1) {
      this.router.navigate(['/manage/business-tools/process-card/success'], {
        queryParams: { status: 'submitted' }
      });
    } else if (this.applicationStatus === 2) {
      this.router.navigate(['//manage/business-tools/process-card/success'], {
        queryParams: { status: 'approved' }
      });
    }
  }

  /**
   * @description Get Dark mode theme.
   */
  getDarkModeStatus() {
    if (this.isDarkMode === undefined) {
      this.isDarkMode = this.themeService.getInitialColourTheme();
    }
    this.subscriptions.push(
      this.themeService.getThemeSwitch().subscribe((res) => {
        this.isDarkMode = res;
      })
    );
  }

  /**
   * @description Applying for business tool.
   */
  applyForBusinessTool(tool: IBusinessTools) {
    if (!tool.loading) {
      const sendingData = {
        product_id: tool.id
      };
      const updatedTool = { ...tool };
      updatedTool.loading = true;
      this.subscriptions.push(
        this.businessToolsService.applyForBusinessTool(sendingData).subscribe(
          (res) => {
            updatedTool.loading = false;
            if (res.success) {
              updatedTool.is_applied = 1;
            }
          },
          () => {
            // In case of error
            updatedTool.loading = false;
          }
        )
      );
    }
  }

  /**
   * @description Check business tool status.
   */
  checkBusinessToolsStatus(card: IBusinessTools) {

    if (card.product_name === 'Process Card') {
      this.checkProcessCardEligble();
    } else if (card.routing_link === 'manage/working-capital/intro') {
      this.router.navigate(['manage/working-capital/intro']);
    } else if (card.product_name === 'Positive Pay') {
      this.commonOnInitService.checkPostivePayPermission();
    } else if (card.product_name === 'Group SMS') {
      this.router.navigate(['/manage/business-tools/sms-panel']);
    } else if (card.product_name === 'Mailing Dashboard') {
      this.headerService.isSubHeaderVisible.next({ hidden: true, animation: false });
      this.router.navigate(['/manage/business-tools/mail-dashboard/index']);
    } else if (card.product_name === 'Document Vault') {
      this.router.navigate(['/manage/business-tools/document-vault']);
    } else if (card.applicationStatus === 0 && card.isApprovalRequired === 1) {
      if (!this.isInfoAlertOpened) {
        this.openInfoAlert();
      }
    } else if (
      (card.isApprovalRequired === 0 &&
        (card.applicationStatus === 1 || card.applicationStatus === 2)) ||
      (card.isApprovalRequired === 1 && card.applicationStatus === 2) ||
      (card.applicationStatus === 0 && card.isApprovalRequired === 0)
    ) {
      if (
        card.routing_link === '/manage/business-tools/article-writer' ||
        card.routing_link === '/manage/business-tools/shipping-label' ||
        card.routing_link === '/manage/business-tools/sms-panel' ||
        card.routing_link ===
          '/manage/business-tools/knowledge-base/articles-list' ||
        card.routing_link === '/manage/business-tools/file-share'
      ) {
        this.router.navigate([card.routing_link]);
      } else {
        this.router.navigate([card.routing_link]);
      }
    }
  }

  /**
   * @description Info alert.
   */
  openInfoAlert() {
    this.isInfoAlertOpened = true;
    const data = {
      content:
        'You are not eligible for this feature. Please contact support for more information.',
      doneMsg: 'Contact Now',
      cancelMsg: 'Not Now',
      isOk: true,
      isCancel: true
    };
    const action = this.alert.infoAlert(data);
    action.afterClosed().subscribe((res) => {
      this.isInfoAlertOpened = false;
      if (res) {
        this.dynamicWhiteLabelService.goToLiveChat();
      }
    });
  }

  /**
   * @description Get business tools.
   */
  getBusinessTools() {
    this.subscriptions.push(
      this.businessToolsService.getBusinessTools().subscribe((res) => {
        this.businessTools = res;
        this.businessTools.unshift({
          id: '47scZZffgidndni',
          isComingSoon: 0,
          icon: 'process-card.svg',
          is_applied: 2,
          product_name: 'Process Card',
          routing: false,
          routing_link: '/manage/business-tools',
          description:
            'Cut card processing costs. Switch and enjoy lower fees.',
          allowedUser: 1,
          applicationStatus: 1,
          comming_soon: false,
          isApprovalRequired: 0
        });
        // this.businessTools.unshift({
        //   id: '3n1Zbmflbmflwba',
        //   isComingSoon: 0,
        //   icon: 'payroll.svg',
        //   is_applied: 2,
        //   product_name: 'Payroll (Beta)',
        //   routing: false,
        //   routing_link: 'v3/manage/business-tools/payroll/index',
        //   description: 'Payroll management can be made more efficient now.',
        //   allowedUser: 1,
        //   applicationStatus: 1,
        //   comming_soon: false,
        //   isApprovalRequired: 0
        // });
        this.businessTools.unshift({
          id: 'asdfafdasfds',
          isComingSoon: 0,
          icon: 'payroll.svg',
          is_applied: 2,
          product_name: 'Mail Document',
          routing: false,
          routing_link: '/manage/business-tools/document-mail',
          description:
            'Upload and deliver documents to payees securely, with tracking confirmation.',
          allowedUser: 1,
          applicationStatus: 1,
          comming_soon: false,
          isApprovalRequired: 0
        });
        this.businessTools.unshift({
          id: 'groupmailing123',
          isComingSoon: 0,
          icon: 'group-email.svg',
          is_applied: 2,
          product_name: 'Mailing Dashboard',
          routing: false,
          routing_link: '/manage/business-tools/mail-dashboard/index',
          description:
            'Track group mailings in one place: delivery status, costs, and performance.',
          allowedUser: 1,
          applicationStatus: 1,
          comming_soon: false,
          isApprovalRequired: 0
        });
        this.isDataLoaded = true;
        this.businessTools.forEach((el) => {
          if (el.isComingSoon === 0) {
            this.availableBusinessTools.push(el);
          } else {
            this.upcomingBusinessTools.push(el);
          }
        });
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((e) => e.unsubscribe());
  }
}
