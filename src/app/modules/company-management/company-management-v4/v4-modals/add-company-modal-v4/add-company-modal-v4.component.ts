import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { finalize, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { CompanySwitchRepository } from 'src/app/modules/company-switch/repository/companySwitch.repository';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { AddressAutocompleteV4Component } from 'src/app/shared/V4/address-autocomplete-v4/address-autocomplete-v4.component';
import {
  DOUBLE_SIDE_MODAL_DATA,
  DOUBLE_SIDE_MODAL_REF
} from 'src/app/shared/modal/custom-double-side-modal/custom-double-side-modal.tokens';
import { DoubleSideModalRef } from 'src/app/shared/modal/custom-double-side-modal/custom-double-side-modal-ref';
import { MatDialog } from '@angular/material/dialog';
import { V4UploadImageModalComponent } from 'src/app/shared/modal/v4-upload-image-modal/v4-upload-image-modal.component';
import { Utils } from 'src/app/data/utils';
import { IOwnCompany } from 'src/app/layout/model/header';
import { IGoogleAddress } from 'src/app/modules/more/model/google-autocomplete';
import { CommonCountryDropdownV4Component } from 'src/app/shared/V4/common-country-dropdown-v4/common-country-dropdown-v4.component';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { Iv4ngSelectConfig } from 'src/app/shared/V4/v4-dropdown/models/v4-common-dropdown-selector.interface';

@Component({
  selector: 'app-add-company-modal-v4',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    AddressAutocompleteV4Component,
    CommonCountryDropdownV4Component,
    V4CommonDropDownSelectorComponent
  ],
  templateUrl: './add-company-modal-v4.component.html',
  styleUrls: ['./add-company-modal-v4.component.scss']
})
export class AddCompanyModalV4Component implements OnInit {
  private fb = inject(FormBuilder);
  private datePipe = inject(DatePipe);
  private destroyRef = inject(DestroyRef);
  private companySwitchRepo = inject(CompanySwitchRepository);
  private alertService = inject(V4AlertService);
  private headerService = inject(HeaderService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  public data = inject(DOUBLE_SIDE_MODAL_DATA) as {
    editMode?: boolean;
    companyKeyId?: string;
    companyDetails?: IOwnCompany;
  };

  private modalRef = inject<DoubleSideModalRef>(DOUBLE_SIDE_MODAL_REF);

  businessForm = this.fb.nonNullable.group({
    businessLegalName: ['', [Validators.required]],
    businessAddress1: [''],
    businessAddress2: [''],
    city: [''],
    state: [''],
    zip: ['', [ValidationService.zipValidator]],
    others: [''],
    entityType: [''],
    dba: [''],
    date: [''],
    industryType: [''],
    ein: ['', [Validators.minLength(9)]],
    country: [''],
    companyLogo: new FormControl<string | { blob: Blob; url: string }>('', {
      nonNullable: true
    }),
    companyLogoUrl: ['']
  });

  loading = signal(false);
  profilePic = signal('');
  nowDate: string;

  readonly entityTypes = [
    { value: 'singleMemberLLC', label: 'Sole Proprietor' },
    { value: 'soleProprietor', label: 'Single Member LLC' },
    { value: 'limitedLiabilityCompany', label: 'Limited Liability Company' },
    { value: 'generalPartnership', label: 'General Partnership' },
    { value: 'unlistedCorporation', label: 'Unlisted Corporation' },
    {
      value: 'publiclyTradedCorporation',
      label: 'Publicly Traded Corporation'
    },
    { value: 'association', label: 'Association' },
    { value: 'nonProfit', label: 'Non-Profit Organization' },
    { value: 'governmentOrganization', label: 'Government Organization' },
    { value: 'revocableTrust', label: 'Revocable Trust' },
    { value: 'irrevocableTrust', label: 'Irrevocable Trust' },
    { value: 'estate', label: 'Estate' }
  ];

  readonly industryTypes = [
    { value: 'retail', label: 'Retail' },
    { value: 'wholesale', label: 'Wholesale' },
    { value: 'restaurants', label: 'Restaurants' },
    { value: 'hospitals', label: 'Hospitals' },
    { value: 'construction', label: 'Construction' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'unions', label: 'Unions' },
    { value: 'realEstate', label: 'Real Estate' },
    { value: 'freelanceProfessional', label: 'Freelance Professional' },
    {
      value: 'otherProfessionalServices',
      label: 'Other Professional Services'
    },
    { value: 'onlineRetailer', label: 'Online Retailer' },
    { value: 'otherEducationServices', label: 'Other Education Services' }
  ];

  readonly entityTypeDropdownConfig: Iv4ngSelectConfig = {
    placeholder: 'Select type',
    displayField: 'label',
    outputField: 'value'
  };

  readonly industryTypeDropdownConfig: Iv4ngSelectConfig = {
    placeholder: 'Select industry',
    displayField: 'label',
    outputField: 'value'
  };

  get isEditMode(): boolean {
    return !!this.data?.editMode;
  }

  constructor() {
    this.nowDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd') as string;
  }

  ngOnInit(): void {
    if (this.isEditMode && this.data.companyDetails) {
      this.patchFormWithCompanyDetails(this.data.companyDetails);
    }
  }

  private patchFormWithCompanyDetails(details: IOwnCompany): void {
    const info = details.businessInfo;
    if (!info) return;

    this.businessForm.patchValue({
      businessLegalName: info.companyName ?? '',
      businessAddress1: info.companyAddressLine1 ?? '',
      businessAddress2: info.companyAddressLine2 ?? '',
      city: info.companyCity ?? '',
      state: info.companyState ?? '',
      zip: info.companyZip ?? '',
      country: info.companyCountry ?? '',
      dba: info.dba ?? '',
      date: info.formationDate ?? '',
      industryType: info.industryType ?? '',
      entityType: info.entityType ?? '',
      ein: info.ein ?? '',
      companyLogoUrl: info.companyLogoUrl ?? ''
    });

    this.profilePic.set(info.companyLogoUrl ?? '');
  }

  onAddressSelected(address: IGoogleAddress): void {
    this.businessForm.patchValue({
      businessAddress1: address.address,
      city: (address.city ?? '').trim(),
      state: (address.state ?? '').trim(),
      zip: (address.zip ?? '').trim(),
      country: address.country
    });
  }

  imgUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      if (Utils.maxSizeValidator(file.size)) {
        this.alertService.warningAlert({ content: 'Maximum size is 5MB.' });
        return;
      }
      if (!Utils.fileTypeValidator(input.files[0], ['svg'])) {
        this.alertService.warningAlert({
          content: 'SVG files are not supported!'
        });
        return;
      }
    }

    const dialogRef = this.dialog.open(V4UploadImageModalComponent, {
      maxWidth: '500px',
      width: '93%',
      data: { event },
      panelClass: 'paddingless-modal-rounded'
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result?.image) {
          this.profilePic.set(result.image.url);
          this.businessForm.patchValue({ companyLogo: result.image });
        }
      });
  }

  submit(): void {
    if (this.isEditMode) {
      this.editCompany();
    } else {
      this.addCompany();
    }
  }

  private addCompany(): void {
    if (this.businessForm.invalid) {
      this.businessForm.markAllAsTouched();
      return;
    }

    const name = this.businessForm.getRawValue().businessLegalName;
    this.loading.set(true);

    this.companySwitchRepo
      .addNewCompany(name)
      .pipe(
        switchMap((res) => {
          if (!res.success) return of(null);

          const newCompanyId = res.data.id as string;
          const formData = this.buildFormData();

          if (formData) {
            return this.companySwitchRepo
              .updateCompanyBusiness(newCompanyId, formData)
              .pipe(switchMap(() => of(res)));
          }
          return of(res);
        }),
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.alertService.successAlert({
              title: 'Success',
              content: 'Company added successfully.',
              close: true,
              timeout: 2000
            });
            this.headerService.setHeaderValueChanged(true);
            this.modalRef.close({ success: true, data: res.data });
          }
        },
        error: (err) => {
          if (err?.error?.errorCode === 631) {
            this.showVerifyAlert(err.error.errorMsg);
          }
        }
      });
  }

  /** Builds FormData for additional fields (address, logo, etc.). Returns null if only name was filled. */
  private buildFormData(): FormData | null {
    const values = this.businessForm.getRawValue();
    const hasExtraFields =
      values.businessAddress1 ||
      values.businessAddress2 ||
      values.city ||
      values.state ||
      values.zip ||
      values.country ||
      values.entityType ||
      values.dba ||
      values.date ||
      values.industryType ||
      values.ein ||
      values.companyLogo;

    if (!hasExtraFields) return null;

    const formationDate = this.datePipe.transform(values.date, 'MM/dd/yyyy');
    const formData = new FormData();

    formData.append('companyName', values.businessLegalName);
    formData.append('companyAddressLine_1', values.businessAddress1 || '');
    formData.append('companyAddressLine_2', values.businessAddress2 || '');
    formData.append('companyCity', values.city || '');
    formData.append('companyState', values.state || '');
    formData.append('companyZip', values.zip || '');
    formData.append('companyCountry', values.country || '');
    formData.append('entityType', values.entityType || '');
    formData.append('dba', values.dba || '');
    formData.append('formationDate', formationDate || '');
    formData.append('industryType', values.industryType || '');
    formData.append('ein', values.ein || '');
    formData.append('_method', 'PUT');

    const logo = values.companyLogo;
    if (typeof logo === 'object' && logo?.blob) {
      const blob = new Blob([logo.blob], { type: 'image/jpg' });
      const imageFile = new File([blob], 'profile_pic_img.jpg', {
        type: 'image/jpg'
      });
      formData.append('companyLogo', imageFile, 'image.jpg');
    }

    return formData;
  }

  private editCompany(): void {
    if (this.businessForm.invalid) {
      this.businessForm.markAllAsTouched();
      return;
    }

    const { companyKeyId } = this.data;
    if (!companyKeyId) return;

    const formData = this.buildFormData() ?? new FormData();
    formData.set(
      'companyName',
      this.businessForm.getRawValue().businessLegalName
    );
    if (!formData.has('_method')) formData.append('_method', 'PUT');

    this.loading.set(true);

    this.companySwitchRepo
      .updateCompanyBusiness(companyKeyId, formData)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            title: 'Success',
            content: 'Business Info Updated',
            close: true,
            timeout: 2000
          });
          this.headerService.setHeaderValueChanged(true);
          this.modalRef.close({ success: true });
        }
      });
  }

  private showVerifyAlert(message: string): void {
    this.alertService
      .warningAlert({
        content: message,
        doneMsg: 'Verify Now',
        isCancel: true,
        cancelMsg: 'Cancel'
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.modalRef.close();
          this.dialog.closeAll();
          this.router.navigate(['/v4/manage/verification/index'], {
            queryParams: { openVerificationModal: true }
          });
        }
      });
  }

  close(): void {
    this.modalRef.close();
  }
}
