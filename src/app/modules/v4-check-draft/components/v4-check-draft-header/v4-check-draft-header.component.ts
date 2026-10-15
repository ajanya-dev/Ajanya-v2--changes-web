import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import { IV4HeaderAction } from 'src/app/shared/V4/v4-page-header/v4-page-header.model';
import {
  CommonTabV4Component,
  ITabItem
} from 'src/app/shared/V4/common-tab-v4/common-tab-v4.component';
import { CommonLayoutToggleV4Service } from 'src/app/shared/service/common/shared/common-layout/common-layout-toggle-v4.service';
import { CheckDraftService } from 'src/app/shared/service/check-draft/check-draft.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonVerificationService } from 'src/app/shared/service/common/common-verification.service';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { IUserVerification } from 'src/app/models/user';
import { IBusinessDetails } from 'src/app/models/bank';
import {
  CVSourceType,
  IActionLoaderData,
  ISelectBizData
} from 'src/app/modules/common-verification/model/common-verification';
import { SelectBusinessV4Component } from 'src/app/modules/bank/bank-v4/v4-modals/select-business-v4/select-business-v4.component';
import { V4LoaderModalComponent } from 'src/app/shared/modal/v4-loader-modal/v4-loader-modal.component';
import { CustomDoubleSideModalService } from 'src/app/shared/modal/custom-double-side-modal/custom-double-side-modal.service';
import { V4NewCheckdraftComponent } from '../../modal/v4-new-checkdraft/v4-new-checkdraft.component';
import { V4ImportCheckdraftModalComponent } from '../../modal/v4-import-checkdraft-modal/v4-import-checkdraft-modal.component';

@Component({
  standalone: true,
  selector: 'app-v4-check-draft-header',
  imports: [
    CommonModule,
    LucideAngularModule,
    MatTooltipModule,
    CommonTabV4Component,
    V4PageHeaderComponent
  ],
  templateUrl: './v4-check-draft-header.component.html',
  styleUrls: ['./v4-check-draft-header.component.scss']
})
export class V4CheckDraftHeaderComponent implements OnInit, OnDestroy {
  private commonLayoutToggleV4Service = inject(CommonLayoutToggleV4Service);
  private checkDraftService = inject(CheckDraftService);
  private userProfileService = inject(UserProfileService);
  private alertService = inject(V4AlertService);
  private verificationService = inject(CommonVerificationService);
  private personaHelperService = inject(PersonaHelperService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private doubleSideModalService = inject(CustomDoubleSideModalService);

  private subscriptions: Subscription[] = [];

  isGridView = this.commonLayoutToggleV4Service.gridView;
  isRecurringView = this.checkDraftService.showRecurringList;
  checkDraftAppStatus = this.checkDraftService.checkDraftAppStatus;
  depositSlipDisabled = this.checkDraftService.depositSlipDisabled;
  checkDesignTemplateName = this.checkDraftService.checkDesignTemplateName;

  showCheckDesignMenu = false;
  showMoreMenu = false;
  loading = false;
  applying = false;
  kycLoading = false;
  kycKybStatus: { kycStatus: number; kybStatus: number };

  navigationTabs: ITabItem[] = [
    { label: 'Check Drafts', value: 'index', lucideIcon: 'file-text' },
    { label: 'Recurring List', value: 'recurring', lucideIcon: 'repeat' }
  ];

  activeNavTab = signal('index');

  get headerActions(): IV4HeaderAction[] {
    return this.checkDraftAppStatus() === 0
      ? [
          {
            id: 'newCheck',
            text: 'New Check',
            style: 'primary',
            lucideIcon: 'plus',
            toolTip: 'Create a new check draft'
          }
        ]
      : [];
  }

  onAction(id: string | number): void {
    if (id === 'newCheck') this.onNewCheckDraft();
  }

  constructor() {
    toObservable(this.checkDraftService.showRecurringList)
      .pipe(takeUntilDestroyed())
      .subscribe((isRecurring) => {
        this.activeNavTab.set(isRecurring ? 'recurring' : 'index');
      });
  }

  panelTabs: ITabItem[] = [
    { label: 'All', value: 'all' },
    { label: 'New', value: 'new' },
    { label: 'Pending Approval', value: 'pending' },
    { label: 'Approved', value: 'approved' }
  ];

  activePanelTab = this.checkDraftService.selectedPanelButton;

  ngOnInit(): void {
    this.commonLayoutToggleV4Service.gridView.set(true);
    this.checkDraftService.checkDraftStatus().subscribe((res) => {
      if (res.success) {
        this.checkDraftService.checkDraftAppStatus.set(res.data);
      }
    });
    this.openBusinessModalAfterPersonaVerification();
  }

  applyForCheckDraft(): void {
    this.applying = true;
    this.isEmailAndPhoneVerfied();
  }

  isEmailAndPhoneVerfied(): void {
    this.loading = true;
    this.subscriptions.push(
      this.userProfileService.checkEmailAndPhoneVerified().subscribe((res) => {
        if (res?.success && 'data' in res) {
          const data = res.data as IUserVerification;
          if (data.email_verified === 0 || data.phone_verified === 0) {
            this.verifyPhoneEmail(data);
          } else {
            this.getUserKysKybStatus();
          }
        }
        this.loading = false;
      })
    );
  }

  verifyPhoneEmail(res: IUserVerification): void {
    const msg = () => {
      if (!res.email_verified && !res.phone_verified) return 'Phone and Email';
      if (!res.phone_verified) return 'Phone';
      return 'Email';
    };

    const ref = this.alertService.warningAlert({
      content: `Please verify your ${msg()}`,
      doneMsg: 'Verify Now',
      isCancel: true,
      cancelMsg: 'Cancel'
    });

    ref.afterClosed().subscribe((response) => {
      if (response) {
        this.router.navigate(['/v4/manage/verification/index'], {
          queryParams: {
            returnUrl: 'v4/manage/checkdraft/index',
            type: CVSourceType.check_draft
          }
        });
      }
      this.applying = false;
    });
  }

  getUserKysKybStatus(): void {
    this.kycLoading = true;
    this.subscriptions.push(
      this.verificationService.applicationStatus().subscribe((res) => {
        if (res?.success) {
          this.kycKybStatus = res.data;
          this.getBusinesses();
        }
      })
    );
  }

  getBusinesses(): void {
    this.subscriptions.push(
      this.verificationService
        .getUserBusinesses()
        .pipe(
          finalize(() => {
            this.kycLoading = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.selectBusiness(res.data);
          }
        })
    );
  }

  selectBusiness(businessDetails: IBusinessDetails[]): void {
    this.loading = false;
    const ref = this.dialog.open<SelectBusinessV4Component, ISelectBizData>(
      SelectBusinessV4Component,
      {
        width: '450px',
        maxWidth: '95%',
        panelClass: 'paddingless-modal-rounded',
        disableClose: true,
        data: {
          applyCheckDraft: true,
          applicationStatus: this.kycKybStatus,
          isShowBankDropDown: true,
          sourceType: CVSourceType.check_draft,
          bankData: { businessDetails }
        }
      }
    );

    ref.afterClosed().subscribe((res) => {
      if (res?.businessId && res?.bankAccountId) {
        this.openLoaderModal(res.businessId, res.bankAccountId);
      } else {
        this.applying = false;
      }
    });
  }

  openLoaderModal(businessId: string, bankAccountId: string): void {
    const ref = this.dialog.open<V4LoaderModalComponent, IActionLoaderData>(
      V4LoaderModalComponent,
      {
        maxWidth: '450px',
        width: '90%',
        panelClass: 'paddingless-modal-rounded',
        disableClose: true,
        data: { type: { checkDraft: { businessId, bankAccountId } } }
      }
    );
    ref.afterClosed().subscribe(() => {
      this.applying = false;
      this.checkDraftService.checkDraftStatus().subscribe((res) => {
        if (res.success) {
          this.checkDraftService.checkDraftAppStatus.set(res.data);
        }
      });
    });
  }

  openBusinessModalAfterPersonaVerification(): void {
    this.subscriptions.push(
      this.personaHelperService.kycKybVerifivationResult$.subscribe((res) => {
        if (res?.data?.inquiry_type === 'kyb') {
          this.loading = true;
          this.getBusinesses();
        }
      })
    );
  }

  onNewCheckDraft(): void {
    const ref = this.doubleSideModalService.open(V4NewCheckdraftComponent, {
      width: '800px',
      maxHeight: '90vh',
      disableClose: true
    });

    ref.afterClosed().subscribe((result) => {
      const res = result as { type?: string } | undefined;
      if (res?.type === 'recurring') {
        this.checkDraftService.showRecurringList.set(true);
        this.activeNavTab.set('recurring');
        this.checkDraftService.triggerHeaderButton$.next('refresh');
      } else if (res?.type === 'save') {
        this.checkDraftService.showRecurringList.set(false);
        this.activeNavTab.set('index');
        this.checkDraftService.triggerHeaderButton$.next('refresh');
      }
    });
  }

  toggleMoreMenu(): void {
    this.showMoreMenu = !this.showMoreMenu;
    this.showCheckDesignMenu = false;
  }

  onImportCheckDraft(): void {
    this.showMoreMenu = false;
    const ref = this.dialog.open(V4ImportCheckdraftModalComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true
    });

    ref.afterClosed().subscribe((result) => {
      const res = result as { success?: boolean } | undefined;
      if (res?.success) {
        this.checkDraftService.triggerHeaderButton$.next('refresh');
      }
    });
  }

  onHeaderButton(id: string): void {
    if (!this.isGridView()) {
      this.alertService.warningAlert({
        title: 'Error',
        content: 'Please select at least one row',
        doneMsg: 'OK'
      });
      return;
    }
    this.checkDraftService.triggerHeaderButton$.next(id);
  }

  closeAllMenus(): void {
    this.showCheckDesignMenu = false;
    this.showMoreMenu = false;
  }

  toggleCheckDesignMenu(): void {
    this.showCheckDesignMenu = !this.showCheckDesignMenu;
    this.showMoreMenu = false;
  }

  selectCheckDesign(id: string, name: string): void {
    this.checkDraftService.checkDesignTemplateName.set(name);
    this.checkDraftService.checkDesignTemplate.set(id);
    this.showCheckDesignMenu = false;
    this.checkDraftService.triggerHeaderButton$.next(id);
  }

  onPanelTabChange(value: string): void {
    this.checkDraftService.selectedPanelButton.set(value);
    this.checkDraftService.triggerHeaderButton$.next(value);
  }

  onNavTabChange(value: string): void {
    if (value === 'recurring') {
      this.checkDraftService.showRecurringList.set(true);
    } else {
      this.checkDraftService.showRecurringList.set(false);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
