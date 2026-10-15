import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  effect,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { Utils } from 'src/app/data/utils';
import { ICheckDetailsData } from 'src/app/modules/check/model/check';
import {
  IClass,
  IConnectedCompanyList,
  ICustomer,
  IExpense,
  ILocation,
  IQboDetails
} from 'src/app/modules/integration/model/integration';
import {
  ICheckPaymentsForm,
  IFreshBookExportsData,
  IPaymentConfig,
  IPaymentExportsOptions,
  IQBDExportsData,
  IQBDExportsFormBody,
  IQBOExportsData,
  IQBOExportsFormBody
} from 'src/app/modules/payments/model/payments';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { NgxMaskDirective } from 'ngx-mask';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatCheckbox } from '@angular/material/checkbox';
import { NetsuiteIntegrationService } from 'src/app/shared/service/integration/netsuite.service';
import { INetSuiteClass, INetSuiteExportsData } from 'src/app/modules/integration/netsuite/model/netsuite';
import { RouterLink } from '@angular/router';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { CommonButtonV35Component } from '../../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { faCheckCircle } from '@fortawesome/pro-solid-svg-icons';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { V35CommonDropDownSelectorComponent } from 'src/app/shared/v3/v35-dropdown/v35-common-dropdown-selector.component';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { MatTooltip } from '@angular/material/tooltip';
import { EllipsisActiveDirective } from 'src/app/directive/ellipsis-active.directive';

interface INameIdModel {
  name: string;
  id: string;
}
interface IQBOExportsForm {
  qboCategory: FormControl<INameIdModel | null>;
  gboDescription: FormControl<string | undefined>;
  gboCustomer: FormControl<INameIdModel | null>;
  qboClass: FormControl<INameIdModel | null>;
  qboAmount: FormControl<string | undefined>;
}
interface IQBDExportsForm {
  expense: FormControl<INameIdModel | null>;
  description: FormControl<string | undefined>;
  customer: FormControl<INameIdModel | null>;
  class: FormControl<INameIdModel | null>;
  amount: FormControl<string | undefined>;
}

interface INetSuiteExportsForm {
  expense: FormControl<INameIdModel | null>;
  description: FormControl<string | undefined>;
  customer: FormControl<INameIdModel | null>;
  class: FormControl<INameIdModel | null>;
  location: FormControl<INameIdModel | null>;
  amount: FormControl<string | undefined>;
}

interface IFreshBooksExportsForm {
  fbCategory: FormControl<INameIdModel | null>;
  description: FormControl<string | undefined>;
  amount: FormControl<string | undefined>;
}
interface INetSuiteFormvalues {
  expense: INameIdModel | null;
  description: string | undefined;
  customer: INameIdModel | null;
  class: INameIdModel | null;
  location: INameIdModel | null;
  amount: string | undefined;
}

@Component({
  selector: 'app-quickbooks-export-check',
  templateUrl: './quickbooks-export-check.component.html',
  styleUrls: ['./quickbooks-export-check.component.scss'],
  standalone: true,
  imports: [
    MatCheckbox,
    FormsModule,
    FaIconComponent,
    NgOptimizedImage,
    NgSelectModule,
    ReactiveFormsModule,
    NgxMaskDirective,
    CommonButtonV35Component,
    NgClass,
    RouterLink,
    DemoVideoComponent,
    V35CommonDropDownSelectorComponent,
    MatTooltip,
    EllipsisActiveDirective
  ]
})
export class QuickbooksExportCheckComponent
  implements OnInit, OnChanges, OnDestroy
{
  private checkService = inject(CheckService);
  private alertService = inject(AlertService);
  private netsuiteIntegrationService = inject(NetsuiteIntegrationService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private paymentsService = inject(PaymentsService);
  private headerService = inject(HeaderService);
  private integrationService = inject(IntegrationService);

  subscriptions: Subscription[] = [];
  utils = Utils;
  @Input() paymentFormValue: ICheckPaymentsForm;
  @Input() checkDetails: ICheckDetailsData;
  @Input() paymentConfig: IPaymentConfig;
  @Output() QBDSave = new EventEmitter<IQBDExportsData>();
  @Output() QBOSave = new EventEmitter<IQBOExportsData>();
  @Output() netSuiteSave = new EventEmitter<INetSuiteExportsData>();
  @Output() FreshBooksSave = new EventEmitter<IFreshBookExportsData>();
  isEnableExportOption = output<boolean>();
  diasableExportCheck = signal<boolean>(false);
  isBankAchPayment = input<boolean>();

  /*
  * @description This variable is used to check if the QuickBooks export data is available once the user has saved the check.
  * This is also used to disable the export check button if the QuickBooks export data is not available.
  * 
  */
  @Input() hasQboExportData: boolean;
  
  bankAcId: string | undefined;
  isQBOnlineEnabled = false;
  isQBDesktopEnabled = false;
  selectedLocationId: string | null;
  QBCompanyName: string;
  QBBankAccountName: string;
  QBDBankId: string;
  customPatterns = {
    V: { pattern: new RegExp('-?') },
    0: { pattern: new RegExp('[0-9]') }
  };

  QBCategoryItem: { name: string; id: string }[] = [];
  QBClassItem: { name: string; id: string }[] = [];
  QBCustomerItem: { name: string; id: string }[] = [];
  realmId: number;
  qbBankId: string;
  types = ['category-items', 'customers', 'classes'];
  QBOTotal: number;
  categoryPage = 2;
  customerPage = 2;
  classPage = 2;
  qboInformation: IQboDetails;
  isQBOSaved: boolean;
  @Input() exportOptions: IPaymentExportsOptions;
  QBDCompanyId: string;
  QBDCompanyName: string;
  QBDBankAccountName: string;
  QBDExpenseItem: IExpense[];
  QBDCustomersItem: ICustomer[];
  QBDClassItem: IClass[];
  qbdCustomerPage: number;
  qbdExpensePage: number;
  qbdClassPage: number;
  QBDTotal: number;
  isQBDSaved: boolean;
  isLocation: boolean = false;
  qbLocations: ILocation[] = [];
  FBCompanies: IConnectedCompanyList[] = [];
  FBCategoryItem: INameIdModel[] = [];
  FreshBooksTotal: number = 0;
  isFreshBooksSaved: boolean = false;
  isNetsuiteEnabled = false;
  isEnableExport = false;
  ltrTransition = false;
  activeTab: string;
  netSuiteBankName: string;
  netSuiteBankId: string;
  netSuiteLocationId: string;
  FreshBooksCompanyName: string;
  FreshBooksCompanyId: string;
  netSuiteClass: INetSuiteClass[];
  netSuitePayee: INetSuiteClass[];
  netSuiteExpense = signal<INetSuiteClass[]>([]);
  netSuiteLocations: INetSuiteClass[] = [];
  selectedNetSuiteLocationId: string | null = null;
  netSuiteTotal: number;
  isNetSuiteSaved: boolean;
  showSavedMessage = false;
  showFreshBooksSavedMessage = signal(false);
  netSuiteClassPage = 2;
  netSuitePayeePage = 2;
  netSuiteExpensePage = 2;
  clickAction$ = toObservable(this.paymentsService.onClickSaveButton);
  faCheckCircle = faCheckCircle;
  isWiygulEnterPrise = false;
  prevoiusNetSuiteFormValue: Partial<INetSuiteFormvalues>[] = [];
  autoSave$ = toObservable(this.paymentsService.autoSaveNetSuiteDetails);
  autoSaveFreshBooks$ = toObservable(this.paymentsService.autoSaveFreshBooksDetails);

 qboExportsForm = new FormArray([
    new FormGroup<IQBOExportsForm>({
      qboAmount: new FormControl(),
      qboCategory: new FormControl(),
      qboClass: new FormControl(),
      gboCustomer: new FormControl(),
      gboDescription: new FormControl()
    })
  ]);

 qbdExportsForm = new FormArray([
    new FormGroup<IQBDExportsForm>({
      amount: new FormControl(),
      expense: new FormControl(),
      class: new FormControl(),
      customer: new FormControl(),
      description: new FormControl()
    })
  ]);

 netsuiteExportsForm = new FormArray([
    new FormGroup<INetSuiteExportsForm>({
      amount: new FormControl(),
      expense: new FormControl(),
      class: new FormControl(),
      customer: new FormControl(),
      location: new FormControl(),
      description: new FormControl()
    })
  ]);

  freshbooksExportsForm = new FormArray([
    new FormGroup<IFreshBooksExportsForm>({
      amount: new FormControl(),
      fbCategory: new FormControl<INameIdModel | null>(null),
      description: new FormControl()
    })
  ]);

  exportApps = [
    { id: 'qbo', name: 'QuickBooks Online', connected: false },
    { id: 'qbd', name: 'QuickBooks Desktop', connected: false },
    { id: 'netsuite', name: 'NetSuite', connected: false },
    { id: 'freshbooks', name: 'FreshBooks', connected: false }
  ];

  constructor() {
    effect(() => {
      if (this.isBankAchPayment()) {
        this.exportApps = this.exportApps.filter((app) => app.id === 'netsuite');
        this.activeTab = 'netsuite';
      } else {
        this.exportApps = [
          { id: 'qbo', name: 'QuickBooks Online', connected: false },
          { id: 'qbd', name: 'QuickBooks Desktop', connected: false },
          { id: 'netsuite', name: 'NetSuite', connected: false },
          { id: 'freshbooks', name: 'FreshBooks', connected: false }
        ];
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.initForm();
    this.sortApps();
    this.onSaveCheck();
    this.checkEnabledPlugins();
    this.checkAutoSave();
    this.checkAutoSaveFreshBooks();
    this.getFBCompanies();
  }

  ngOnChanges(changes: SimpleChanges) {    
    if (changes?.paymentFormValue?.currentValue?.bankAc?.id) {
      if (this.paymentFormValue?.bankAc?.id !== this.bankAcId) {
        this.bankAcId = changes?.paymentFormValue?.currentValue?.bankAc?.id;
        this.reset();
        if (this.exportOptions.isQBOPushBack && this.bankAcId) {
          this.getCompany(this.bankAcId);
        }
        if (this.exportOptions.isQBDPushBack && this.bankAcId) {
          this.getQBDCompany(this.bankAcId);
        }
        if (this.exportOptions.isNetsuitePushBack && this.bankAcId) {
          this.getNetSuiteBank(this.bankAcId);
        }
        if (this.exportOptions.isFreshBooksPushBack && this.bankAcId) {
          this.getFBCompanies();
        }
      }
    } else {
      this.isEnableExport = false;
      this.bankAcId = undefined;
      this.netsuiteExportsForm.reset();
    }

    if (changes?.paymentFormValue?.currentValue?.amount) {
      if (this.activeTab === 'netsuite') {
        this.autoUpdateNetsuiteAmount();
      } else if (this.activeTab === 'freshbooks') {
        this.autoUpdateFreshBooksAmount();
      }  else {
        this.autoUpdateQBAmount();
      }
    }

    if (changes?.paymentFormValue?.currentValue?.category) {
      if (this.activeTab === 'netsuite') {
        this.autoUpdateNetsuiteCategory();
      } else {
        this.autoUpdateQBCategory();
      }
    }

    if (
      changes?.checkDetails?.currentValue?.expenseDetails?.length > 0 &&
      this.paymentConfig.mode === 'EDIT' &&
      this.exportOptions.isQBDPushBack &&
      this.hasQboExportData
    ) {
      this.isEnableExport = true;
      this.initUpdateQBD();
    }

    if (
      changes?.checkDetails?.currentValue?.categoryDetails?.length > 0 &&
      this.paymentConfig.mode === 'EDIT' &&
      this.exportOptions.isQBOPushBack &&
      this.hasQboExportData
    ) {
      this.isEnableExport = true;
      this.initUpdateQBO();
    }

    if (
      (changes?.checkDetails?.currentValue?.netsuiteDetails?.length > 0 ||
        changes?.paymentConfig?.currentValue?.paymentDetails?.netsuiteDetails?.length > 0 )&&
      this.paymentConfig.mode === 'EDIT' &&
      this.exportOptions.isNetsuitePushBack 
    ) {
      this.isEnableExport = true;
      this.isEnableExportOption.emit(true);
      this.initUpdateNetSuite();
      this.activeTab = 'netsuite';
    }

    if (
      changes?.checkDetails?.currentValue?.freshbookExpenseDetails?.length > 0 &&
      this.paymentConfig.mode === 'EDIT' &&
      this.exportOptions.isFreshBooksPushBack &&
      this.hasQboExportData
    ) {
      this.isEnableExport = true;
      this.initUpdateFreshBooks();
    }

    if (this.activeTab !== 'netsuite') {
      this.isLocationEnabled();
    }

    if(this.paymentConfig.mode === 'EDIT' && this.hasQboExportData){
      this.diasableExportCheck.set(true);
    }

  }

  getFBCompanies() {
    this.subscriptions.push(
      this.integrationService.getDetails('freshbooks').subscribe((res) => {
        if(res.success) {
          this.FBCompanies = res.data.companies as IConnectedCompanyList[];
        }
      })
    );
  }

  checkEnabledPlugins() {
    this.subscriptions.push(
      // eslint-disable-next-line no-underscore-dangle
      this.headerService._headerData.subscribe((res) => {
        if (res) {
          if (res.enabledPlugins.includes('enterprise-wiygul')) {
            this.isWiygulEnterPrise = true;
          }
        }
      })
    );
  }

  checkAutoSave(){
    if(!this.isWiygulEnterPrise && !this.isBankAchPayment()) return;
    this.subscriptions.push(
      this.autoSave$.subscribe((res) => {        
        if(res){
          this.updateNetSuiteExpenseTotal();
          this.saveNetSuite(true);
        }
      })

    );
  }

  checkAutoSaveFreshBooks(){
    if(!this.isWiygulEnterPrise) return;
    this.subscriptions.push(
      this.autoSaveFreshBooks$.subscribe((res) => {
        if(res){
          this.updateFreshBooksTotal();
          this.saveFreshBooks();
        }
      })
    );
  }

  initForm() {
    for (let i = 0; i < 4; i += 1) {
      if (
        this.checkDetails?.categoryDetails?.length === 0 ||
        this.paymentConfig.mode !== 'EDIT'
      ) {
        this.addNewRowQBO();
      }
      if (
        this.checkDetails?.expenseDetails?.length === 0 ||
        this.paymentConfig.mode !== 'EDIT'
      ) {
        this.addNewRowQBD();
      }
      if (
        this.checkDetails?.netsuiteDetails?.length === 0 ||
        this.paymentConfig.mode !== 'EDIT'
      ) {
        this.addNewRowNetSuite();
      }
    }
  }

  onSaveCheck() {
    this.subscriptions.push(
      this.clickAction$.subscribe((res) => {
        if (res) {
          this.QBOSaveClicked();
        }
      })
    );
  }

  /**
   * @description Update and sort export apps array based on connection.
   */
  sortApps() {
    this.exportApps = this.exportApps.map((app) => {
      const appCopy = { ...app };
      switch (appCopy.id) {
        case 'qbo':
          appCopy.connected = this.exportOptions.isQBOPushBack;
          break;
        case 'qbd':
          appCopy.connected = this.exportOptions.isQBDPushBack;
          break;
        case 'netsuite':
          appCopy.connected = this.exportOptions.isNetsuitePushBack;
          break;
        case 'freshbooks':
          appCopy.connected = this.exportOptions.isFreshBooksPushBack;
          break;
        default:
          break;
      }
      return appCopy;
    });

    this.exportApps.sort((a, b) => {
      if (a.connected && !b.connected) {
        return -1;
      }
      if (!a.connected && b.connected) {
        return 1;
      }
      return 0;
    });
    this.activeTab = this.exportApps[0].id;
  }

  initUpdateQBD() {
    this.isQBDesktopEnabled = true;
    this.qbdExportsForm.clear();
    this.checkDetails.expenseDetails.forEach((ele, i) => {
      this.addNewRowQBD();
      this.qbdExportsForm.at(i).setValue({
        amount: ele.amount ?? '',
        class: ele.classId ? { id: ele.classId, name: ele.className } : null,
        customer: ele.customerId
          ? { id: ele.customerId, name: ele.customerName }
          : null,
        description: ele.description ?? '',
        expense: ele.expenseId
          ? { id: ele.expenseId, name: ele.expenseName }
          : null
      });
    });
  }

  initUpdateNetSuite() {
    this.netsuiteExportsForm?.clear();
    const netsuiteDetails = this.checkDetails?.netsuiteDetails?.length > 0 ? this.checkDetails?.netsuiteDetails : this.paymentConfig?.paymentDetails?.netsuiteDetails || [];
    netsuiteDetails.forEach((ele, i) => {
      this.addNewRowNetSuite();
      this.netsuiteExportsForm?.at(i)?.setValue({
        amount: ele.amount ?? '',
        class: ele.classId ? { id: ele.classId, name: ele.className } : null,
        customer: ele.customerId
          ? { id: ele.customerId, name: ele.customerName }
          : null,
        location: ele.locationId
          ? { id: ele.locationId, name: ele.locationName }
          : null,
        description: ele.description ?? '',
        expense: ele.expenseId
          ? { id: ele.expenseId, name: ele.expenseName }
          : null
      });
    });
  }

  initUpdateQBO() {
    this.isQBOnlineEnabled = true;
    this.qboExportsForm.clear();
    this.checkDetails.categoryDetails.forEach((ele, i) => {
      this.addNewRowQBO();
      this.qboExportsForm.at(i).setValue({
        qboAmount: ele.amount ?? '',
        qboCategory: ele.categoryId
          ? { id: ele.categoryId, name: ele.categoryName }
          : null,
        qboClass: ele.classId ? { id: ele.classId, name: ele.className } : null,
        gboCustomer: ele.customerId
          ? { id: ele.customerId, name: ele.customerName }
          : null,
        gboDescription: ele.description ?? ''
      });
    });
  }

  initUpdateFreshBooks() {
    this.freshbooksExportsForm.clear();
    // FreshBooks handles only a single entry, so use the first item
    if (this.checkDetails.freshbookExpenseDetails.length > 0) {
      const ele = this.checkDetails.freshbookExpenseDetails[0];
      const category = this.FBCategoryItem.find((item) => item.id === ele.categoryId);
      this.freshbooksExportsForm.at(0).setValue({
        amount: ele.amount ?? '',
        fbCategory: ele.categoryId
          ? { id: ele.categoryId, name: category?.name ?? '' }
          : null,
        description: ele.description ?? ''
      });
      const company = this.checkDetails.freshbookCompany;
      // Set company information if available
      if (company?.companyId) {
        this.FreshBooksCompanyId = company.companyId;
        this.FreshBooksCompanyName = this.FBCompanies.find(
          (c: IConnectedCompanyList) => company.companyId === c.companyId
        )?.companyName || '';
      }
      
      this.isFreshBooksSaved = true;
    }
  }

  isLocationEnabled() {
    this.subscriptions.push(
      this.checkService.isPushBackEnable().subscribe((res) => {
        if (res.data.isLocationEnabled) {
          this.isLocation = true;
        }
      })
    );
  }

  /**
   * @description Retrieves the locations for a specific realm ID.
   */
  getLocations(id: string) {
    this.subscriptions.push(
      this.checkService.getLocations(id).subscribe((res) => {
        if (res.success) {
          this.qbLocations = res.data as ILocation[];
          if (this.qboInformation?.locationMappingId) {
            this.selectedLocationId = this.qboInformation?.locationMappingId;
          } else {
            this.selectedLocationId = res.data[0]?.id;
          }
        }
      })
    );
  }

  autoUpdateQBAmount() {
    if (!this.qboExportsForm.controls[1]?.get('qboAmount')?.value) {
      this.qboExportsForm.controls[0]
        .get('qboAmount')
        ?.setValue(this.paymentFormValue.amount);
    }
  }

  autoUpdateNetsuiteAmount() {
    if (!this.netsuiteExportsForm.controls[1]?.get('expense')?.value) {
      this.netsuiteExportsForm.controls[0]
        .get('amount')
        ?.setValue(this.paymentFormValue.amount);
    }
    if (
      this.netsuiteExportsForm.controls[0]?.get('expense')?.value &&
      this.netsuiteExportsForm.controls[0].get('amount')?.value
    ) {
      this.isEnableExport = true;
      if (!this.isNetSuiteSaved) {
        this.isEnableExportOption.emit(true);
      }
    }
  }

  autoUpdateFreshBooksAmount() {    
    // FreshBooks uses a single row (index 0) for expense details
    if (this.freshbooksExportsForm.controls.length > 0) {
      const currentAmount = this.freshbooksExportsForm.controls[0].get('amount')?.value;
      // Only update if amount field is empty to avoid overwriting user input
      if (!currentAmount || currentAmount === '') {
        this.freshbooksExportsForm.controls[0]
          .get('amount')
          ?.setValue(this.paymentFormValue.amount);
        this.updateFreshBooksTotal();
      }
    }
  }

  autoUpdateQBCategory() {    
    if (!this.realmId) return;
    this.subscriptions.push(
      this.checkService
        .getQbCategory(
          this.realmId.toString(),
          this.paymentFormValue.category.id
        )
        .subscribe((res) => {
          if (res.success && res.data) {
            const category = res.data;
            this.QBCategoryItem.push(category);
            if (res.data)
              this.qboExportsForm.controls[0]
                .get('qboCategory')
                ?.patchValue(category);
          }else{
            this.qboExportsForm.controls[0]
            .get('qboCategory')
            ?.patchValue(null);
          }
        })
    );
  }

  autoUpdateNetsuiteCategory() {
    if (this.checkDetails?.netsuiteDetails?.length > 1 || !this.bankAcId)
      return;
    this.subscriptions.push(
      this.checkService
        .getNetsuiteExpense(this.paymentFormValue.category.id as string)
        .subscribe((res) => {
          if (res.success && res.data) {
            const category = res.data;

            // Check if category already exists in netSuiteExpense array
            const categoryExists = this.netSuiteExpense().find(
              (existingCategory) => existingCategory?.id === category.id
            );

            // Only push if category doesn't already exist
            if (!categoryExists) {
              // Update signal by creating a new array with the additional item
              this.netSuiteExpense.update((current) => [...current, category]);
              this.netsuiteExportsForm.controls[0]
                .get('expense')
                ?.patchValue(category);
            } else {
              this.netsuiteExportsForm.controls[0]
                .get('expense')
                ?.patchValue(categoryExists);
            }
            if (
              this.netsuiteExportsForm.controls[0]?.get('expense')?.value &&
              this.netsuiteExportsForm.controls[0].get('amount')?.value
            ) {
              this.isEnableExport = true;
              if (!this.isNetSuiteSaved) {
                this.isEnableExportOption.emit(true);
              }
            }
          }
        })
    );
  }

  checkChangeValues() {
    if (
      this.prevoiusNetSuiteFormValue[0].amount !== this.netsuiteExportsForm.value[0].amount ||
      this.prevoiusNetSuiteFormValue[0].expense !== this.netsuiteExportsForm.value[0].expense
    ) {
      this.isEnableExportOption.emit(true);
    }
  }

  addNewRowQBO() {
    this.qboExportsForm.push(
      new FormGroup<IQBOExportsForm>({
        qboAmount: new FormControl(),
        qboCategory: new FormControl(),
        qboClass: new FormControl(),
        gboCustomer: new FormControl(),
        gboDescription: new FormControl()
      })
    );
  }

  addNewRowQBD() {
    this.qbdExportsForm.push(
      new FormGroup<IQBDExportsForm>({
        amount: new FormControl(),
        expense: new FormControl(),
        class: new FormControl(),
        customer: new FormControl(),
        description: new FormControl()
      })
    );
  }

  addNewRowNetSuite() {
    this.netsuiteExportsForm.push(
      new FormGroup<INetSuiteExportsForm>({
        amount: new FormControl(),
        expense: new FormControl(),
        class: new FormControl(),
        customer: new FormControl(),
        location: new FormControl(),
        description: new FormControl()
      })
    );
  }

  reset() {
    this.QBCategoryItem = [];
    this.QBClassItem = [];
    this.QBCustomerItem = [];
    this.qboExportsForm?.reset();
    this.isQBOSaved = false;

    this.QBDCompanyId = '';
    this.QBDCompanyName = '';
    this.QBDBankAccountName = '';
    this.QBDExpenseItem = [];
    this.QBDCustomersItem = [];
    this.QBDClassItem = [];
    this.isQBDSaved = false;

    this.FreshBooksCompanyId = '';
    this.FreshBooksCompanyName = '';
    this.FBCategoryItem = [];
    this.freshbooksExportsForm?.reset();
    this.isFreshBooksSaved = false;

    this.QBOSave.emit(undefined);
    this.QBDSave.emit(undefined);
    this.FreshBooksSave.emit(undefined);
  }

  getCompany(id: string) {
    this.subscriptions.push(
      this.checkService.getCompanies(id).subscribe((res) => {
        this.realmId = res.data.realmId;
        this.qbBankId = res.data.qbBankId;
        this.QBCompanyName = res.data.companyName;
        this.QBBankAccountName = res.data.qbBankName;
        this.OnItemChangeQB(res.data.realmId);
        this.qboInformation = res.data;
        if (res.data.realmId) {
          this.getLocations(res.data.realmId);
        } else {
          this.qbLocations = [];
        }
        if (this.qbBankId && this.hasQboExportData) {
          this.isEnableExport = true;
        } else {
          this.isEnableExport = false;
        }
        this.isEnableExportOption.emit(this.isEnableExport);
      })
    );
  }

  OnItemChangeQB(event: string) {
    if (event) {
      this.types.forEach((el: string) => {
        this.subscriptions.push(
          this.checkService.GetCompanyDetails(el, event).subscribe((res) => {
            if (res.success) {
              if (el === 'category-items') {
                this.QBCategoryItem = res.data;
              } else if (el === 'customers') {
                this.QBCustomerItem = res.data;
              } else {
                this.QBClassItem = res.data;
                if (this.qboInformation?.classMappingId) {
                  const defaultClass = this.QBClassItem.filter(
                    (item) => item.id === this.qboInformation.classMappingId
                  );
                  if (defaultClass) {
                    this.qboExportsForm.controls[0]
                      .get('qboClass')
                      ?.setValue(defaultClass[0]);
                  }
                }
              }
            }
          })
        );
      });
    }
  }

  updateCategoryTotal() {
    this.QBOTotal = 0;
    this.qboExportsForm.value.forEach((ele) => {
      this.QBOTotal += Number(ele.qboAmount);
    });
  }

  onScrollCompanyDetails(type: string) {
    let page = 0;
    const searchTerm = '';

    if (type === 'customers') {
      page = this.customerPage;
    } else if (type === 'category-items') {
      page = this.categoryPage;
    } else {
      page = this.classPage;
    }

    this.subscriptions.push(
      this.checkService
        .GetCompanyDetailsPagination(type, this.realmId, page, searchTerm)
        .subscribe((res) => {
          if (res.success) {
            res.data.forEach((element: { name: string; id: string }) => {
              if (type === 'customers') {
                this.QBCustomerItem.push(element);
              } else if (type === 'category-items') {
                this.QBCategoryItem.push(element);
              } else {
                this.QBClassItem.push(element);
              }
            });

            if (type === 'customers') {
              this.customerPage += 1;
            } else if (type === 'category-items') {
              this.categoryPage += 1;
            } else {
              this.classPage += 1;
            }
          }
        })
    );
  }

  validateInput(event: Event) {
    const { value } = event.target as HTMLInputElement;
    if (value.startsWith('-00')) {
      (event.target as HTMLInputElement).value = value.slice(0, -1);
    }
  }

  onSearchItemsCompanyDetails(searchValue: string, type: string) {
    const searchTerm = searchValue;
    this.subscriptions.push(
      this.checkService
        .GetCompanyDetailsPagination(type, this.realmId, 0, searchTerm)
        .subscribe((res) => {
          if (type === 'customers') {
            this.QBCustomerItem = res.data;
          } else if (type === 'category-items') {
            this.QBCategoryItem = res.data;
          } else {
            this.QBClassItem = res.data;
          }
        })
    );
  }

  QBOSaveClicked(): void {
    this.paymentsService.onClickSaveButton.set(false);
    this.updateCategoryTotal();
    if (this.realmId) {
      if (this.qbBankId === '') {
        this.alertService.warningAlert({
          content: 'The QuickBooks Bank field is required',
          doneMsg: 'OK'
        });
        return;
      }
    }

    for (let i = 0; i <= this.qboExportsForm.value.length; i++) {
      if (
        this.qboExportsForm.value[i]?.qboCategory &&
        (this.qboExportsForm.value[i]?.qboAmount == null ||
          this.qboExportsForm.value[i]?.qboAmount === '')
      ) {
        this.alertService.warningAlert({
          content: `The amount field is required in row ${i + 1}`,
          doneMsg: 'OK'
        });
        return;
      }
      if (
        this.qboExportsForm.value[i]?.qboCategory == null &&
        this.qboExportsForm.value[i]?.qboAmount
      ) {
        this.alertService.warningAlert({
          content: i === 0 && this.qboExportsForm.value[1]?.qboCategory == null ? 'Category detail is required' : `The category field is required in row ${i + 1}`,
          doneMsg: 'OK'
        });
        return;
      }
    }
    if (this.QBOTotal > 100000000 || this.QBOTotal <= 0) {
      this.alertService.warningAlert({
        content: 'The check amount must be between 0 and 100000000.',
        doneMsg: 'OK'
      });
      return;
    }
    this.saveQBO();
  }

  saveQBO() {
    if (this.QBOTotal === 0 || !this.QBOTotal) {
      this.isQBOSaved = false;
      this.QBOSave.emit(undefined);
      this.paymentsService.onSaveQboDetails.set(undefined);
    } else {
      const filteredFormValue: IQBOExportsFormBody[] = this.qboExportsForm.value
        .filter(
          (ele) =>
            ele.qboAmount &&
            ele.qboAmount !== '' &&
            ele.qboCategory?.id &&
            ele.qboCategory?.id !== ''
        )
        .map((ele) => ({
          categoryId: ele.qboCategory?.id,
          description: ele.gboDescription,
          customerId: ele.gboCustomer?.id ? ele.gboCustomer?.id : null,
          classId: ele.qboClass?.id ? ele.qboClass?.id : null,
          amount: ele.qboAmount
        }));
      const emitedData = {
        realmId: String(this.realmId),
        qbBankId: this.qbBankId,
        formValue: filteredFormValue,
        QBOTotal: this.QBOTotal,
        locationId: this.selectedLocationId as string,
        hasQboExportData: this.hasQboExportData
      };
      this.QBOSave.emit(emitedData);
      this.isQBOSaved = true;
      this.paymentsService.onSaveQboDetails.set(emitedData);
    }
    this.isQBOnlineEnabled = false;
  }

  removeSelectedRowQBO(i: number) {
    if (this.qboExportsForm.controls.length > 1) {
      this.qboExportsForm.removeAt(i);
    } else {
      this.qboExportsForm.reset();
    }
  }

  removeSelectedRowQBD(i: number) {
    if (this.qbdExportsForm.controls.length > 1) {
      this.qbdExportsForm.removeAt(i);
    } else {
      this.qbdExportsForm.reset();
    }
  }

  removeSelectedRowNetSuite(i: number) {
    if (this.netsuiteExportsForm.controls.length > 1) {
      this.netsuiteExportsForm.removeAt(i);
      this.autoUpdateNetsuiteAmount();
    } else {
      this.netsuiteExportsForm.reset();
    }
  }

  getQBDCompany(bankId: string) {
    this.subscriptions.push(
      this.checkService.getQBDCompanies(bankId).subscribe((res) => {
        this.QBDCompanyId = res.data.companyId;
        this.QBDBankId = res.data.qbBankId;
        this.QBDCompanyName = res.data.companyName;
        this.QBDBankAccountName = res.data.qbBankName;
        this.QBDExpenseItem = res.data.expenses;
        this.QBDCustomersItem = res.data.customers;
        this.QBDClassItem = res.data.classes;
      })
    );
  }

  onQBDScrollCompanyDetails(type: string) {
    let page = 0;
    const searchTerm = '';
    const companyId = this.QBDCompanyId;

    if (type === 'customers') {
      page = this.qbdCustomerPage;
    } else if (type === 'expense-items') {
      page = this.qbdExpensePage;
    } else {
      page = this.qbdClassPage;
    }

    this.subscriptions.push(
      this.checkService
        .GetQBDCompanyDetailsPagination(type, companyId, page, searchTerm)
        .subscribe((res) => {
          if (res.success) {
            res.data.forEach((element) => {
              if (type === 'customers') {
                this.QBDCustomersItem.push(element);
              } else if (type === 'expense-items') {
                this.QBDExpenseItem.push(element);
              } else {
                this.QBDClassItem.push(element);
              }
            });

            if (type === 'customers') {
              this.qbdCustomerPage += 1;
            } else if (type === 'expense-items') {
              this.qbdExpensePage += 1;
            } else {
              this.qbdClassPage += 1;
            }
          }
        })
    );
  }

  onQBDSearchItemsCompanyDetails(event: string, type: string) {
    const searchTerm = event;
    const companyId = this.QBDCompanyId;
    this.subscriptions.push(
      this.checkService
        .GetQBDCompanyDetailsPagination(type, companyId, 0, searchTerm)
        .subscribe((res) => {
          if (type === 'customers') {
            this.QBDCustomersItem = res.data;
          } else if (type === 'expense-items') {
            this.QBDExpenseItem = res.data;
          } else {
            this.QBDClassItem = res.data;
          }
        })
    );
  }

  QBDSaveExpense(): void {
    this.updateExpenseTotal();
    if (this.QBDCompanyId) {
      if (this.QBDBankId === '') {
        this.alertService.warningAlert({
          content: 'The QuickBooks Bank field is required',
          doneMsg: 'OK'
        });
        return;
      }
    }

    for (let i = 0; i <= this.qbdExportsForm.value.length; i += 1) {
      if (
        this.qbdExportsForm.value[i]?.expense &&
        (this.qbdExportsForm.value[i]?.amount == null ||
          this.qbdExportsForm.value[i]?.amount === '')
      ) {
        this.alertService.warningAlert({
          content: `The amount field is required in row ${i + 1}`,
          doneMsg: 'OK'
        });
        return;
      }
      if (
        this.qbdExportsForm.value[i]?.expense == null &&
        this.qbdExportsForm.value[i]?.amount
      ) {
        this.alertService.warningAlert({
          content: `The Expense field is required in row ${i + 1}`,
          doneMsg: 'OK'
        });
        return;
      }
    }
    if (this.QBDTotal > 100000000) {
      this.alertService.warningAlert({
        content: 'The check amount must be between 0 and 100000000.',
        doneMsg: 'OK'
      });
      return;
    }
    this.saveQBD();
  }

  saveQBD() {
    if (this.QBDTotal === 0 || !this.QBDTotal) {
      this.isQBDSaved = false;
      this.QBDSave.emit(undefined);
    } else {
      const filteredFormValue: IQBDExportsFormBody[] = this.qbdExportsForm.value
        .filter(
          (ele) =>
            ele.amount &&
            ele.amount !== '' &&
            ele.expense?.id &&
            ele.expense?.id !== ''
        )
        .map((ele) => ({
          expenseId: ele.expense?.id,
          description: ele.description,
          customerId: ele.customer?.id ? ele.customer?.id : '',
          classId: ele.class?.id ? ele.class?.id : '',
          amount: ele.amount
        }));
      this.QBDSave.emit({
        companyId: String(this.QBDCompanyId),
        qbdBankId: this.QBDBankId,
        formValue: filteredFormValue,
        QBDTotal: this.QBDTotal
      });
      this.isQBDSaved = true;
    }
    this.isQBDesktopEnabled = false;
  }

  netSuiteSaveExpense() {
    this.updateNetSuiteExpenseTotal();
    if (this.netSuiteBankId) {
      if (this.netSuiteBankId === '') {
        this.alertService.warningAlert({
          content: 'The NetSuite Bank field is required',
          doneMsg: 'OK'
        });
        return;
      }
    }

    for (let i = 0; i <= this.netsuiteExportsForm.value.length; i += 1) {
      if (
        this.netsuiteExportsForm.value[i]?.expense &&
        (this.netsuiteExportsForm.value[i]?.amount == null ||
          this.netsuiteExportsForm.value[i]?.amount === '')
      ) {
        this.alertService.warningAlert({
          content: `The amount field is required in row ${i + 1}`,
          doneMsg: 'OK'
        });
        return;
      }
      if (
        this.netsuiteExportsForm.value[i]?.expense == null &&
        this.netsuiteExportsForm.value[i]?.amount
      ) {
        this.alertService.warningAlert({
          content: `The Expense field is required in row ${i + 1}`,
          doneMsg: 'OK'
        });
        return;
      }
    }
    if (this.netSuiteTotal > 100000000) {
      this.alertService.warningAlert({
        content: 'The check amount must be between 0 and 100000000.',
        doneMsg: 'OK'
      });
      return;
    }
    this.saveNetSuite();
  }

  saveNetSuite(isAutoSaveEnabled?: boolean) {
    if (this.netSuiteTotal === 0 || !this.netSuiteTotal) {
      this.isNetSuiteSaved = false;
      this.netSuiteSave.emit(undefined);
      this.paymentsService.onSaveNetSuiteDetails.set(undefined);
    } else {
      this.prevoiusNetSuiteFormValue = this.netsuiteExportsForm.value;
      const filteredFormValue: IQBDExportsFormBody[] =
        this.netsuiteExportsForm.value
          .filter(
            (ele) =>
              ele.amount &&
              ele.amount !== '' &&
              ele.expense?.id &&
              ele.expense?.id !== ''
          )
          .map((ele) => ({
            expenseId: ele.expense?.id,
            description: ele.description,
            customerId: ele.customer?.id ? ele.customer?.id : '',
            classId: ele.class?.id ? ele.class?.id : '',
            locationId: ele.location?.id ? ele.location?.id : '',
            amount: ele.amount
          }));
      this.showSavedMessage = true;
      const emitedData = {
        netSuiteBankId: this.netSuiteBankId,
        formValue: filteredFormValue,
        netSuiteTotal: this.netSuiteTotal
      };

      this.netSuiteSave.emit(emitedData);
      this.isEnableExportOption.emit(false);
      if(isAutoSaveEnabled){
        this.paymentsService.onSaveNetSuiteDetails.set(emitedData);
      }
      this.isNetSuiteSaved = true;
      setTimeout(() => {
        this.showSavedMessage = false;
      }, 2000);
    }
  }

  updateExpenseTotal() {
    this.QBDTotal = 0;
    this.qbdExportsForm.value.forEach((ele) => {
      this.QBDTotal += Number(ele.amount);
    });
  }

  updateNetSuiteExpenseTotal() {
    this.netSuiteTotal = 0;
    this.netsuiteExportsForm.value.forEach((ele) => {
      this.netSuiteTotal += Number(ele.amount);
    });
  }

  updateFreshBooksTotal() {
    this.FreshBooksTotal = 0;
    this.freshbooksExportsForm.value.forEach((ele) => {
      this.FreshBooksTotal += Number(ele.amount);
    });
  }

  /**
   * @description toggle the main tabs
   * @param val details || more || accounts
   */
  toggleTab(val: string) {
    if (this.activeTab === 'netsuite') {
      this.ltrTransition = true;
    } else if (this.activeTab === 'qbd') {
      if (val === 'netsuite') {
        this.ltrTransition = false;
      } else if (val === 'qbo') {
        this.ltrTransition = true;
      }
    } else {
      this.ltrTransition = false;
    }
    this.activeTab = val;
  }

  getNetSuiteBank(bankId: string): void {
    this.subscriptions.push(
      this.netsuiteIntegrationService
        .getNetSuiteBank(bankId)
        .subscribe((res) => {
          if (res.success) {
            this.netSuiteBankName = res.data.netsuiteBankName;
            this.netSuiteBankId = res.data.netsuiteBankId;
            this.netSuiteLocationId = res.data.netsuiteLocationId;
            if (res.data.netsuiteBankId) {
              this.onNetSuiteDetails('expense-accounts', '');
              this.onNetSuiteDetails('classes', '');
              this.onNetSuiteDetails('payees', '');
              this.getNetSuiteLocations();
              this.isEnableExport = true;
            }
          }
        })
    );
  }

  getNetSuiteLocations(): void {
    this.subscriptions.push(
      this.netsuiteIntegrationService
        .getNetSuiteLocations()
        .subscribe((res) => {
          if (res.success) {
            this.netSuiteLocations = res.data;
            if (this.netSuiteLocationId && this.netSuiteLocations.length > 0) {
              const matchedLocation = this.netSuiteLocations.find(
                (loc) => loc.id === this.netSuiteLocationId
              );              
              if (matchedLocation) {
                this.netsuiteExportsForm.controls[0].get('location')?.setValue(matchedLocation);
              }
            }
          }
        })
    );
  }

  onNetSuiteDetails(
    type: 'expense-accounts' | 'classes' | 'payees',
    searchTerm: string
  ): void {
    this.subscriptions.push(
      this.netsuiteIntegrationService
        .getNetSuiteExportDetails(type, searchTerm)
        .subscribe((res) => {
          if (res.success) {
            if (type === 'expense-accounts') {
              this.netSuiteExpense.set(res.data);
            } else if (type === 'payees') {
              this.netSuitePayee = res.data;
            } else {
              this.netSuiteClass = res.data;
            }
          }
        })
    );
  }

  onScrollNetSuiteDetails(
    type: 'expense-accounts' | 'classes' | 'payees'
  ): void {
    let page = 1;
    if (type === 'expense-accounts') {
      page = this.netSuiteExpensePage;
    } else if (type === 'classes') {
      page = this.netSuiteClassPage;
    } else {
      page = this.netSuitePayeePage;
    }

    this.subscriptions.push(
      this.netsuiteIntegrationService
        .getNetSuiteExportDetails(type, '', page)
        .subscribe((res) => {
          if (res.success) {
            res.data.forEach((element) => {
              if (type === 'expense-accounts') {
                // Get current array from signal
                const currentExpenses = this.netSuiteExpense();
                const newItems: INetSuiteClass[] = [];

                // eslint-disable-next-line @typescript-eslint/no-shadow
                res.data.forEach((element) => {
                  const isDuplicate = currentExpenses.some(
                    (existingElement) => existingElement.id === element.id
                  );

                  if (!isDuplicate) {
                    newItems.push(element);
                  }
                });

                // Update signal with new combined array
                if (newItems.length > 0) {
                  this.netSuiteExpense.update((current) => [
                    ...current,
                    ...newItems
                  ]);
                }
              } else if (type === 'payees') {
                this.netSuitePayee.push(element);
              } else {
                this.netSuiteClass.push(element);
              }
            });
            if (type === 'expense-accounts') {
              this.netSuiteExpensePage += 1;
            } else if (type === 'classes') {
              this.netSuiteClassPage += 1;
            } else {
              this.netSuitePayeePage += 1;
            }
          }
        })
    );
  }

  openExportCheckEnableInfo() {
    this.dynamicWhiteLabelService.goToLiveChat();
  }

  enableExport(isEnabled: boolean) {
    this.isEnableExportOption.emit(isEnabled);
  }

  onFreshBooksCompanyChange(event: string) {
    this.FreshBooksCompanyId = event;
    this.FreshBooksCompanyName = this.FBCompanies.find((company: IConnectedCompanyList) => company.companyId === event)?.companyName || '';
    this.subscriptions.push(
      this.integrationService.getCategoriesList(event).subscribe((res) => {
        if(res.success) {
          if(res.data.length > 0){
            this.FBCategoryItem = res.data.map((item: {id: string, name: string}) => ({
              id: item.id,
              name: item.name
            }));
          }
        }
      })
    );
  }

  freshBooksSaveExpense(): void {
    this.updateFreshBooksTotal();
    
    // Validate company selection
    if (!this.FreshBooksCompanyId && !this.FreshBooksCompanyName) {
      this.alertService.warningAlert({
        content: 'The FreshBooks Company field is required',
        doneMsg: 'OK'
      });
      return;
    }

    // Validate form entries
    for (let i = 0; i <= this.freshbooksExportsForm.value.length; i += 1) {
      if (
        this.freshbooksExportsForm.value[i]?.fbCategory &&
        (this.freshbooksExportsForm.value[i]?.amount == null ||
          this.freshbooksExportsForm.value[i]?.amount === '')
      ) {
        this.alertService.warningAlert({
          content: `The amount field is required in row ${i + 1}`,
          doneMsg: 'OK'
        });
        return;
      }
      if (
        this.freshbooksExportsForm.value[i]?.fbCategory == null &&
        this.freshbooksExportsForm.value[i]?.amount
      ) {
        this.alertService.warningAlert({
          content: `The category field is required in row ${i + 1}`,
          doneMsg: 'OK'
        });
        return;
      }
    }
    // Validate total amount
    if (this.FreshBooksTotal > 100000000 || this.FreshBooksTotal <= 0) {
      this.alertService.warningAlert({
        content: 'The check amount must be between 0 and 100000000.',
        doneMsg: 'OK'
      });
      return;
    }

    this.saveFreshBooks();
  }

  private saveFreshBooks() {
    if (this.FreshBooksTotal === 0 || !this.FreshBooksTotal) {
      this.isFreshBooksSaved = false;
      this.FreshBooksSave.emit(undefined);
    } else {
      // For single entry
      const firstEntry = this.freshbooksExportsForm.value[0];
      if (firstEntry?.fbCategory?.id && firstEntry?.amount) {
        const emitedData = {
          companyId: this.FreshBooksCompanyId,
          categoryId: firstEntry.fbCategory.id,
          description: firstEntry.description || '',
          amount: firstEntry.amount,
          attachFreshbooksExpenseToCheck: '1'
        };
        this.FreshBooksSave.emit(emitedData);
        this.paymentsService.onSaveFreshBooksDetails.set(emitedData);
        this.isFreshBooksSaved = true;
        this.showFreshBooksSavedMessage.set(true);
      } else {
        this.FreshBooksSave.emit(undefined);
      }
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => {
      el.unsubscribe();
    });
  }
}
