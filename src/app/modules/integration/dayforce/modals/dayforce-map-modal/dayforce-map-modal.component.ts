import { Component, inject, OnInit, signal } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CompanySwitchRepository } from 'src/app/modules/company-switch/repository/companySwitch.repository';
import { finalize, take } from 'rxjs';
import { IOwnCompany } from 'src/app/layout/model/header';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { V35CommonDropDownSelectorComponent } from 'src/app/shared/v3/v35-dropdown/v35-common-dropdown-selector.component';
import {
  Iv35ngSelectConfig,
  TListData
} from 'src/app/shared/v3/v35-dropdown/models/v35-common-dropdown-selector.interface';
import { BankAcDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { IBankDropdown } from 'src/app/models/bank';
import { IV3DropDownOnReady } from 'src/app/models/common';
import { IDayforceLocations } from '../../model/dayforce';

interface IDayforceMapModalData {
  location: IDayforceLocations;
  itsSubCompany: boolean;
}

@Component({
  selector: 'app-dayforce-map-modal',
  standalone: true,
  imports: [
    MatDialogClose,
    CommonButtonV35Component,
    FaIconComponent,
    ReactiveFormsModule,
    V35CommonDropDownSelectorComponent,
    BankAcDropdownV3Component,
    V35ControlMessageComponent
  ],
  templateUrl: './dayforce-map-modal.component.html',
  styleUrl: './dayforce-map-modal.component.scss'
})
export class DayforceMapModalComponent implements OnInit {
  public companySwitchRepo = inject(CompanySwitchRepository);
  public injectData = inject<IDayforceMapModalData>(MAT_DIALOG_DATA);
  public dialogRef = inject(MatDialogRef<DayforceMapModalComponent>);
  private integrationService = inject(IntegrationService);
  private alertService = inject(AlertService);

  faXmark = faXmark;
  isMapping = signal(false);
  isLoading = signal(false);
  companies = signal<IOwnCompany[]>([]);

  companyDropdownConfig: Iv35ngSelectConfig = {
    placeholder: 'Select Company',
    displayField: 'companyName',
    outputField: 'companyId',
    style: {
      size: 2,
      enableLabelIcon: true,
      labelIconData: {
        icon_fa: ['fas', 'building'],
        color: 'common-blue-color'
      }
    }
  };

  companyDropdownList: TListData[] = [];

  mapForm = new FormGroup({
    companyUserId: new FormControl('', [Validators.required]),
    bankAccountId: new FormControl('')
  });

  ngOnInit(): void {
    this.getCompanies();
    if (this.injectData.itsSubCompany) {
      this.mapForm.get('bankAccountId')?.setValidators([Validators.required]);
      this.mapForm.get('bankAccountId')?.updateValueAndValidity();
    }
    // Pre-fill if already mapped
    if (this.injectData.location.company?.id) {
      this.mapForm
        .get('companyUserId')
        ?.setValue(this.injectData.location.company.id);
    }
    if (this.injectData.location.bank_account?.id) {
      this.mapForm
        .get('bankAccountId')
        ?.setValue(this.injectData.location.bank_account.id);
    }
  }

  getCompanies() {
    this.isLoading.set(true);
    this.companySwitchRepo
      .getOwnCompanies()
      .pipe(
        finalize(() => this.isLoading.set(false)),
        take(1)
      )
      .subscribe((res) => {
        if (res.success) {
          this.companies.set(res.data);
          this.companyDropdownList = res.data.filter(
            (company) =>
              company.id !== this.injectData.location.company?.id &&
              company.id !== 0
          );
        }
      });
  }

  onBankAccountChange(bank: IBankDropdown | null | undefined): void {
    this.mapForm.get('bankAccountId')?.setValue(bank?.id ?? '');
    this.mapForm.get('bankAccountId')?.markAsTouched();
  }

  onMapNow() {
    this.mapForm.markAllAsTouched();
    if (this.mapForm.invalid) return;

    const payload = {
      locationXRefCode: this.injectData.location.location_xref_code,
      companyUserId: this.mapForm.get('companyUserId')?.value || '',
      bankAccountId: this.mapForm.get('bankAccountId')?.value || ''
    };

    this.isMapping.set(true);
    this.integrationService
      .mapDayforceLocation(payload)
      .pipe(
        finalize(() => this.isMapping.set(false)),
        take(1)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.alertService.successAlert({
              content: res.message || 'Location mapped successfully.'
            });
            this.dialogRef.close(true);
          }
        }
      });
  }

  autoPopulateDropdown(ev: IV3DropDownOnReady, id: string) {
    if (ev.setItemWithId && id) {
      ev.setItemWithId(id);
    }
  }
}
