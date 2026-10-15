import { Component, DestroyRef, inject, OnDestroy, OnInit, signal } from '@angular/core';
import {
  UntypedFormControl,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { NgClass, NgStyle } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatTooltipModule } from '@angular/material/tooltip';
import { faCloudArrowDown, faDownToLine, faSpinner } from '@fortawesome/pro-solid-svg-icons';
import { WhiteLabelPipe } from 'src/app/pipes/white-label.pipe';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { MatCheckbox } from '@angular/material/checkbox';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CompanySelectModalComponent } from 'src/app/shared/modal/common-modal/company-select-modal/company-select-modal.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IConnectedCompanyList, IConnectedThirdPartyData } from '../../../model/integration';

@Component({
  selector: 'app-freshbooks-settings-modal',
  templateUrl: './freshbooks-settings-modal.component.html',
  styleUrls: ['./freshbooks-settings-modal.component.scss'],
  standalone: true,
  imports: [NgStyle, FormsModule, ReactiveFormsModule, NgClass, FaIconComponent, MatTooltipModule, WhiteLabelPipe, CommonButtonV35Component, MatCheckbox]
})
export class FreshbooksSettingsModalComponent implements OnInit, OnDestroy {

  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  public data: IConnectedThirdPartyData = inject(MAT_DIALOG_DATA);
  private alertService = inject(AlertService);

  subscriptions: Subscription[] = [];
  autoDownloading = new UntypedFormControl();
  pushbackEnable = new UntypedFormControl();
  loading = {
    defaultLoading: false,
    companyLoading: false,
    payeeLoading: false,
    categoryLoading: false,
  };
  
  isConnected = signal<number>(0);
  isFreshbooksExport = signal<number>(0);
  companyList: IConnectedCompanyList[] = [];

  faSpinner = faSpinner;
  faDownToLine = faDownToLine;
  faCloudArrowDown = faCloudArrowDown;

  constructor(
    public dialogRef: MatDialogRef<FreshbooksSettingsModalComponent>,
    private integrationService: IntegrationService
  ) {}

  ngOnInit(): void {
    this.getsettings();
    this.isConnected.set(this.data?.connected);
    this.isFreshbooksExport.set(this.data?.module?.freshbooksExport);
    this.pushbackEnable.setValue(this.data?.module?.freshbooksPushBackEnable);
    this.companyList = this.data?.companies;
  }

  /**
   * Retrieves FreshBooks integration settings.
   */
  getsettings(): void {
    this.subscriptions.push(
      this.integrationService.getFreshBooksSettings().subscribe((res) => {
        res.data.freshbook_webhook === 1
          ? this.autoDownloading.setValue(1)
          : this.autoDownloading.setValue(0);
        res.data.fb_push_back_enable === 1
          ? this.pushbackEnable.setValue(1)
          : this.pushbackEnable.setValue(0);
      })
    );
  }

  /**
   * Posts FreshBooks settings data.
   */
  postQuickBookOnlineData(): void {
    this.loading.defaultLoading = true;
    this.subscriptions.push(
      this.integrationService
        .PostFreshBooksSettings({
          freshbook_webhook: this.autoDownloading.value ? 1 : 0,
          fb_push_back_enable: this.pushbackEnable.value ? 1 : 0
        })
        .pipe(
          finalize(() => {
            this.loading.defaultLoading = false;
          })
        )
        .subscribe()
    );
  }

  /**
   * Closes the FreshBooks settings modal.
   */
  close() {
    this.dialogRef.close(true);
  }

  onPayeeImportClicked(type: string): void {
    this.openCompanyListModal(type);
  }

  onCategoryImportClicked(type: string): void {
    this.openCompanyListModal(type);
  }


  openCompanyListModal(mode: string): void {
    const sendingData = {
      mode,
      companyList: this.companyList
    };
    const dialogRef = this.dialog.open(CompanySelectModalComponent, {
      maxWidth: '510px',
      width: '93%',
      data: sendingData,
      disableClose: true
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        if (sendingData.mode === 'Payee') {
          this.importFreshbookPayee(res.companyId);
        }
        if (sendingData.mode === 'Category') {
          this.importFreshbookCategories(res.companyId);
        }
      }
    });
  }

  /**
   * Imports payees from FreshBooks.
   */
  importFreshbookPayee(companyId: string): void {
    this.loading.payeeLoading = true;
    this.subscriptions.push(
      this.integrationService.importFreshBookPayee({companyIds: [companyId]})
        .pipe(takeUntilDestroyed(this.destroyRef),
          finalize(() => {
            this.loading.payeeLoading = false;
          })
        )
        .subscribe((res) => {
          if(res.success) {
            this.alertService.successAlert({
              content: res.message
            });
            this.dialogRef.close(true);
          }
        })
    );
  }

  /**
   * Imports categories from FreshBooks.
   */
  importFreshbookCategories(companyId: string): void {
    this.loading.categoryLoading = true;
    this.subscriptions.push(
      this.integrationService.importFreshBookCategories({companyIds: [companyId]})
      .pipe(takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading.categoryLoading = false;
        })
      )
      .subscribe((res) => {
          if(res.success) {
            this.alertService.successAlert({
              content: res.message
            });
            this.dialogRef.close(true);
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
