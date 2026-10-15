import { NetsuiteIntegrationService } from 'src/app/shared/service/integration/netsuite.service';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  UntypedFormControl,
  Validators
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { NgIf } from '@angular/common';
import { V35CommonDropDownSelectorComponent } from 'src/app/shared/v3/v35-dropdown/v35-common-dropdown-selector.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faXmark } from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { INetsuiteMapedBankList } from '../../netsuite/model/netsuite';
import { DropDownBankComponent } from '../../../../shared/components/drop-downs/drop-down-bank/drop-down-bank.component';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';
import { ILocation, IQBBankData } from '../../model/integration';
import { OdooService } from '../../odoo/service/odoo.service';
import { IOdooMapedBankList } from '../../odoo/model/odoo';

/**
 * Component for mapping bank accounts.
 */
@Component({
  selector: 'app-map-bank-account-modal',
  templateUrl: './map-bank-account-modal.component.html',
  styleUrls: ['./map-bank-account-modal.component.scss'],
  standalone: true,
  imports: [
    DropDownBankComponent,
    ControlMessageComponent,
    MatDialogActions,
    MatDialogClose,
    NgIf,
    FontAwesomeModule,
    CommonButtonV35Component,
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule,
    V35CommonDropDownSelectorComponent
  ]
})
export class MapBankAccountModalComponent implements OnInit, OnDestroy {
  private netsuiteService = inject(NetsuiteIntegrationService);
  private integrationService = inject(IntegrationService);
  private alertService = inject(AlertService);
  private matDilogRef = inject(MatDialogRef<MapBankAccountModalComponent>);
  private sharedService = inject(SharedService);
  private bankModalService = inject(BankModalService);
  private checkService = inject(CheckService);
  private odooService = inject(OdooService);
  public data: {
    qbId: string;
    data: IQBBankData | INetsuiteMapedBankList | IOdooMapedBankList;
    mode: string;
    ismapping: string;
    companyId?: number;
    app?: string;
  } = inject(MAT_DIALOG_DATA);

  loading = false;
  subscriptions: Subscription[] = [];
  bankAccount = new UntypedFormControl('', Validators.required);
  editmode = false;
  ismapping: string;
  appName = 'QuickBooks';
  qbData: IQBBankData;
  netSuiteData: INetsuiteMapedBankList;
  odooData: IOdooMapedBankList;
  qbClass: { name: string; id: string }[] = [];
  classPage = 2;
  isClassLoading = signal(false);
  isLocationLoading = signal(false);
  isLocation = false;
  qbLocations: ILocation[] = [];
  selectedLocationId: string | null;
  realmId: number;
  selectedSubsidiary = '';
  subsidiaryList = signal<{id:string,name:string}[]>([]);
  isSubsidiaryLoading = signal(false);
  faPlus = faPlus;
  faXmark = faXmark;

  mapForm = new FormGroup({
    bankAccount: new FormControl('', Validators.required),
    qboClass: new FormControl<string | null>(null),
    qboLocation: new FormControl<string | null>(null),
    subsidiary: new FormControl<string | null>(null)
  });

  /**
   * Initializes the component and sets initial values.
   */
  ngOnInit(): void {    
    if (this.data.app === 'NetSuite') {
      this.appName = 'NetSuite';
      this.netSuiteData = this.data.data as INetsuiteMapedBankList;
      if(this.netSuiteData?.ocwBankAccountId){
        this.mapForm.controls.bankAccount.setValue(this.netSuiteData?.ocwBankAccountId);
      }
      this.getSubsidiary();
    } else if(this.data.app === 'odoo'){
      this.appName = 'Odoo';
      this.odooData = this.data.data as IOdooMapedBankList;
      if(this.odooData?.id){
        this.mapForm.controls.bankAccount.setValue(this.odooData?.ocwBankAccountId);
      }

    }else{
      this.appName = 'QuickBooks';
      this.qbData = this.data.data as IQBBankData;
      if (this.data.companyId) {
        this.getQboInformation(
          String(this.data.companyId),
          this.data.mode === 'edit'
        );
      }
    }
    if (this.data.mode === 'edit') {
      this.editmode = true;
    }
    if (this.data) {
      this.ismapping = this.data?.ismapping;
    }
  }

  /**
   * Handles the change event of the bank account dropdown.
   * @param ev The event containing the selected bank account ID.
   */
  bankDropDownChange(ev: { id: string }): void {
    if (ev?.id) {
      this.mapForm.controls.bankAccount.setValue(ev.id);
    } else {
      this.resetForm();
    }
  }

  getQboInformation(companyId: string, isEditMode = false) {
    this.getClass(companyId);
    this.isLocationEnabled();
    if (isEditMode && this.qbData.OcwbankAccountNickName) {
      this.sharedService.setNewBankCreatedData({
        bankAccountNickName: this.qbData.OcwbankAccountNickName
      });
    }
  }

  getSubsidiary(){
    this.isSubsidiaryLoading.set(true);
    this.subscriptions.push(
      this.netsuiteService.getSubsidiary()
      .pipe(finalize(() => this.isSubsidiaryLoading.set(false)))
      .subscribe((res) => {
        if(res.success){
          this.subsidiaryList.set(res.data);
          if(this.netSuiteData?.ocwSubsidiaryId){
            this.selectedSubsidiary = res.data.filter((item) => item.id === this.netSuiteData?.ocwSubsidiaryId)[0]?.name;
            this.mapForm.controls.subsidiary.setValue(this.netSuiteData?.ocwSubsidiaryId);
          }
        }        
      })
    );
  }

  onSelectSubsidiary(event:string){
    const selectedSubsidiary = JSON.parse(event) as {id:string,name:string};
    if(selectedSubsidiary){
      this.mapForm.controls.subsidiary.setValue(selectedSubsidiary.id);
    }else{
      this.mapForm.controls.subsidiary.setValue(null);
    }    
  }


  resetForm() {
    this.mapForm.patchValue({
      qboClass: null,
      qboLocation: null,
      bankAccount: null
    });
    this.qbLocations = [];
    this.qbClass = [];
  }

  getClass(id: string) {
    this.isClassLoading.set(true);
    this.subscriptions.push(
      this.checkService
        .GetCompanyDetails('classes', id)
        .pipe(
          finalize(() => {
            this.isClassLoading.set(false);
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.qbClass = res.data;
          }
        })
    );
  }

  isLocationEnabled() {
    this.subscriptions.push(
      this.checkService.isPushBackEnable().subscribe((res) => {
        if (res.data.isLocationEnabled) {
          this.getLocations(String(this.data.companyId));
          this.isLocation = true;
        } else {
          this.isLocation = false;
        }
      })
    );
  }

  getLocations(id: string) {
    this.isLocationLoading.set(true);
    this.subscriptions.push(
      this.checkService
        .getLocations(id)
        .pipe(
          finalize(() => {
            this.isLocationLoading.set(false);
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.qbLocations = res.data as ILocation[];
            if (this.editmode) {
              this.mapForm.patchValue({
                bankAccount: this.qbData.OcwbankAccountId,
                qboClass: this.qbData.classMappingId,
                qboLocation: this.qbData.locationMappingId
              });
            }
          }
        })
    );
  }

  scrollClass(searchTerm: string) {
    this.subscriptions.push(
      this.checkService
        .GetCompanyDetailsPagination(
          `classes`,
          this.data.companyId as number,
          searchTerm !== '' ? 0 : this.classPage,
          searchTerm
        )
        .subscribe((res) => {
          if (res.success) {
            res.data.forEach((element: { name: string; id: string }) => {
              this.qbClass.push(element);
            });
            this.classPage += 1;
          }
        })
    );
  }

  /**
   * Submits the form data to map a bank account.
   */
  submit(): void {
    this.mapForm.markAsTouched();
    if (this.mapForm.invalid) {
      return;
    }
    if (this.appName === 'NetSuite') {
      this.netsuiteMap();
    } else if(this.appName === 'Odoo'){
      this.odooMap();
    } else {
      this.qbMapping();
    }
  }

  qbMapping(): void {
    const formValue = this.mapForm.value;
    const mappingData = {
      bankAccountId: formValue.bankAccount as string,
      classMappingId: formValue.qboClass as string,
      locationMappingId: formValue.qboLocation as string
    };
    this.loading = true;
    const operation$ = this.editmode
    ? this.integrationService.updateQboMapingBankAcc(mappingData, this.data.qbId)
    : this.integrationService.mapQbDesktopBankAcc({ ...mappingData, qbId: this.data.qbId });

    this.subscriptions.push(
      operation$.pipe(
        finalize(() => {
          this.loading = false;
        })
      ).subscribe((res) => {
        if (res?.success) {
          this.openSuccessAlert(this.editmode ? 'Updated successfully.' : 'Bank account mapped successfully.');
          this.matDilogRef.close(true);
        }
      })
    );
  }

  netsuiteMap() {
    const formValue = this.mapForm.value;
    const data = {
      ocwAccountId: formValue.bankAccount as string,
      netsuiteAccountId: this.data.qbId,
      subsidiaryMappingId: formValue.subsidiary as string
    };
    this.loading = true;
    this.subscriptions.push(
      this.netsuiteService
        .mapBank(data)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.openSuccessAlert('Bank account mapped successfully.');
            this.matDilogRef.close(true);
          }
        })
    );
  }

  /**
   * Opens the New Bank Account modal dialog.
   */
  openBankAccModal() {
    if (this.bankModalService.isBankPermissionChecking()) return;
    this.subscriptions.push(
      this.bankModalService.openAddBank().subscribe((bankModal) => {
        if (bankModal) {
          this.subscriptions.push(
            bankModal.afterClosed().subscribe((result) => {
              if (result?.success) {
                this.sharedService.setNewBankCreatedData({
                  bankAccountId: result.id
                });
                this.bankAccount.setValue(result.id);
                this.mapForm.controls.bankAccount.setValue(result.id);
              }
            })
          );
        }
      })
    );
  }

  odooMap() {
    const formValue = this.mapForm.value;
    const data = {
       id: this.data.qbId,
       bankAccountId: formValue.bankAccount as string
    };
    this.loading = true;
    if(this.editmode){
      this.subscriptions.push(
        this.odooService.updateOdooMapingBankAcc(data)
        .pipe(finalize(() => {
          this.loading = false;
        }))
        .subscribe({
          next: (res) => {
            if (res?.success) {
              this.openSuccessAlert('Bank account updated successfully.');
              this.matDilogRef.close(true);
            } else {
              const errorMessage = res?.message || res?.errorMsg || 'Failed to update bank account mapping.';
              this.openErrorAlert(errorMessage);
            }
          },
          error: (err) => {
            const errorMessage = err?.error?.message || err?.error?.errorMsg || err?.message || 'An error occurred while updating the mapping.';
            this.openErrorAlert(errorMessage);
          }
        })
      );
    }else{
      this.subscriptions.push(
        this.odooService.mapBank(data)
          .pipe(finalize(() => {
            this.loading = false;
          }))
          .subscribe({
            next: (res) => {
              if (res?.success) {
                this.openSuccessAlert('Bank account mapped successfully.');
                this.matDilogRef.close(true);
              } else {
                const errorMessage = res?.message || res?.errorMsg || 'Failed to map bank account.';
                this.openErrorAlert(errorMessage);
              }
            },
            error: (err) => {
              const errorMessage = err?.error?.message || err?.error?.errorMsg || err?.message || 'An error occurred while mapping the bank account.';
              this.openErrorAlert(errorMessage);
            }
          })
        );
    }
  }

  /**
   * Opens a success alert dialog with the provided content.
   * @param content The content to display in the success alert.
   */
  openSuccessAlert(content: string) {
    const data = {
      content,
      close: true
    };
    return this.alertService.successAlert(data);
  }


  openErrorAlert(content: string) {
    const data = {
      content,
      close: true
    };
    return this.alertService.failedAlert(data);
  }

  /**
   * Cleans up resources when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
