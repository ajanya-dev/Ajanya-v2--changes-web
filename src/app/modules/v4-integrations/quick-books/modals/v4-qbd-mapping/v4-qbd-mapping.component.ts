import {
  Component,
  DestroyRef,
  OnInit,
  ViewEncapsulation,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgClass } from '@angular/common';
import {
  MatDialog,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { finalize } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { V4CompanySelectModalComponent } from 'src/app/shared/modal/common-modal/v4-company-select-modal/v4-company-select-modal.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4MapBankAccountDesktopComponent } from '../v4-map-bank-account-desktop/v4-map-bank-account-desktop.component';
import {
  IQBCompanyData,
  IQbCompanyList
} from 'src/app/modules/integration/model/integration';

@Component({
  selector: 'app-v4-qbd-mapping',
  templateUrl: './v4-qbd-mapping.component.html',
  styleUrls: ['./v4-qbd-mapping.component.scss'],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NgClass,
    MatDialogClose,
    MatTooltip,
    LucideAngularModule,
    CommonButtonV4Component
  ]
})
export class V4QbdMappingComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<V4QbdMappingComponent>);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  private integrationService = inject(IntegrationService);
  private alertService = inject(V4AlertService);

  companyBankAccountList: IQBCompanyData[] = [];
  companyData: IQbCompanyList[] = [];
  isConnected = 0;
  initialLoading = true;
  loading: string | undefined;

  quickBooksLoading = signal({ bank: false });

  ngOnInit(): void {
    this.getMappedData();
    this.loadCompanyData();
  }

  getMappedData(): void {
    this.initialLoading = true;
    this.integrationService
      .geQbDesktopBankMappedData()
      .pipe(
        finalize(() => (this.initialLoading = false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.companyBankAccountList = res.data;
        }
      });
  }

  refreshData(): void {
    this.getMappedData();
  }

  openBankAccountMappingModal(id: string): void {
    const dialogRef = this.dialog.open(V4MapBankAccountDesktopComponent, {
      maxWidth: '500px',
      width: '93%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: { qbId: id }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.getMappedData();
      }
    });
  }

  onEditRow(id: string): void {
    const dialogRef = this.dialog.open(V4MapBankAccountDesktopComponent, {
      maxWidth: '500px',
      width: '93%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: { qbId: id, mode: 'edit' }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.getMappedData();
      }
    });
  }

  onDeleteBankAccount(
    bankId: string,
    index: number,
    companyData: IQBCompanyData
  ): void {
    const confirm = this.alertService.confirmAlert({
      content:
        'This will remove your current bank account mapping. Are you sure you want to continue?'
    });

    confirm.afterClosed().subscribe((result) => {
      if (result) {
        this.loading = bankId;
        this.integrationService
          .deleteQbMappedBank(bankId)
          .pipe(
            finalize(() => (this.loading = undefined)),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe((res) => {
            if (res.success) {
              companyData.data.splice(index, 1);
              this.alertService.successAlert({
                content: 'Deleted Successfully',
                close: true
              });
            }
          });
      }
    });
  }

  ImportBank(): void {
    if (this.isConnected) {
      const sendingData = {
        mode: 'Bank',
        companyList: this.companyData
      };
      const dialogRef = this.dialog.open(V4CompanySelectModalComponent, {
        maxWidth: '510px',
        width: '93%',
        data: sendingData,
        disableClose: true,
        panelClass: 'paddingless-modal-rounded'
      });
      dialogRef.afterClosed().subscribe((res) => {
        if (res) {
          this.importNewBankAccountsOfQBDCompany(res.id);
        }
      });
    } else {
      this.alertService.warningAlert({
        content: "We couldn't connect to any QuickBooks Desktop company",
        close: true
      });
    }
  }

  close(): void {
    this.dialogRef.close(true);
  }

  private loadCompanyData(): void {
    this.integrationService
      .getQuickbooksDesktopCompanies()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success) {
          this.companyData = res.data.companies;
          this.isConnected = res.data?.companyCount;
        }
      });
  }

  private importNewBankAccountsOfQBDCompany(companyId: string): void {
    this.quickBooksLoading.update((l) => ({ ...l, bank: true }));
    const sendingData = new FormData();
    sendingData.append('company_id', companyId);
    this.integrationService
      .importNewBankAccountsOfQBDCompany(sendingData)
      .pipe(
        finalize(() =>
          this.quickBooksLoading.update((l) => ({ ...l, bank: false }))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            content:
              'Your bank accounts has been imported. Please refresh and check the list after one minute.',
            close: true
          });
          this.getMappedData();
        }
      });
  }
}
