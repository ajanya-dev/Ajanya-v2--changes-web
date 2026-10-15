import { CompanySwitchRepository } from 'src/app/modules/company-switch/repository/companySwitch.repository';
import { DatePipe, NgClass, NgStyle } from '@angular/common';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { delay, distinctUntilChanged, finalize } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CompanyManagementService } from 'src/app/shared/service/company/company-management.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { UserService } from 'src/app/shared/service/user/user.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { UploadImageModalComponent } from 'src/app/shared/modal/upload-image-modal/upload-image-modal.component';
import { Utils } from 'src/app/data/utils';
import { IInvitedCompany, IOwnCompany } from 'src/app/layout/model/header';
import { IApiRes } from 'src/app/models/api';
import { mainStateActions } from 'src/app/modules/store';
import { Store } from '@ngrx/store';
import { DataTableCacheService } from 'src/app/shared/service/indexedDb/data-table-cache.service';
import { MatTooltip } from '@angular/material/tooltip';
import { NgxMaskDirective } from 'ngx-mask';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faLink } from '@fortawesome/pro-solid-svg-icons';
import { UserManagementV35Service } from 'src/app/modules/user-management/service/user-management-v35.service';
import { PayeeDataV35Service } from 'src/app/modules/payee/payee-v3/v35-services/payee-data-v35.service';
import { OtpModalComponent } from 'src/app/modules/cloud-bank/cloud-bank-v2/modals/otp-modal/otp-modal.component';
import { IDeletedCompanies } from '../../model/company-managment';
import { CompanyManagementListAddModalComponent } from '../../modals/company-management-list-add-modal/company-management-list-add-modal.component';
import { CompanyCancelDeletionModalComponent } from '../../modals/company-cancel-deletion-modal/company-cancel-deletion-modal.component';
import { GoogleAddressService } from '../../../../core/services/google-address.service';
import { CommonCountryDropDownComponent } from '../../../../shared/v3/common-country-drop-down/common-country-drop-down.component';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';
import { ConfirmPermenantDeletionComponent } from '../../modals/confirm-permenant-deletion/confirm-permenant-deletion.component';
import { OnboardingLinkModalComponent } from '../../modals/onboarding-link-modal/onboarding-link-modal.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';

@Component({
  selector: 'app-company-management-list',
  templateUrl: './company-management-list.component.html',
  styleUrls: ['./company-management-list.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    FaIconComponent,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    CommonCountryDropDownComponent,
    NgxMaskDirective,
    MatTooltip,
    NgStyle,
    CommonButtonV35Component
  ]
})
export class CompanyManagementListsComponent implements OnInit, OnDestroy {
  @ViewChild('searchAddress')
  public searchElementRef!: ElementRef;

  businessForm!: UntypedFormGroup;
  subscriptions: Subscription[] = [];
  companieDetails: IOwnCompany;
  ownCompanies: IOwnCompany[] = [];
  invitedCompany: IInvitedCompany[];
  deletedCompanies: IDeletedCompanies[] = [];
  isSelectedCurrentCompany = false;
  companyKeyId: string;
  companyId: string;
  deletedCompanyId: string;
  clientManagementId: string;
  activeIndex = 0;
  mailForm: UntypedFormGroup;
  selectedCompanyType = 'ownCompanies';
  date: IDeletedCompanies;
  inviteAccess = false;
  companyLogo: string;
  profilePic: string;
  readonly faLink = faLink;

  loading = {
    loading: false,
    defaultLoading: false,
    resending: false,
    removingAccess: false,
    disabling: false,
    companySwitching: false,
    userFormSubmitting: false
  };

  newUserForm: UntypedFormGroup;
  croppedImage: string;
  formDate: string | null;
  clientType: string | Blob = '3';
  nowDate: string;
  sessionKey: string;

  private googleAddressService = inject(GoogleAddressService);
  private companyManagementService = inject(CompanyManagementService);
  public formBuilder = inject(UntypedFormBuilder);
  private dialog = inject(MatDialog);
  private datePipe = inject(DatePipe);
  private alertService = inject(AlertService);
  private headerService = inject(HeaderService);
  private dataTableService = inject(DataTableService);
  private fb = inject(UntypedFormBuilder);
  private userService = inject(UserService);
  private router = inject(Router);
  public companySwitchRepo = inject(CompanySwitchRepository);
  private dtCacheService = inject(DataTableCacheService);
  private route = inject(ActivatedRoute);
  private store = inject(Store);
  private userManagementService = inject(UserManagementV35Service);
  private payeeDataV35Service = inject(PayeeDataV35Service);

  ngOnInit(): void {
    this.businessDetails();
    this.getAllOwnCompanies();
    this.getAllDeletedCompanies();
    this.getAllInvitedCompanies();
    this.initUserForm();
    this.googleAddressService.resetGoogleAutocompleteAPI();
    if (this.route.snapshot.queryParamMap.get('action') === 'createCompany') {
      this.addNewCompany();
    }
    this.nowDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd') as string;
  }

  /**
   * @description Initializes the form group used for adding new users to a company
   */
  initUserForm() {
    this.newUserForm = this.fb.group({
      email: [null, [Validators.required, ValidationService.emailValidator]],
      confirmUserEmail: [null, [Validators.required]],
      name: [null, [Validators.required]],
      nickName: [null, [Validators.required]],
      companyName: [null, [Validators.required]],
      clientType: 3
    });
  }

  /**
   * @description Function for submit new user form as FormData
   */
  newUserSubmit() {
    this.newUserForm.markAllAsTouched();
    if (
      this.newUserForm.valid &&
      this.newUserForm.value.email === this.newUserForm.value.confirmUserEmail
    ) {
      const formData = new FormData();
      formData.append('email', this.newUserForm.value.email);
      formData.append('username', this.newUserForm.value.name);
      formData.append('name', this.newUserForm.value.name);
      formData.append('nickName', this.newUserForm.value.nickName);
      formData.append('companyName', this.newUserForm.value.companyName);
      formData.append('clientType', this.clientType);
      if(this.sessionKey) {
        formData.append('session_key', this.sessionKey);
      }

      this.loading.userFormSubmitting = true;
      this.subscriptions.push(
        this.userService
          .addUsers(formData)
          .pipe(
            finalize(() => {
              this.loading.userFormSubmitting = false;
            })
          )
          .subscribe({
          next: (res) => {
              if (res.success) {
              this.alertService.successAlert({
                title: 'Success',
                content: 'Invitation sent.',
                close: true,
                timeout: 2000
              });
              this.getAllInvitedCompanies();
              this.newUserForm.reset();
            }
          },
          error: (err) => {
            if (err.error.errorCode === '112') {
              this.sessionKey = err.error.session_key;
              const dialog = this.dialog.open(OtpModalComponent, {
                maxWidth: '410px',
                width: '100%',
                disableClose: true,
                autoFocus: false,
                data: err.error
              });
              dialog.afterClosed().subscribe((result) => {
                if (result) {
                  this.newUserSubmit();
                }
              });
            }
          }
        })
      );
    }
  }

  /**
   * @description Business Form initialization
   */
  businessDetails(): void {
    this.businessForm = this.formBuilder.group({
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
      companyLogo: [''],
      companyLogoUrl: ['']
    });
  }

  /**
   * @description Function for accepting the company request
   * @param companyType type of company @type string
   */
  requestAccept(companyType: string) {
    const alert = this.openConfirmAlert('Are you sure you want to accept?');
    alert.afterClosed().subscribe((r) => {
      if (r) {
        this.loading.resending = true;
        this.loading.disabling = true;
        this.subscriptions.push(
          this.companySwitchRepo
            .acceptCompany(this.clientManagementId)
            .pipe(
              finalize(() => {
                this.loading.resending = false;
                this.loading.disabling = false;
              })
            )
            .subscribe((res) => {
              if (res.success) {
                this.openSuccessAlert(res.message);
                this.selectedCompanyType = companyType;
                this.headerService.setHeaderValueChanged(true);
              }
            })
        );
      }
    });
  }

  /**
   * @description Reject the company request
   */
  requestReject() {
    const alert = this.openConfirmAlert('Are you sure you want to accept?');
    alert.afterClosed().subscribe((r) => {
      if (r) {
        this.loading.removingAccess = true;
        this.loading.disabling = true;
        this.subscriptions.push(
          this.companySwitchRepo
            .requestReject({ clientManagementId: this.clientManagementId })
            .pipe(
              finalize(() => {
                this.loading.removingAccess = false;
                this.loading.disabling = false;
              })
            )
            .subscribe((res) => {
              if (res.success) {
                this.scrollToTop();
                this.tabChange(0, 'ownCompanies', this.companyId);
                this.openSuccessAlert(res.message);
                this.getAllInvitedCompanies();
                this.headerService.setHeaderValueChanged(true);
              }
            })
        );
      }
    });
  }

  /**
   * @description Removing the access of company
   */
  removeAccess() {
    const activeCompany  = this.companyManagementService.getActiveCompanyId();
    const companyToDelete = this.invitedCompany.find(company => company.id === this.clientManagementId);
    if(activeCompany === companyToDelete?.companyId) {
      this.alertService.warningAlert({ content: 'You cannot remove access to the active company.' });
      return;
    }
    const alert = this.openConfirmAlert(
      'Are you sure you want to remove access?'
    );
    alert.afterClosed().subscribe((r) => {
      if (r) {
        this.loading.removingAccess = true;
        this.loading.disabling = true;
        this.subscriptions.push(
          this.companySwitchRepo
            .removeAccess(this.clientManagementId)
            .pipe(
              finalize(() => {
                this.loading.removingAccess = false;
                this.loading.disabling = false;
              })
            )
            .subscribe((res) => {
              if (res.success) {
                this.getAllInvitedCompanies();
                this.scrollToTop();
                this.openSuccessAlert(res.message);
                this.tabChange(0, 'ownCompanies',this.companyId);
                this.headerService.setHeaderValueChanged(true);
              }
            })
        );
      }
    });
  }

  /**
   * @description To upload the company logo
   * @param env
   * @returns
   */
  imgUpload(event: Event & { target: HTMLInputElement }) {
    if (event.target.files && event.target.files.length) {
      const file = ((event.target as HTMLInputElement).files as FileList)[0];
      if (Utils.maxSizeValidator(file.size)) {
        this.alertService.warningAlert({ content: 'Maximum size is 5MB.' });
        return;
      }
      if (!Utils.fileTypeValidator(event.target.files[0], ['svg'])) {
        this.alertService.warningAlert({
          content: 'SVG files are not supported!!'
        });
        return;
      }
    }

    const dialogRef = this.dialog.open(UploadImageModalComponent, {
      maxWidth: '500px',
      width: '93%',
      data: { event }
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.loading.loading = true;
      this.profilePic = result.image.url;

      if (result.image) {
        this.businessForm.value.companyLogo = result.image;
      }
    });
  }

  /**
   * @description To resend invitation for a company
   */
  resendRequest() {
    this.loading.resending = true;
    this.loading.disabling = true;
    this.subscriptions.push(
      this.companySwitchRepo
        .resendInvitation(this.clientManagementId)
        .pipe(
          finalize(() => {
            this.loading.resending = false;
            this.loading.disabling = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.openSuccessAlert(res.message);
          }
        })
    );
  }

  /**
   * @description To get all invited company details
   */
  getAllInvitedCompanies() {
    this.subscriptions.push(
      this.companySwitchRepo.getInvitedCompanies().subscribe((res) => {
        if (res?.success) {
          this.invitedCompany = [];
          res.data.forEach((el) => {
            if (el.status !== 2) {
              this.invitedCompany.push(el);
              this.selectInvitedCompany();
            }
          });
        }
      })
    );
  }

  /**
   * @description Get all deleted companies and their details
   * @param id
   */
  getAllDeletedCompanies(id?: string) {
    this.subscriptions.push(
      this.companySwitchRepo.getDeletedCompanies().subscribe((res) => {
        this.deletedCompanies = res.data;

        if (id) {
          // when delete company
          res.data.forEach((e: IDeletedCompanies, index: number) => {
            if (id === e.id) this.tabChange(index, 'deletedCompany', e.companyId);
          });
        }
      })
    );
  }

  /**
   * @description Get all our own companies and their details
   * @param isReload @type boolean . gives the value wheather it's calling when reload or not
   * @param id @type string
   */
  getAllOwnCompanies(isReload?: boolean, id?: string) {
    if (!isReload) {
      this.loading.defaultLoading = true;
    }

    this.subscriptions.push(
      this.companySwitchRepo
        .getOwnCompanies()
        .pipe(
          finalize(() => {
            this.loading.defaultLoading = false;
          })
        )
        .subscribe((res) => {
          this.ownCompanies = res.data;

          if (!isReload) {
            // initial load
            // this.tabChange(0, 0, 'ownCompanies');
            this.getCurrentCompany(true);
          }

          if (id) {
            // make as selected when restore
            res.data.forEach((e: IOwnCompany, index: number) => {
              if (id === e.id) {
                this.tabChange(index, 'ownCompanies', e.companyId);
              }
            });
          }
        })
    );
  }

  /**
   * @description Switching between tabs (invited companies, deleted companies, owned companies).
   *  It updates the active tab index, selected company type, and retrieves the company details based on the selected index.
   * @param index Tab index
   * @param companyType Company type
   * @param status Status code form select company type
   * @param id Id of invited company
   */
  tabChange(
    index: number,
    companyType: string,
    companyId: string,
    status?: number,
    id?: string,
  ) {
    this.subscriptions.push(
    this.companyManagementService.checkCompanyAccessPermission(
      companyId, 
      (res) => {
      this.onCompanyAccess(res,companyType,companyId,index,status,id);
    }).subscribe());
  }

  onCompanyAccess(data: {success:boolean,access:number,errorMsg:string,errorCode:number},companyType:string,companyId:string,index:number,status?:number,id?:string){
    if(data.success && data.access === 1){
      if(companyType === 'invitedCompanyDetails'){
        this.checkCompanyPermssion(index, companyType, companyId, status, id);
      }else{
        this.onSelectCompany(index, companyType, status, id);
      }
    }
  }

  onSelectCompany(
    index: number,
    companyType: string,
    status?: number,
    id?: string
  ) {
    this.selectedCompanyType = companyType;

    if (status === 0) {
      this.selectedCompanyType = 'invitedCompanyDetails';
    } else if (status === 3) {
      this.selectedCompanyType = 'requestedCompanyDetails';
    } else if (status === 1) {
      this.selectedCompanyType = 'inviteAccess';
    }
    if (id) {
      this.clientManagementId = id;
    }

    this.activeIndex = index;

    this.companyKeyId = this.ownCompanies[index]?.id as string;
    this.companyId = this.ownCompanies[index]?.companyId;

    this.deletedCompanyId = this.deletedCompanies[index]?.id;

    if (status !== 111) {
      // do not call at initial load
      this.getCurrentCompany(false);
    }

    this.subscriptions.push(
      this.companySwitchRepo
        .getCompaniesDetails(this.ownCompanies[index].id as string)
        .subscribe((response: IApiRes<IOwnCompany>) => {
          this.companieDetails = response.data;
          this.businessForm.patchValue({
            businessLegalName: response.data.businessInfo?.companyName,
            businessAddress1: response.data.businessInfo?.companyAddressLine1
              ? response.data.businessInfo?.companyAddressLine1
              : '',
            businessAddress2: response.data.businessInfo?.companyAddressLine2
              ? response.data.businessInfo?.companyAddressLine2
              : '',
            city: response.data.businessInfo?.companyCity
              ? response.data.businessInfo?.companyCity
              : '',
            state: response.data.businessInfo?.companyState
              ? response.data.businessInfo?.companyState
              : '',
            zip: response.data.businessInfo?.companyZip
              ? response.data.businessInfo?.companyZip
              : '',
            country: response.data.businessInfo?.companyCountry
              ? response.data.businessInfo?.companyCountry
              : '',
            dba: response.data.businessInfo?.dba
              ? response.data.businessInfo?.dba
              : '',
            date: response.data.businessInfo?.formationDate,
            industryType: response.data.businessInfo?.industryType
              ? response.data.businessInfo?.industryType
              : '',
            entityType: response.data.businessInfo?.entityType
              ? response.data.businessInfo?.entityType
              : '',
            ein: response.data.businessInfo?.ein
              ? response.data.businessInfo?.ein
              : '',
            companyLogoUrl: response.data.businessInfo?.companyLogoUrl
          });

          this.profilePic = response.data.businessInfo?.companyLogoUrl ?? '';
        })
    );

    // if (index && tr) {
    this.subscriptions.push(
      this.companySwitchRepo.getDeletedCompanies().subscribe((response) => {
        this.date = response.data[index];
      })
    );
  }

  async checkCompanyPermssion(
    index: number,
    companyType: string,
    companyId: string,
    status?: number,
    id?: string
  ) {
    try {
      const hasPermission =
        await this.companyManagementService.checkPermission(companyId);
      if (hasPermission) {
        this.onSelectCompany(index, companyType, status, id);
      }
    } catch (error) {
      /* empty */
    }
  }

  /**
   * @description Opens the modal for adding a new company.
   *
   * This function manages the modalQueue to avoid opening the demo and add new company modals simultaneously.
   */
  addNewCompany() {
    this.headerService.enqueueModal('addCompany');
    this.subscriptions.push(
      this.headerService.modalQueue$
        .pipe(distinctUntilChanged())
        .subscribe((modalQueue) => {
          if (
            modalQueue.length &&
            modalQueue[0].modal === 'addCompany' &&
            !modalQueue[0].wasOpened
          ) {
            this.headerService.updateModalStatus();
            this.openAddNewCompany();
          }
        })
    );
  }

  /**
   * @description Opens modal for adding new company
   */
  openAddNewCompany() {
    const dialogref = this.dialog.open(CompanyManagementListAddModalComponent, {
      maxWidth: '400px',
      width: '100%',
      data: {
        company: 'company'
      }
    });

    dialogref.afterClosed().subscribe((res) => {
      this.headerService.dequeueModal();
      if (res) {
        this.openSuccessAlert('Company added successfully.');
        this.ownCompanies.push(res);
        this.getAllOwnCompanies(true);
      }
    });
  }

  /**
   * @description Opens the modal for generating or emailing an enterprise onboarding link
   * @param company Selected own company
   */
  openOnboardingLink(company: IOwnCompany) {
    if (!company?.customerRef) return;

    this.dialog.open(OnboardingLinkModalComponent, {
      panelClass: 'paddingless-modal-rounded-v3',
      maxWidth: '95vw',
      width: '440px',
      autoFocus: false,
      disableClose: true,
      data: {
        customerRef: company.customerRef,
        companyName: company.companyName
      }
    });
  }

  /**
   * @description Cancel the deletion of company
   */
  cancelDeletion() {
    const modal = this.dialog.open(CompanyCancelDeletionModalComponent, {
      maxWidth: '400px',
      width: '100%',
      data: { companyId: this.deletedCompanyId }
    });

    modal.afterClosed().subscribe((res) => {
      if (res.success) {
        this.openSuccessAlert('Company reopened successfully.');
        this.getAllDeletedCompanies();
        this.getAllInvitedCompanies();
        this.getAllOwnCompanies(true, res.id);
      }
    });
  }

  /**
   * @description Save the updated details of company by checking validation and converting into formData
   * @returns
   */
  editCompany() {
    if (this.businessForm.invalid) {
      this.businessForm.markAllAsTouched();
      return;
    }

    const values = this.businessForm.value;
    const formationDate = this.datePipe.transform(values.date, 'MM/dd/yyyy');

    if (values.companyLogo) {
      const blob = new Blob([values.companyLogo.blob], { type: 'image/jpg' });
      const imageFile = new File([blob], 'profile_pic_img.jpg', {
        type: 'image/jpg'
      });

      this.formDate = formationDate;

      const formData = new FormData();
      formData.append('companyName', values.businessLegalName);
      formData.append(
        'companyAddressLine_1',
        values.businessAddress1 ? values.businessAddress1 : ''
      );
      formData.append(
        'companyAddressLine_2',
        values.businessAddress2 ? values.businessAddress2 : ''
      );
      formData.append('companyCity', values.city ? values.city : '');
      formData.append('companyState', values.state ? values.state : '');
      formData.append('companyZip', values.zip ? values.zip : '');
      formData.append('companyCountry', values.country ? values.country : '');
      formData.append('entityType', values.entityType ? values.entityType : '');
      formData.append('dba', values.dba ? values.dba : '');
      formData.append('formationDate', this.formDate ? this.formDate : '');
      formData.append('industryType', values.industryType);
      formData.append('ein', values.ein);
      formData.append('companyLogo', imageFile, 'image.jpg');
      formData.append('_method', 'PUT');

      this.loading.disabling = true;
      this.subscriptions.push(
        this.companySwitchRepo
          .updateCompanyBusiness(this.companyKeyId, formData)
          .pipe(
            finalize(() => {
              this.loading.disabling = false;
            })
          )
          .subscribe((res) => {
            if (res.success) {
              this.openSuccessAlert('Business Info Updated');
              this.getAllOwnCompanies(true);
              this.headerService.setHeaderValueChanged(true);
            }
          })
      );
    } else {
      this.formDate = formationDate;
      const formData = new FormData();
      formData.append('companyName', values.businessLegalName);
      formData.append(
        'companyAddressLine_1',
        values.businessAddress1 ? values.businessAddress1 : ''
      );
      formData.append(
        'companyAddressLine_2',
        values.businessAddress2 ? values.businessAddress2 : ''
      );
      formData.append('companyCity', values.city ? values.city : '');
      formData.append('companyState', values.state ? values.state : '');
      formData.append('companyZip', values.zip ? values.zip : '');
      formData.append('companyCountry', values.country ? values.country : '');
      formData.append('entityType', values.entityType ? values.entityType : '');
      formData.append('dba', values.dba ? values.dba : '');
      formData.append('formationDate', this.formDate ? this.formDate : '');
      formData.append('industryType', values.industryType);
      formData.append('ein', values.ein);
      formData.append('_method', 'PUT');

      this.loading.disabling = true;
      this.subscriptions.push(
        this.companySwitchRepo
          .updateCompanyBusiness(this.companyKeyId, formData)
          .pipe(
            finalize(() => {
              this.loading.disabling = false;
            })
          )
          .subscribe((res) => {
            if (res.success) {
              this.openSuccessAlert('Business Info Updated');
              this.getAllOwnCompanies(true);
              this.headerService.setHeaderValueChanged(true);
            }
          })
      );
    }
  }

  /**
   * @description Delete an existing company
   * @param ownCompanies User's companies
   */
  deleteCompany() {
    const alert = this.openConfirmAlert(
      'Are you sure you want to delete this company? You will lose all the associated data.'
    );
    alert.afterClosed().subscribe((response) => {
      if (response) {
        const deleteModal = this.dialog.open(
          ConfirmPermenantDeletionComponent,
          {
            maxWidth: '400px',
            width: '100%',
            data: { companyId: this.companyKeyId }
          }
        );

        deleteModal.afterClosed().subscribe((res) => {
          if (res.success) {
            this.getAllDeletedCompanies(res.id);
            this.getAllInvitedCompanies();
            this.getAllOwnCompanies(true);
            this.headerService.setHeaderValueChanged(true);
          }
        });
      }
    });
  }

  /**
   * @description Switching the current company into another company
   * @param companyDetails
   */
  switchCompany(companyDetails: IOwnCompany[]): void {
    this.dtCacheService.resetTablePostData();
    this.store.dispatch(mainStateActions.resetStatesOnCompanyChange());
    companyDetails.forEach((e) => {
      if (e.id === this.companyKeyId) {
        this.companyManagementService.setActiveCompanyInfo(
          e.companyId,
          e.companyName,
          'owncmp',
          e.isItDefault ?? 0
        );
        this.userManagementService.selectedUser$.next(false);
        this.dtCacheService.deleteDb();
        this.headerService.setHeaderValueChanged(true);
        this.dataTableService.setRefreshStatus(true);
        this.payeeDataV35Service.resetPayeeSignal();
        this.companyManagementService.setCompanyChange(true);
        const navigationSub = this.router.events.subscribe((event) => {
          if (
            event instanceof NavigationEnd &&
            event.urlAfterRedirects === '/manage/home'
          ) {
            // eslint-disable-next-line no-restricted-globals
            location.reload();
            navigationSub.unsubscribe();
          }
        });

        this.router.navigate(['/manage/home']);
      }
    });
  }

  /**
   * @description Get's the current company details
   * @param isFirstLoad @type boolean for checking wheather its first loading or not
   */
  getCurrentCompany(isFirstLoad: boolean): void {
    const currentId = this.companyManagementService.getActiveCompanyId();

    if (isFirstLoad) {
      this.ownCompanies?.forEach((r: IOwnCompany, i: number) => {
        if (r.companyId === currentId) {
          this.tabChange(i, 'ownCompanies',r.companyId);
        }
      });
    }

    if (currentId === this.companyId)
      // when change tab
      this.isSelectedCurrentCompany = true;
    else this.isSelectedCurrentCompany = false;
  }

  /**
   * @description Scrolls to top of a div.If we scrolled and at any scenario we want to shows the upper most
   * portion then we can call it
   */
  scrollToTop(): void {
    const div = document.getElementById('setting_tabs') as HTMLDivElement;
    div.scrollTop = 0;
  }

  /**
   * @description Scrolls to Bottom of a div.If we scrolled and at any scenario we want to shows the lower most
   * portion then we can call it
   */
  scrollToBottom(): void {
    const div = document.getElementById('setting_tabs') as HTMLDivElement;
    div.scrollTop = div.scrollHeight;
  }

  /**
   * @description Show's the success alert
   * @param content Content we want's to show on alert
   * @returns
   */
  openSuccessAlert(content: string) {
    const data = {
      content,
      close: true
    };
    return this.alertService.successAlert(data);
  }

  /**
   * @description Show's the confirmation alert
   * @param content Content we want's to show on alert
   * @returns
   */
  openConfirmAlert(content: string) {
    const data = {
      content
    };
    return this.alertService.confirmAlert(data);
  }

  /**
   * @description To load the google address for input and fills the other fields with the address get from the google address
   * @param address Input value that we are entering
   */
  loadGoogleAddress(address: HTMLInputElement) {
    this.googleAddressService.googleAutocomplete({ addressElement: address });

    const googleAddressSubscription =
      this.googleAddressService.googleAddress$.subscribe((res) => {
        this.businessForm.patchValue({
          businessAddress1: res.address,
          city: res.city,
          state: res.state,
          zip: res.zip,
          country: res.country
        });
        googleAddressSubscription.unsubscribe();
      });
  }

  /**
   * @description function to select the invited company while navigation from header
   */
  selectInvitedCompany() {
    if (this.invitedCompany) {
      this.subscriptions.push(
        this.companyManagementService.invitedCompanySubject
          .pipe(delay(200))
          .subscribe((res: IInvitedCompany) => {
            if (res) {
              const index = this.invitedCompany.findIndex(
                (invitedCompany) => invitedCompany.companyId === res.companyId
              );
              if (index !== -1) {
                this.scrollToBottom();
                this.tabChange(
                  index,
                  'invitedCompanyDetails',
                  res.companyId,
                  res.status,
                  res.id
                );
              }
            }
          })
      );
    }
  }

  /**
   * @description Unsubscribe to all subscripitons when the component destroys
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
