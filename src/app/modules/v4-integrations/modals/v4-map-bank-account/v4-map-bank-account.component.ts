import {
  Component,
  DestroyRef,
  OnInit,
  ViewEncapsulation,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  MatDialogClose,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { finalize } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { LucideAngularModule } from 'lucide-angular';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { NetsuiteIntegrationService } from 'src/app/shared/service/integration/netsuite.service';
import { OdooService } from 'src/app/modules/integration/odoo/service/odoo.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { BankAcDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/bank-ac-dropdown-v4/bank-ac-dropdown-v4.component';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { Iv4ngSelectConfig } from 'src/app/shared/V4/v4-dropdown/models/v4-common-dropdown-selector.interface';
import { IBankCreateRes, IBankDropdown } from 'src/app/models/bank';
import { IV3DropDownOnReady } from 'src/app/models/common';
import { bankAccountsActions } from 'src/app/modules/store/bankAccounts/bank-accounts.actions';
import {
  ILocation,
  IQBBankData
} from 'src/app/modules/integration/model/integration';
import { INetsuiteMapedBankList } from 'src/app/modules/integration/netsuite/model/netsuite';
import { IOdooMapedBankList } from 'src/app/modules/integration/odoo/model/odoo';

export type V4MapBankAccountData =
  | {
      app: 'QBO';
      qbId: string;
      data: IQBBankData;
      mode?: string;
      ismapping: string;
      companyId: string;
    }
  | {
      app: 'NetSuite';
      qbId: string;
      data: INetsuiteMapedBankList;
      mode?: string;
      isMapping: number;
    }
  | {
      app: 'Odoo';
      qbId: string;
      data: IOdooMapedBankList;
      mode?: string;
      isMapping: number;
    };

@Component({
  selector: 'app-v4-map-bank-account',
  templateUrl: './v4-map-bank-account.component.html',
  styleUrls: ['./v4-map-bank-account.component.scss'],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    MatDialogClose,
    MatTooltip,
    CommonButtonV4Component,
    BankAcDropdownV4Component,
    V4CommonDropDownSelectorComponent,
    V4ControlMessageComponent
  ]
})
export class V4MapBankAccountComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<V4MapBankAccountComponent>);
  private destroyRef = inject(DestroyRef);
  private integrationService = inject(IntegrationService);
  private netsuiteService = inject(NetsuiteIntegrationService);
  private odooService = inject(OdooService);
  private alertService = inject(V4AlertService);
  private checkService = inject(CheckService);
  private bankModalService = inject(BankModalService);
  private store = inject(Store);

  public data: V4MapBankAccountData = inject(MAT_DIALOG_DATA);

  get app(): 'QBO' | 'NetSuite' | 'Odoo' {
    return this.data.app;
  }

  loading = false;
  editmode = false;
  qbData: IQBBankData | null = null;
  netSuiteData: INetsuiteMapedBankList | null = null;
  odooData: IOdooMapedBankList | null = null;
  private dropdownReady: IV3DropDownOnReady = {};

  // Class (QBO)
  qbClass: { name: string; id: string }[] = [];
  classPage = 2;
  isClassLoading = signal(false);
  classDropdownConfig: Iv4ngSelectConfig = {
    placeholder: 'Select class',
    displayField: 'name',
    outputField: 'id'
  };

  // Location (QBO)
  isLocation = false;
  qbLocations: ILocation[] = [];
  isLocationLoading = signal(false);
  locationDropdownConfig: Iv4ngSelectConfig = {
    placeholder: 'Select location',
    displayField: 'name',
    outputField: 'id'
  };

  // Subsidiary (NetSuite)
  subsidiaryList = signal<{ id: string; name: string }[]>([]);
  isSubsidiaryLoading = signal(false);
  subsidiaryDropdownConfig: Iv4ngSelectConfig = {
    placeholder: 'Select subsidiary',
    displayField: 'name',
    outputField: 'id'
  };

  mapForm = new FormGroup({
    bankAccount: new FormControl('', Validators.required),
    qboClass: new FormControl<string | null>(null),
    qboLocation: new FormControl<string | null>(null),
    subsidiary: new FormControl<string | null>(null)
  });

  ngOnInit(): void {
    if (this.data.app === 'NetSuite') {
      this.netSuiteData = this.data.data;
      this.editmode = this.data.mode === 'edit';
      if (this.editmode && this.netSuiteData?.ocwBankAccountId) {
        this.mapForm.controls.bankAccount.setValue(
          this.netSuiteData.ocwBankAccountId
        );
      }
      if (this.netSuiteData?.ocwSubsidiaryId) {
        this.mapForm.controls.subsidiary.setValue(
          this.netSuiteData.ocwSubsidiaryId
        );
      }
      this.getSubsidiary();
    } else if (this.data.app === 'Odoo') {
      this.odooData = this.data.data;
      this.editmode = this.data.mode === 'edit';
      if (this.editmode && this.odooData?.ocwBankAccountId) {
        this.mapForm.controls.bankAccount.setValue(
          this.odooData.ocwBankAccountId
        );
      }
    } else {
      this.qbData = this.data.data;
      this.editmode = this.data.mode === 'edit';
      if (this.data.companyId) {
        this.getQboInformation(this.data.companyId);
      }
    }
  }

  onDropdownReady(ev: IV3DropDownOnReady): void {
    this.dropdownReady = ev;
    if (this.data.app === 'NetSuite') {
      if (this.editmode && this.netSuiteData?.ocwBankAccountId) {
        ev.setItemWithId?.(this.netSuiteData.ocwBankAccountId);
      }
    } else if (this.data.app === 'Odoo') {
      if (this.editmode && this.odooData?.ocwBankAccountId) {
        ev.setItemWithId?.(this.odooData.ocwBankAccountId);
      }
    } else if (this.editmode && this.qbData?.OcwbankAccountId) {
      ev.setItemWithId?.(this.qbData.OcwbankAccountId);
    }
  }

  openAddNewBank(): void {
    this.bankModalService
      .openV4NewBankAccountModal()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((bankModal) => {
        if (!bankModal) return;
        bankModal
          .afterClosed()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((res) => {
            if (res?.success && res.bankAcData) {
              const bankAccount = {
                accountNumber: `xxxx${(res.bankAcData as IBankCreateRes).bankAccountNumber.slice(-4)}`,
                achApplicationStatus: null,
                bankName: res.bankAcData.bankName,
                cashAccount: 0,
                id: res.bankAcData.id,
                isItZil: 0,
                mAch: 0,
                name: (res.bankAcData as IBankCreateRes).bankAccountName,
                nickName: (res.bankAcData as IBankCreateRes)
                  .bankAccountNickName,
                routingNumber: res.bankAcData.routingNumber,
                status: '',
                statusDescription: '',
                verifiedBy: null,
                verified: 0
              } as unknown as IBankDropdown;
              this.store.dispatch(
                bankAccountsActions.addCreatedBankAccountIntoBankAccounts({
                  bankAccount
                })
              );
              this.dropdownReady.setItemWithId?.(res.bankAcData.id);
              this.mapForm.controls.bankAccount.setValue(res.bankAcData.id);
            }
          });
      });
  }

  bankDropDownChange(ev: IBankDropdown | null | undefined): void {
    if (ev?.id) {
      this.mapForm.controls.bankAccount.setValue(ev.id);
    } else {
      this.onBankClear();
    }
  }

  onBankClear(): void {
    this.mapForm.patchValue({
      qboClass: null,
      qboLocation: null,
      subsidiary: null,
      bankAccount: null
    });
    this.qbLocations = [];
    this.qbClass = [];
  }

  getSubsidiary(): void {
    this.isSubsidiaryLoading.set(true);
    this.netsuiteService
      .getSubsidiary()
      .pipe(
        finalize(() => this.isSubsidiaryLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.subsidiaryList.set(res.data);
          if (
            this.editmode &&
            this.netSuiteData?.ocwSubsidiaryId &&
            !this.mapForm.controls.subsidiary.value
          ) {
            this.mapForm.controls.subsidiary.setValue(
              this.netSuiteData.ocwSubsidiaryId
            );
          }
        }
      });
  }

  getQboInformation(companyId: string): void {
    this.getClass(companyId);
    this.isLocationEnabled();
  }

  getClass(id: string): void {
    this.isClassLoading.set(true);
    this.checkService
      .GetCompanyDetails('classes', id)
      .pipe(
        finalize(() => this.isClassLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.qbClass = res.data;
        }
      });
  }

  isLocationEnabled(): void {
    this.checkService
      .isPushBackEnable()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.data.isLocationEnabled) {
          this.getLocations(
            (this.data as { app: 'QBO'; companyId: string }).companyId
          );
          this.isLocation = true;
        } else {
          this.isLocation = false;
        }
      });
  }

  getLocations(id: string): void {
    this.isLocationLoading.set(true);
    this.checkService
      .getLocations(id)
      .pipe(
        finalize(() => this.isLocationLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.qbLocations = res.data as ILocation[];
          if (this.editmode && this.qbData) {
            this.mapForm.patchValue({
              bankAccount: this.qbData.OcwbankAccountId,
              qboClass: this.qbData.classMappingId,
              qboLocation: this.qbData.locationMappingId
            });
          }
        }
      });
  }

  scrollClass(searchTerm: string): void {
    const qboData = this.data as { app: 'QBO'; companyId: string };
    this.checkService
      .GetCompanyDetailsPagination(
        'classes',
        Number(qboData.companyId),
        searchTerm !== '' ? 0 : this.classPage,
        searchTerm
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success) {
          this.qbClass = [...this.qbClass, ...res.data];
          this.classPage += 1;
        }
      });
  }

  submit(): void {
    this.mapForm.markAsTouched();
    if (this.data.app === 'NetSuite') {
      if (!this.mapForm.controls.subsidiary.value) {
        this.mapForm.controls.subsidiary.markAsTouched();
        return;
      }
    }
    if (this.mapForm.invalid) {
      return;
    }
    if (this.data.app === 'NetSuite') {
      this.netsuiteMap();
    } else if (this.data.app === 'Odoo') {
      this.odooMap();
    } else {
      this.qbMapping();
    }
  }

  private netsuiteMap(): void {
    const formValue = this.mapForm.value;
    const payload = {
      ocwAccountId: formValue.bankAccount as string,
      netsuiteAccountId: this.data.qbId,
      subsidiaryMappingId: formValue.subsidiary as string
    };
    this.loading = true;
    this.netsuiteService
      .mapBank(payload)
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.alertService.successAlert({
            content: 'Bank account mapped successfully.',
            close: true
          });
          this.dialogRef.close(true);
        }
      });
  }

  private qbMapping(): void {
    const formValue = this.mapForm.value;
    const mappingData = {
      bankAccountId: formValue.bankAccount as string,
      classMappingId: formValue.qboClass as string,
      locationMappingId: formValue.qboLocation as string
    };
    const qboData = this.data as {
      app: 'QBO';
      qbId: string;
      companyId: string;
    };

    this.loading = true;
    const operation$ = this.editmode
      ? this.integrationService.updateQboMapingBankAcc(
          mappingData,
          qboData.qbId
        )
      : this.integrationService.mapQbDesktopBankAcc({
          ...mappingData,
          qbId: qboData.qbId
        });

    operation$
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.alertService.successAlert({
            content: this.editmode
              ? 'Updated successfully.'
              : 'Bank account mapped successfully.',
            close: true
          });
          this.dialogRef.close(true);
        }
      });
  }

  private odooMap(): void {
    const formValue = this.mapForm.value;
    const payload = {
      id: this.data.qbId,
      bankAccountId: formValue.bankAccount as string
    };
    this.loading = true;
    const operation$ = this.editmode
      ? this.odooService.updateOdooMapingBankAcc(payload)
      : this.odooService.mapBank(payload);

    operation$
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.alertService.successAlert({
            content: this.editmode
              ? 'Updated successfully.'
              : 'Bank account mapped successfully.',
            close: true
          });
          this.dialogRef.close(true);
        }
      });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
