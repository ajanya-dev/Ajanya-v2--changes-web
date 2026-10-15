import {
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
  ChangeDetectorRef
} from '@angular/core';
import {
  FormGroup,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormArray,
  FormBuilder,
  FormControl
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Data, Router, RouterLink } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Utils } from 'src/app/data/utils';
import { ICategoryDropdown } from 'src/app/modules/category/model/category';
import {
  IQBExpenseListItem,
  IQBExpenseListItem2
} from 'src/app/modules/check/model/check';
import { CategoryAddModalComponent } from 'src/app/shared/modal/category-modal/category-add-modal/category-add-modal.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { LayoutService } from 'src/app/shared/service/layout/layout.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import {
  LocationStrategy,
  Location,
  NgClass,
  DecimalPipe,
  DatePipe
} from '@angular/common';
import { IBankDropdown } from 'src/app/models/bank';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import {
  faCircleInfo,
  faPenToSquare,
  faPlus,
  faSpinner,
  faTrash
} from '@fortawesome/pro-solid-svg-icons';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgxMaskDirective } from 'ngx-mask';
import { NgSelectModule } from '@ng-select/ng-select';
import { WhiteLabelPipe } from 'src/app/pipes/white-label.pipe';
import { PayeeModalService } from 'src/app/shared/service/payee-modal/payee-modal.service';
import { HttpErrorResponse } from '@angular/common/http';
import { GroupPaymentsComponent } from 'src/app/modules/group-payments/components/group-payments/group-payments.component';
import { GroupPaymentsService } from 'src/app/modules/group-payments/services/group-payments.service';
import { TPaymentSource } from 'src/app/modules/payments/model/payments';
import {
  IGroupPaymentsCreate,
  IGroupPaymentsItem
} from 'src/app/modules/group-payments/models/group-payments.models';
import { PayeeDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/payee-dropdown-v3/payee-dropdown-v3.component';
import { IV3DropDownOnReady } from 'src/app/models/common';
import { BankAcDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';
import { CategoryDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/category-dropdown-v3/category-dropdown-v3.component';
import { bankAccountsActions } from 'src/app/modules/store/bankAccounts/bank-accounts.actions';
import { payeesActions } from 'src/app/modules/store/payees/payees.actions';
import { CategoriesActions } from 'src/app/modules/store/categories/categories.actions';
import { CommonBackButtonV35Component } from '../../../../shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { CommonButtonV35Component } from '../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { AmountInputComponent } from '../../../../shared/components/amount-input/amount-input.component';
import { ExportCheckQbdesktopComponent } from '../../components/export-check-qbdesktop/export-check-qbdesktop.component';
import { GroupNameModalComponent } from '../../modal/group-name-modal/group-name-modal.component';

interface IErrorMessage {
  errors: string[];
  payee_name: string;
  payee_id: string;
  row: number[];
}

@Component({
  selector: 'app-multi-check',
  templateUrl: './multi-check.component.html',
  styleUrls: ['./multi-check.component.scss'],
  standalone: true,
  imports: [
    CommonBackButtonV35Component,
    NgClass,
    RouterLink,
    FormsModule,
    CommonButtonV35Component,
    NgSelectModule,
    NgxMaskDirective,
    FaIconComponent,
    ReactiveFormsModule,
    AmountInputComponent,
    MatTooltip,
    DecimalPipe,
    WhiteLabelPipe,
    GroupPaymentsComponent,
    BankAcDropdownV3Component,
    PayeeDropdownV3Component,
    CategoryDropdownV3Component
  ]
})
export class MultiCheckComponent implements OnInit, OnDestroy {
  private userProfileService = inject(UserProfileService);
  private dialog = inject(MatDialog);
  private sharedService = inject(SharedService);
  private checkService = inject(CheckService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  public alertService = inject(AlertService);
  public fb = inject(FormBuilder);
  public layoutService = inject(LayoutService);
  public localStorageService = inject(LocalStorageService);
  public locationStrategy = inject(LocationStrategy);
  public headerService = inject(HeaderService);
  private location = inject(Location);
  private payeeModalService = inject(PayeeModalService);
  private datePipe = inject(DatePipe);
  private groupPaymentsService = inject(GroupPaymentsService);
  private cdr = inject(ChangeDetectorRef);
  private store = inject(Store);

  circleInfo = faCircleInfo;
  faEdit = faPenToSquare;
  faPlus = faPlus;
  faSpinner = faSpinner;
  faTrash = faTrash;
  subscriptions: Subscription[] = [];
  submitting = false;
  savingChecks = signal(false);
  pageInfo: Data;
  bankPage = 1;
  utils = Utils;
  payeePage = 1;

  categoryPage = 1;

  checksForm = this.fb.group({
    checks: this.fb.array<ReturnType<typeof this.getCheckGroupWithBaseValues>>(
      []
    )
  });

  totalItems = 0;
  totalAmount = 0;

  groupName = '';
  groupId = '';

  searchTimeout: ReturnType<typeof setTimeout>;
  categorySearchTimeout: ReturnType<typeof setTimeout>;
  payeeSearchTimeout: ReturnType<typeof setTimeout>;
  isQBDExportEnabled: boolean;
  baseQBDExpenseListArray: IQBExpenseListItem2[] = [];
  selectedBaseBankId: string | undefined;
  baseAmount: string | undefined;
  baseDate: string | Date | undefined = this.datePipe.transform(new Date(), 'yyyy-MM-dd') ?? undefined;
  baseMemo: string | undefined;
  baseCategory: string | undefined;
  baseQBCategory: string | undefined;
  basePosition: string | undefined;
  positionOptions = [
    { name: 'Dealer', value: '1' },
    { name: 'Manager', value: '2' },
    { name: 'Advisor', value: '3' },
    { name: 'Technician', value: '4' }
  ];
  isQBDPushback: boolean;
  checkCountInput = new UntypedFormControl(10);
  companyId: string;
  qbBankId: string;
  userEmailAndPhoneVerified = false;
  isBryanCohenCustomer = false;
  qbdExpenseItem: { name: string; id: string }[] = [];
  isLoading = false;
  qbdcustomerPage = 2;
  qbCategoryPage = 2;
  qbdCompanyId: string;
  qbdBankId: string;
  selectedBaseAccount: string | null;
  baseExpense: string | undefined;
  isBryanCohenCustomerQbEnable = false;
  selectedBankId: string;
  amountKeyup = new Subject();
  searchedBankIds: string[] = [];
  bryanCohenErrors = signal<IErrorMessage[]>([]);
  isEditPayee: { [key: number]: boolean } = {};
  activeTab = signal('check');

  isQBMultipleExportEnabled = signal(false);
  isQBPushbackEnabled = signal(false);
  realmId = signal<string | undefined>(undefined);
  qbCategories = signal<{name: string, id: string}[]>([]);
  isQBShowWarning = signal(false);
  hasQbExportData = signal<boolean>(false);
  isExportToQbOnlineSelected = signal<boolean>(false);
  isGroupQBMultipleExportSelected = signal<boolean>(false);
  qbCompanyDetails= signal<{ 
    realmId: string;
    companyName: string;
    qbBankName: string;
    qbBankId: string;
    classMappingId: string | null;
    locationMappingId: string | null;}>({realmId: '', companyName: '', qbBankName: '', qbBankId: '', classMappingId: null, locationMappingId: null});

  onPayeeReadys = new Map<number, IV3DropDownOnReady['setItemWithId']>();
  baseBankReady:
    | {
        setItemWithId: IV3DropDownOnReady['setItemWithId'];
        clear: BankAcDropdownV3Component['clearSelection'];
      }
    | undefined;

  onBankReadys = new Map<
    number,
    {
      setItemWithId: IV3DropDownOnReady['setItemWithId'];
      clear: BankAcDropdownV3Component['clearSelection'];
    }
  >();

  onCategoryReadys = new Map<
    number,
    {
      setItemWithId: IV3DropDownOnReady['setItemWithId'];
      clear: CategoryDropdownV3Component['clearSelection'];
    }
  >();

  ngOnInit(): void {
    this.onCheckBrayanCohen();
    this.subscriptions.push(
      this.route.data.subscribe((data) => {
        this.pageInfo = data;
        if (this.pageInfo.name === 'group' && this.pageInfo.mode === 'edit') {
          this.subscriptions.push(
            this.route.queryParams.subscribe((params) => {
              this.groupId = params.id;
              this.getGroupData(this.groupId);
            })
          );
        } else if (
          this.pageInfo.name === 'checks' &&
          this.pageInfo.mode === 'create'
        ) {
          this.subscriptions.push(
            this.route.queryParams.subscribe((params) => {
              this.groupId = params.groupId;
              if (this.groupId) {
                this.getGroupData(this.groupId);
              }
            })
          );
        }
      })
    );

    this.checkPlugin();
    this.pushChecks(this.checkCountInput.value);
    this.isQBDPushBackEnable();
    this.setUserVerificationStatus();
    this.setAmount();
  }

  getCheckGroup() {
    return new FormGroup({
      bankAccount: new FormControl(null, Validators.required),
      payee: new FormControl(null, Validators.required),
      amount: new FormControl(null, Validators.required),
      date: new FormControl(this.baseDate, this.isBryanCohenCustomer ? Validators.required : undefined),
      position: new FormControl(null, this.isBryanCohenCustomer ? Validators.required : undefined),
      invoice: new FormControl(null),
      memo: new FormControl(null, this.isBryanCohenCustomer ? Validators.required : undefined),
      note: new FormControl(null),
      accountNo: new FormControl(null),
      category: new FormControl(null),
      isQbdEnabled: new FormControl(this.isQBDExportEnabled),
      QbdExpenses: new FormControl(null),
      companyId: new FormControl(null),
      qbBankId: new FormControl(null),
      expense: new FormControl(
        null,
        this.isBryanCohenCustomerQbEnable ? Validators.required : undefined
      ),
      isSelectedForPayment: new FormControl(true)
    }) as ReturnType<typeof this.getCheckGroupWithBaseValues>;
  }

  getCheckGroupWithBaseValues() {
    return new FormGroup({
      bankAccount: new FormControl(
        this.selectedBaseBankId,
        Validators.required
      ),
      payee: new FormControl<string | null>(null, Validators.required),
      amount: new FormControl<string | number | null>(
        this.baseAmount ?? '',
        Validators.required
      ),
      date: new FormControl(this.baseDate, this.isBryanCohenCustomer ? Validators.required : undefined),
      position: new FormControl(this.basePosition, this.isBryanCohenCustomer ? Validators.required : undefined),
      invoice: new FormControl<string | null>(null),
      memo: new FormControl(this.baseMemo, this.isBryanCohenCustomer ? Validators.required : undefined),
      note: new FormControl<string | null>(null),
      accountNo: new FormControl<string | null>(null),
      category: new FormControl(this.baseCategory),
      isQbdEnabled: new FormControl(this.isQBDExportEnabled),
      QbdExpenses: new FormControl(
        this.utils.deepCopy(this.baseQBDExpenseListArray)
      ),
      companyId: new FormControl<string | null>(null),
      qbBankId: new FormControl<string | null>(null),
      expense: new FormControl(this.baseExpense),
      isSelectedForPayment: new FormControl(true)
    });
  }

  private get checks() {
    return this.checksForm.controls.checks;
  }

  checkCountChange(checkCount: number) {
    if (checkCount !== this.checks.length) {
      if (checkCount > 50) {
        this.checkCountChange(50);
      }
      if (checkCount > 0 && checkCount <= 50) {
        if (checkCount < this.checks.length) {
          this.alertService
            .confirmAlert({
              content: `The last ${
                this.checks.length - checkCount
              } checks will be removed. Are you sure continue`
            })
            .afterClosed()
            .subscribe((res) => {
              if (res) {
                this.popCheck(this.checks.length - checkCount);
              } else {
                this.checkCountInput.setValue(this.checks.length);
              }
            });
        } else {
          this.incrementCheckCount(checkCount - this.checks.length);
        }
      } else {
        this.checkCountInput.setValue(this.checks.length);
      }
    }
    this.countTotal();
  }

  incrementCheckCount(numOfChecks = 1) {
    if (this.checks.length < 50) {
      for (let i = 0; i < numOfChecks; i += 1) {
        const checkForm = this.getCheckGroupWithBaseValues();
        if (this.isQBDExportEnabled) {
          checkForm.patchValue({ companyId: this.companyId });
          checkForm.patchValue({ qbBankId: this.qbBankId });
          checkForm.patchValue({ isQbdEnabled: this.isQBDExportEnabled });
        }
        this.checks.push(checkForm);
      }
      
      // Auto-select base account in newly added check fields
      if (this.selectedBaseAccount) {        
        const startIndex = this.checks.length - numOfChecks;
        setTimeout(() => {
          for (let i = startIndex; i < this.checks.length; i += 1) {
            const methods = this.onBankReadys.get(i);
            if (methods) {
              methods.setItemWithId?.(this.selectedBaseAccount ?? '');
            }
          } 
        }, 0);
      }
      
      // Update validators for newly added checks
      this.updateBryanCohenValidators();
    }
    this.checkCountInput.setValue(this.checks.length);
  }


  removeDecimal(checkCountInput: UntypedFormControl) {
    checkCountInput.setValue(Math.trunc(checkCountInput.value));
  }

  pushChecks(numOfChecks = 1) {
    for (let i = 0; i < numOfChecks; i += 1) {
      this.checks.push(this.getCheckGroup());
    }
    // Update validators for newly added checks
    this.updateBryanCohenValidators();
  }

  popCheck(numOfChecks = 1) {
    for (let i = 0; i < numOfChecks; i += 1) {
      this.checks.removeAt(this.checks.length - 1);
    }
    this.checkCountInput.setValue(this.checks.length);
    this.countTotal();
  }

  payeeChange(event: IPayeeDropdown | undefined, index: number) {
    const group = (this.checksForm.controls.checks as FormArray).controls[
      index
    ];

    const accountNo = event?.typeDetails?.customerAccountNumber;

    group.patchValue({
      accountNo: accountNo || null,
      payee: event?.id
    });

    this.countTotal();
  }

  bankChange(bank: IBankDropdown | undefined, index: number) {
    const group = (this.checksForm.controls.checks as FormArray).controls[
      index
    ];

    group.patchValue({ bankAccount: bank?.id });

    this.countTotal();
  }

  categoryChange(category: ICategoryDropdown | undefined, index: number) {
    const group = (this.checksForm.controls.checks as FormArray).controls[
      index
    ];

    group.patchValue({ category: category?.id });
  }

  //= ==================> BASE FUNCTIONS <====================//

  selectBaseBank(e: IBankDropdown | null | undefined) {
    if (typeof e === 'string') return;
    this.selectedBaseAccount = e?.id;
    this.qbCompanyDetails.set({realmId: '', companyName: '', qbBankName: '', qbBankId: '', classMappingId: null, locationMappingId: null});
    this.qbCategories.set([]);
    this.isQBPushbackEnabled.set(false);
    if(e?.id){
      this.getQbCompanies(e.id);
    }
    this.checks.controls.forEach((form, i) => {
      const methods = this.onBankReadys.get(i);

      if (!methods) return;

      const { clear, setItemWithId } = methods;

      if (e) {
        setItemWithId?.(e.id);
      } else {
        clear();
        form.patchValue({ bankAccount: null });
      }
    });

    this.countTotal();
    this.checks.controls.forEach((ele) => {
      (ele as UntypedFormGroup).controls.QbdExpenses.setValue(
        this.utils.deepCopy(this.baseQBDExpenseListArray)
      );
    });
    if (this.isBryanCohenCustomer) {
      this.getQBDCompanyDetailsByBankId(this.selectedBaseAccount ?? '');
    }
  }

  setBaseAmount(amount: string) {
    const formatted = amount?.replace(/,/g, '');

    this.checks.controls.forEach((ele) => {
      ele.patchValue({ amount: formatted });
    });
    this.countTotal();
    this.amountKeyup.next(formatted);
  }

  setAmount(): void {
    this.subscriptions.push(
      this.amountKeyup
        .pipe(debounceTime(1000), distinctUntilChanged())
        .subscribe(() => {
          if (this.isBryanCohenCustomerQbEnable) {
            this.checks.controls.forEach((ele) => {
              const qbdExpenses = (ele as FormGroup).controls.QbdExpenses;
              let expenseAmount;
              if (qbdExpenses.value?.length) {
                expenseAmount =
                  (qbdExpenses.value[0]?.amount as string) ?? this.baseAmount;
              } else {
                expenseAmount = this.baseAmount;
              }
              const qbdExpensItem = {
                expenseObj: qbdExpenses.value[0]?.expenseObj ?? '',
                description: qbdExpenses.value[0]?.description ?? '',
                classObj: qbdExpenses.value[0]?.classObj ?? null,
                customerObj: qbdExpenses.value[0]?.customerObj ?? null,
                amount: expenseAmount ?? null
              } as unknown as IQBExpenseListItem2;
              this.baseQBDExpenseListArray = [];
              this.baseQBDExpenseListArray?.push(qbdExpensItem);

              ele.controls.QbdExpenses.setValue(
                this.utils.deepCopy(this.baseQBDExpenseListArray)
              );
            });
          }
        })
    );
  }

  setBaseDate(date: string) {
    this.checks.controls.forEach((ele) => {
      ele.patchValue({ date });
    });

    this.countTotal();
  }

  setBaseMemo(memo: string) {
    this.checks.controls.forEach((ele) => {
      ele.patchValue({ memo });
    });

    this.countTotal();
  }

  setBasePosition(position: string) {
    this.checks.controls.forEach((ele) => {
      ele.patchValue({ position });
    });

    this.countTotal();
  }

  setBaseCategory(e: ICategoryDropdown | null | undefined) {
    if (typeof e === 'string') return;

    this.checks.controls.forEach((form, i) => {
      const methods = this.onCategoryReadys.get(i);

      if (!methods) return;

      const { clear, setItemWithId } = methods;

      if (e) {
        setItemWithId?.(e.id);
      } else {
        clear();
        form.patchValue({ category: null });
      }
    });

    this.countTotal();
  }

  setBaseQBCategory(categoryId: { id: string, name: string } | null) {
    this.checks.controls.forEach((form) => {
      form.patchValue({ category: categoryId?.id ?? null });
    });
    this.countTotal();
  }

  clearBase(
    type: 'amount' | 'date' | 'memo' | 'expense' | 'category' | 'bankAccount' | 'position'
  ) {
    this.checks.controls.forEach((ele, i) => {
      ele.patchValue({ [type]: null });

      if (type === 'bankAccount') {
        this.selectedBaseAccount = null;
        const methods = this.onBankReadys.get(i);

        if (!methods) return;

        const { clear } = methods;

        clear();
      }

      if (type === 'category') {
        this.baseQBCategory = undefined;
        const methods = this.onCategoryReadys.get(i);

        if (!methods) return;

        const { clear } = methods;

        clear();
      }
    });

    this.countTotal();
  }

  //= ====================> GET CALLS  START <======================//
  isQBDPushBackEnable() {
    this.subscriptions.push(
      this.checkService.isQBDPushBackEnable().subscribe((res) => {
        if (
          res.data.isPushBackEnabled &&
          res.data.isQucikBookDesktopConnected
        ) {
          this.isQBDPushback = true;
        }
      })
    );
  }

  getGroupData(groupId: string) {
    // for edit group
    this.subscriptions.push(
      this.groupPaymentsService
        .getGroupPaymentData(groupId)
        .subscribe(({ success, data }) => {
          if (success) {
            this.groupName = data.groupName;
            const firstSourceId = data.resources?.[0]?.sourceId ?? null;
            const firstAmount = data.resources?.[0]?.amount;
            const baseDate = data.resources?.[0]?.date;
            const baseMemo = data.resources?.[0]?.memo;
            const hasQbExportData = data.resources?.some(item => item.qboData?.realmId && item.qboData?.mappingId);
            this.selectedBaseAccount = firstSourceId;
            this.selectedBaseBankId = firstSourceId ?? undefined;
            this.baseAmount = firstAmount != null ? String(firstAmount) : undefined;
            this.baseDate = baseDate ?? undefined;
            this.baseMemo = baseMemo ?? undefined;
            this.hasQbExportData.set(hasQbExportData);
            if(hasQbExportData && this.isQBMultipleExportEnabled()){
              this.isGroupQBMultipleExportSelected.set(true);
            }
            if (hasQbExportData && firstSourceId) {
              this.baseBankReady?.setItemWithId?.(firstSourceId);
            }
            
            this.setGroupRows(data.resources);
            this.countTotal();
            if (firstSourceId) {
              this.getQbCompanies(firstSourceId);
            }
            const firstCategoryId =
              data.resources?.[0]?.category ||
              (data.resources?.[0] as IGroupPaymentsItem & {
                categoryDetails?: { categoryId?: string }[];
              })?.categoryDetails?.[0]?.categoryId;
            this.baseQBCategory = firstCategoryId || undefined;
            const firstResource = data.resources[0] as IGroupPaymentsItem & {
              realmId?: string;
              mappingId?: string;
            };
            if (firstResource?.realmId) {
              this.realmId.set(firstResource.realmId);
            }
            if (firstResource?.mappingId || firstResource?.qbBankId) {
              this.qbCompanyDetails.update((current) => ({
                ...current,
                qbBankId: firstResource.mappingId ?? firstResource.qbBankId ?? current.qbBankId
              }));
            }
            
            // Check if any item has QBD expense details and enable QBD if needed
            const hasQBDExpenses = data.resources.some(item => 
              (item.expenseDetails && item.expenseDetails.length > 0) || item.qbdExpense?.id
            );
            
            if (hasQBDExpenses) {
              this.isQBDExportEnabled = true;
              this.isBryanCohenCustomerQbEnable = true;
              
              // Update all form controls to enable QBD
              this.checks.controls.forEach((element) => {
                (element as FormGroup).controls.expense?.addValidators(
                  Validators.required
                );
                // Position field is optional, no validation needed
                element.patchValue({ isQbdEnabled: true });
                element.updateValueAndValidity();
              });
              
              // Update Bryan Cohen validators
              this.updateBryanCohenValidators();
              
              // Set base QBD values from the first item with QBD data
              const firstQBDItem = data.resources.find(item => 
                (item.expenseDetails && item.expenseDetails.length > 0) || item.qbdExpense?.id
              );
              
              if (firstQBDItem) {
                this.companyId = firstQBDItem.companyId || '';
                this.qbdBankId = firstQBDItem.qbBankId || '';
                this.qbdCompanyId = firstQBDItem.companyId || '';
                
                // Initialize base QBD expense array if expenseDetails exist
                if (firstQBDItem.expenseDetails && firstQBDItem.expenseDetails.length > 0) {
                  this.baseQBDExpenseListArray = firstQBDItem.expenseDetails.map(expense => ({
                    amount: expense.amount?.toString() ?? '',
                    classObj: expense.classId ? { id: expense.classId, name: '' } : { id: '', name: '' },
                    customerObj: expense.customerId ? { id: expense.customerId, name: '' } : { id: '', name: '' },
                    description: expense.description ?? '',
                    expenseObj: expense.expenseId ? { id: expense.expenseId, name: firstQBDItem.qbdExpense?.name ?? '' } : { id: '', name: '' }
                  } as IQBExpenseListItem2));
                }
              }
            }
            
            if(this.isBryanCohenCustomer && this.isQBDExportEnabled){
              this.getQBDCompanyDetailsByBankId(data.resources[0].sourceId);
            }
          }
        })
    );
  }

  pushUniqueData(data: any[], newData: { id: string; name: string }[]) {
    while (newData?.length) {
      const item = newData.pop();
      let found = false;
      data.forEach((ele) => {
        if (ele.id === item?.id) {
          found = true;
        }
      });

      if (!found && item) {
        data.push(item);
      }
    }
  }

  //= ====================> GET CALLS END <======================//

  selectRowToggle(checked: boolean) {
    for (let i = 0; i < this.checks.controls.length; i += 1) {
      const checkboxId = `check-row-${i}`;
      (document.getElementById(checkboxId) as HTMLInputElement).checked =
        checked;
    }

    this.countTotal();
  }

  setGroupRows(data: IGroupPaymentsItem[]) {
    if (data.length > this.checks.controls.length) {
      this.pushChecks(data.length - this.checks.controls.length);
    }

    if(data.length < this.checks.controls.length) {
      this.popCheck(this.checks.controls.length - data.length);
    }

    // Use Angular's change detection to ensure components are ready
    this.cdr.detectChanges();
    this.checkCountInput.setValue(data.length);
    // Collect all unique IDs that need to be loaded
    const bankIds = [
      ...new Set(data.map((item) => item.sourceId).filter((id) => id))
    ];
    const payeeIds = [
      ...new Set(data.map((item) => item.payeeId).filter((id) => id))
    ];

    const categoryIds = [
      ...new Set(
        data
          .map((item) => {
            const resource = item as IGroupPaymentsItem & {
              categoryDetails?: { categoryId?: string }[];
            };
            return item.category ?? resource.categoryDetails?.[0]?.categoryId;
          })
          .filter((id) => id)
      )
    ];

    // Dispatch actions to load all bank accounts, payees, and categories at once
    if (bankIds.length > 0) {
      this.store.dispatch(
        bankAccountsActions.loadBankAccountsByIds({ ids: bankIds })
      );
    }

    if (payeeIds.length > 0) {
      this.store.dispatch(payeesActions.loadPayeesByIds({ ids: payeeIds }));
    }

    if (categoryIds.length > 0) {
      this.store.dispatch(
        CategoriesActions.loadCategoriesByIds({ ids: categoryIds as string[] })
      );
    }

    // Set form values and trigger dropdown updates
    data.forEach((item, i) => {
      const resource = item as IGroupPaymentsItem & {
        categoryDetails?: { categoryId?: string }[];
      };
      const selectedCategoryId =
        item.category ?? resource.categoryDetails?.[0]?.categoryId ?? null;
      // Restore QBD expense details if available
      let qbdExpenses = null;
      let companyId = null;
      let qbBankId = null;
      let isQbdEnabled = false;

      if (item.expenseDetails && item.expenseDetails.length > 0) {
        // Convert IQBExpenseListItem[] to IQBExpenseListItem2[] format
        qbdExpenses = item.expenseDetails.map(expense => ({
          amount: expense.amount?.toString() ?? '',
          classObj: expense.classId ? { id: expense.classId, name: '' } : { id: '', name: '' },
          customerObj: expense.customerId ? { id: expense.customerId, name: '' } : { id: '', name: '' },
          description: expense.description ?? '',
          expenseObj: expense.expenseId ? { id: expense.expenseId, name: item.qbdExpense?.name ?? '' } : { id: '', name: '' }
        } as IQBExpenseListItem2));
        companyId = item.companyId;
        qbBankId = item.qbBankId;
        isQbdEnabled = true;
      } else if (item.qbdExpense?.id) {
        // Fallback: if only qbdExpense is available, create basic structure
        qbdExpenses = [{
          amount: item.amount?.toString() ?? '',
          classObj: { id: '', name: '' },
          customerObj: { id: '', name: '' },
          description: '',
          expenseObj: { id: item.qbdExpense.id, name: item.qbdExpense.name }
        } as IQBExpenseListItem2];
        companyId = item.companyId;
        qbBankId = item.qbBankId;
        isQbdEnabled = true;
      }

      this.checks.controls[i].patchValue({
        bankAccount: item.sourceId,
        payee: item.payeeId,
        amount: item.amount,
        date: item.date,
        position: item?.customFieldPosition ? String(item?.customFieldPosition) : null,
        memo: item.memo,
        note: '',
        category: selectedCategoryId,
        expense: item?.qbdExpense?.name,
        QbdExpenses: qbdExpenses,
        companyId: companyId,
        qbBankId: qbBankId,
        isQbdEnabled: isQbdEnabled
      });

      const payeeReady = this.onPayeeReadys.get(i);
      const bankMethods = this.onBankReadys.get(i);
      const categoryMethods = this.onCategoryReadys.get(i);

      if (payeeReady) {
        payeeReady(item.payeeId);
      }

      if (bankMethods) {
        bankMethods.setItemWithId?.(item.sourceId);
      }

      if (categoryMethods && selectedCategoryId) {
        categoryMethods.setItemWithId?.(selectedCategoryId);
      }
    });
    
    // Update Bryan Cohen validators after setting all form values
    this.updateBryanCohenValidators();
  }

  onPayeeReady(event: IV3DropDownOnReady, i: number) {
    if (event && event.setItemWithId) {
      this.onPayeeReadys.set(i, event.setItemWithId);
    }
  }

  onBankReady(
    event: IV3DropDownOnReady,
    dropdown: BankAcDropdownV3Component,
    i: number
  ) {
    if (event && event.setItemWithId) {
      this.onBankReadys.set(i, {
        setItemWithId: event.setItemWithId,
        clear: dropdown.clearSelection.bind(dropdown)
      });
    }
  }

  onBaseBankReady(
    event: IV3DropDownOnReady,
    dropdown: BankAcDropdownV3Component
  ) {
    if (event && event.setItemWithId) {
      this.baseBankReady = {
        setItemWithId: event.setItemWithId,
        clear: dropdown.clearSelection.bind(dropdown)
      };
      if (this.selectedBaseAccount) {
        this.baseBankReady.setItemWithId?.(this.selectedBaseAccount);
      }
    }
  }

  onCategoryReady(
    event: IV3DropDownOnReady,
    dropdown: CategoryDropdownV3Component,
    i: number
  ) {
    if (event && event.setItemWithId) {
      this.onCategoryReadys.set(i, {
        setItemWithId: event.setItemWithId,
        clear: dropdown.clearSelection.bind(dropdown)
      });
    }
  }

  countTotal() {
    let totalItem = 0;
    let totalAmount = 0;
    let index = 0;

    this.checksForm.controls.checks.value.forEach((ele) => {
      if (
        ele.bankAccount &&
        ele.payee &&
        ele.amount &&
        ele.isSelectedForPayment &&
        (!this.isBryanCohenCustomerQbEnable || ele.expense) &&
        (!this.isBryanCohenCustomer || (ele.date && ele.position && ele.memo))
      ) {
        if (this.pageInfo?.name === 'checks' && this.groupId) {
          const checkboxId = `check-row-${index}`;
          if (
            (document.getElementById(checkboxId) as HTMLInputElement)?.checked
          ) {
            totalItem += 1;
            totalAmount += parseFloat(ele.amount as string);
          }
        } else {
          totalItem += 1;
          totalAmount += parseFloat(ele.amount as string);
        }
      }
      index += 1;
    });

    this.totalItems = totalItem;
    this.totalAmount = totalAmount;
  }

  getCheckBody(data: (typeof this.checks)['value'][number]) {
    return {
      bank_account_id: data.bankAccount,
      payee_id: data.payee,
      amount: data.amount,
      memo: data.memo,
      category_id: data.category,
      check_issue_date: data.date,
      note: data.note,
      account_no: data.accountNo,
      invoice_no: data.invoice,
      realmId: this.shouldIncludeQbExportData() ? this.realmId() : undefined,
      mappingId: this.shouldIncludeQbExportData() ? this.qbCompanyDetails().qbBankId : undefined,
      expenseDetails: (() => {
        const qbdExpenses = data?.QbdExpenses;
     
        if (
          data?.isQbdEnabled &&
          qbdExpenses?.length &&
          qbdExpenses.length > 0
        ) {
          const QbdExpenses: IQBExpenseListItem[] = [];
          qbdExpenses.forEach((element) => {
            QbdExpenses.push({
              amount: Number(element.amount) ?? '',
              classId: element.classObj?.id ?? null,
              customerId: element.customerObj?.id ?? null,
              description: element.description ?? '',
              expenseId: element.expenseObj?.id ?? null
            });
          });
          return QbdExpenses;
        }
        return undefined;
      })(),
      categoryDetails: (() => {
        const categoryDetails = data?.category;
        if (categoryDetails && this.shouldIncludeQbExportData()) {
          const categories = [{
            categoryId: data.category ?? '',
            description: null,
            customerId: null,
            classId: null,
            amount: data.amount?.toString() ?? '',
          }];
          return categories;
        }
        return undefined;
      })(),
      companyId: data?.companyId ?? this.qbdCompanyId,
      qbBankId: data?.qbBankId ?? this.qbdBankId,
      custom_field_position: data?.position ?? null
    };
  }

  getCheckGroupBody(data: (typeof this.checks)['value'][number]) {
    return {
      accountId: data.bankAccount,
      payeeId: data.payee,
      amount: data.amount,
      memo: data.memo,
      categoryId: data.category,
      chequeIssueDate: data.date,
      note: data.note
    };
  }

  saveChecks() {
    if (this.totalItems <= 0) {
      this.alertService.warningAlert({
        content: 'Please fill required fields for at least one row'
      });
      return;
    }
    if (!this.userEmailAndPhoneVerified) {
      this.router.navigateByUrl('/manage/users/verify-email-phone');
    }

    const isQBShowWarning =
      this.shouldIncludeQbExportData() &&
      this.checksForm.controls.checks.value.some((ele) => ele.category === null);

    if (this.isQBShowWarning() && isQBShowWarning) {
      this.alertService.warningAlert({
        content: 'Category details is required'
      });
      return;
    }

    const cheques: (typeof this.checks)['value'] = [];
    let index = 0;

    this.checksForm.controls.checks.value.forEach((ele) => {
      if (
        ele.bankAccount &&
        ele.payee &&
        ele.amount &&
        ele.isSelectedForPayment &&
        (!this.isBryanCohenCustomerQbEnable || ele.expense) &&
        (!this.isBryanCohenCustomer || (ele.date && ele.position && ele.memo))
      ) {
        if (this.pageInfo?.name === 'checks' && this.groupId) {
          const checkboxId = `check-row-${index}`;
          if (
            (document.getElementById(checkboxId) as HTMLInputElement)?.checked
          ) {
            cheques.push(this.getCheckBody(ele));
          }
        } else {
          cheques.push(this.getCheckBody(ele));
        }
      }
      index += 1;
    });

    if (!cheques.length) {
      this.alertService.warningAlert({
        content: 'Please enter required fields for check'
      });
      return;
    }
    const body = {
      cheques,
      attachExpenseToCheck: this.isQBDExportEnabled ? '1' : '0',
      attach_category_to_check: this.qbCompanyDetails()?.realmId && this.shouldIncludeQbExportData() ? '1' : '0',
    };
    this.savingChecks.set(true);
    this.checkService
      .postMultipleChecks(body)
      .pipe(
        finalize(() => {
          this.savingChecks.set(false);
        })
      )
      .subscribe({
        next: (data) => {
          if (data?.success) {
            this.alertService.successAlert({
              content: 'Checks created successfully !',
              close: true,
              timeout: 2000
            });
            this.router.navigate(['manage/cheque/checkrecords']);
          }
        },
        error: (err: HttpErrorResponse) => {
          if (err.error.errorCode === 519) {
            this.bryanCohenErrors.set(err.error.errorMsg);
          }
        }
      });
  }

  saveAsGroup() {
    // from multiple check
    const ref = this.dialog.open(GroupNameModalComponent, {
      width: '400px',
      maxWidth: '93%'
    });

    ref.afterClosed().subscribe((groupName) => {
      if (groupName) {
        this.groupName = groupName;
        this.saveGroupChecks();
      }
    });
  }

  saveGroupChecks() {
    if (!this.groupName) {
      this.alertService.warningAlert({ content: 'Please enter group name' });
      return;
    }

    this.countTotal();
    if (this.totalItems <= 0) {
      this.alertService.warningAlert({
        content: 'Please enter required data for at least one row.'
      });
      return;
    }
    const payments = this.checksForm.controls.checks.controls
      .map((group) =>
        group.valid
          ? ({
              amount: Utils.amountToNumber(group.value.amount),
              payeeId: group.value.payee ?? '',
              sourceId: group.value.bankAccount ?? '',
              sourceType: 'bankaccount' as TPaymentSource,
              transferType: 'check',
              date: group.value.date
                ? (this.datePipe.transform(
                    group.value.date,
                    'MM/dd/yyyy'
                  ) as string)
                : undefined,
              custom_field_position: group.value.position ?? null,
              category: group.value.category,
              invoiceNumber: group.value.invoice || '',
              memo: group.value.memo as string,
              qbdExpenseId: group.value.QbdExpenses?.[0]?.expenseObj?.id ?? null,
              qbdExpenseName: group.value.QbdExpenses?.[0]?.expenseObj?.name ?? null,
              categoryDetails: group.value.category && this.shouldIncludeQbExportData()
                ? [
                    {
                      categoryId: group.value.category ?? '',
                      description: null,
                      customerId: null,
                      classId: null,
                      amount: group.value.amount?.toString() ?? ''
                    }
                  ]
                : undefined,
              realmId: this.shouldIncludeQbExportData() ? this.realmId() : undefined,
              mappingId: this.shouldIncludeQbExportData() ? this.qbCompanyDetails().qbBankId : undefined
            } as IGroupPaymentsItem)
          : null
      )
      .filter(Boolean) as IGroupPaymentsItem[];

    const body = {
      groupName: this.groupName,
      payments,
      attach_category_to_check: this.qbCompanyDetails()?.realmId && this.shouldIncludeQbExportData() ? '1' : '0',
      initiatedFrom: 2
    } as IGroupPaymentsCreate & { attach_category_to_check: string };

    this.submitting = true;
    if (this.pageInfo.name === 'group' && this.pageInfo.mode === 'edit') {
      this.groupPaymentsService
        .updatePaymentsGroup(body, this.groupId)
        .pipe(
          finalize(() => {
            this.submitting = false;
          })
        )
        .subscribe(({ success }) => {
          if (success) {
            this.alertService.successAlert({
              content: 'Group updated',
              close: true,
              timeout: 2000
            });
            this.router.navigate(['manage/cheque/group/index']);
          }
        });
    } else {
      this.groupPaymentsService
        .createPaymentsGroup(body)
        .pipe(
          finalize(() => {
            this.submitting = false;
          })
        )
        .subscribe(({ success, data: _ }) => {
          if (success) {
            this.alertService.successAlert({
              content: 'Group created',
              close: true,
              timeout: 2000
            });
            this.router.navigate(['manage/cheque/group/index']);
          }
        });
    }
  }

  /**
   * @description Opens the add payee modal.
   */
  openAddNewPayee() {
    this.subscriptions.push(
      this.payeeModalService.openAddPayee().subscribe(() => {})
    );
  }

  openCategoryModal(): void {
    const dialogRef = this.dialog.open(CategoryAddModalComponent, {
      maxWidth: '500px',
      width: '93%'
    });

    dialogRef.afterClosed().subscribe((createdCatagoryId) => {
      if (createdCatagoryId != null)
        this.sharedService.setNewCategoryCreatedData(createdCatagoryId);
    });
  }

  openQBDExport(bankAcId: string, checkFormItem?: UntypedFormGroup) {
    const dialogRef = this.dialog.open(ExportCheckQbdesktopComponent, {
      minWidth: '500px',
      width: '80%',
      panelClass: 'QBDExportModalClass',
      data: {
        bankAcId,
        expenseListFormArr: checkFormItem
          ? checkFormItem.controls.QbdExpenses.value
          : this.baseQBDExpenseListArray
      }
    });
    dialogRef
      .afterClosed()
      .subscribe(
        (res: {
          isSave: boolean;
          expenseListFormArr: IQBExpenseListItem2[];
          expenseTotal: string;
          companyId: string;
          qbBankId: string;
        }) => {
          if (res?.isSave) {
            if (checkFormItem) {
              checkFormItem.controls.QbdExpenses.setValue(
                res.expenseListFormArr
              );
              checkFormItem.controls.amount.setValue(
                res.expenseTotal?.toString()
              );
              checkFormItem.controls.companyId.setValue(
                res.companyId?.toString()
              );
              checkFormItem.controls.qbBankId.setValue(
                res.qbBankId?.toString()
              );
              if (this.isBryanCohenCustomerQbEnable) {
                checkFormItem.controls.expense.setValue(
                  res.expenseListFormArr[0].expenseObj.name
                );
              }
              this.companyId = checkFormItem.controls.companyId.value;
              this.qbBankId = checkFormItem.controls.qbBankId.value;
            } else {
              if (this.isBryanCohenCustomerQbEnable) {
                this.checks.controls.forEach((ele) => {
                  ele.patchValue({
                    expense: res.expenseListFormArr[0].expenseObj.name
                  });
                });
                this.baseExpense = res.expenseListFormArr[0].expenseObj.name;
              }
              this.baseQBDExpenseListArray = res.expenseListFormArr;
              this.checks.controls.forEach((ele) => {
                (ele as UntypedFormGroup).controls.QbdExpenses.setValue(
                  this.utils.deepCopy(this.baseQBDExpenseListArray)
                );
                (ele as UntypedFormGroup).controls.companyId.setValue(
                  res.companyId?.toString()
                );
                (ele as UntypedFormGroup).controls.qbBankId.setValue(
                  res.qbBankId?.toString()
                );
              });
              this.companyId = res.companyId?.toString();
              this.qbBankId = res.qbBankId?.toString();
              this.setBaseAmount(res.expenseTotal?.toString());
              this.baseAmount = res.expenseTotal?.toString();
            }
          }
          this.countTotal();
        }
      );
  }

  baseQBExportEnabledClicked(isChecked: boolean) {
    this.isQBDExportEnabled = isChecked;
    this.checks.controls.forEach((ele) => {
      ele.patchValue({ isQbdEnabled: isChecked });
      (ele as UntypedFormGroup).controls.QbdExpenses.setValue(
        this.utils.deepCopy(this.baseQBDExpenseListArray)
      );
    });
    if (this.isQBDExportEnabled && this.isBryanCohenCustomer) {
      this.isBryanCohenCustomerQbEnable = true;
      if (this.selectedBaseAccount) {
        this.getQBDCompanyDetailsByBankId(this.selectedBaseAccount);
      }
    } else {
      this.isBryanCohenCustomerQbEnable = false;
    }
  }

  clearQBExport(item: UntypedFormGroup) {
    this.alertService
      .confirmAlert({
        content:
          'This will clear all expenses details of this corresponding check. Are you sure you want to continue?',
        isCancel: true
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          item.controls.QbdExpenses.setValue(null);
          item.controls.companyId.setValue(null);
          item.controls.qbBankId.setValue(null);
        }
      });
  }

  checkQBAndSetAmount(check: UntypedFormGroup, amount: string) {
    if (check?.controls?.QbdExpenses?.value?.length === 1) {
      const qbExpenseArr: IQBExpenseListItem[] =
        check.controls.QbdExpenses.value;
      amount = amount?.replace(/[,$]/g, '');
      qbExpenseArr[0].amount = Number(amount);
      check.controls.QbdExpenses.setValue(qbExpenseArr);
    }
  }

  setTitle(id: string, title: string) {
    document.getElementById(id)?.setAttribute('title', title);
  }

  /**
   * @description Method to set the user verification status value from the `UserVerification$` behaviorSubject from user profile service to `this.userEmailAndPhoneVerified.`
   */
  setUserVerificationStatus() {
    this.subscriptions.push(
      this.userProfileService.UserVerification$.subscribe((res) => {
        if (res.email_verified !== 0 && res.phone_verified !== 0) {
          this.userEmailAndPhoneVerified = true;
        }
      })
    );
  }

  /** Method handles back button event */
  onBackClick() {
    this.location.back();
    history.pushState(null, '/manage/home');
  }

  /**
   * @description Retrieves QuickBooks Desktop company details associated with the selected bank.
   * This function is applicable only for Brayan Cohen enterprise customers.
   * @param {string}bankId - bank id.
   */
  getQBDCompanyDetailsByBankId(bankId: string): void {
    if (bankId === this.selectedBankId) return;
    this.selectedBankId = bankId;
    this.isLoading = true;
    this.subscriptions.push(
      this.checkService
        .getQBDCompanies(bankId)
        .pipe(
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe((res) => {
          this.qbdExpenseItem = res.data.expenses;
          this.qbdCompanyId = res.data.companyId;
          this.qbdBankId = res.data.qbBankId;
        })
    );
  }

  /**
   * @description Get the QBD Expense item list.
   * @param {string}searchTerm - Searched Value
   */
  onQBDScrollCompanyDetails(searchTerm: string): void {
    this.subscriptions.push(
      this.checkService
        .GetQBDCompanyDetailsPagination(
          'expense-items',
          this.qbdCompanyId,
          this.qbdcustomerPage,
          searchTerm
        )
        .subscribe((res) => {
          if (res.success) {
            res.data.forEach((element) => {
              this.qbdExpenseItem.push(element);
            });
            this.qbdcustomerPage += 1;
          }
        })
    );
  }

  /**
   * @description Searches QuickBooks Desktop expenses based on the provided search term.
   * @param event - he event triggering the search.
   */
  onQBDSearchItemsCompanyDetails(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value;
    this.onQBDScrollCompanyDetails(searchTerm);
  }

  /**
   * @description Get the selcted QBD Expense.
   * @param {{ id: string, name: string }}item - The selected QBD expense
   * @param {number}index - The index of the selected check.
   * @param {FormGroup}checkFormItem - The form group value of the selected check.
   */
  onQBDItemChangeExpenseDetails(
    item: { id: string; name: string },
    index?: number,
    checkFormItem?: FormGroup
  ): void {
    if (checkFormItem && index !== undefined && index >= 0) {
      const selectedFieldExpenses = checkFormItem.controls.QbdExpenses.value;
      const updatedExpense = {
        ...selectedFieldExpenses[0],
        expenseObj: item
      };
      selectedFieldExpenses[0] = updatedExpense;
      checkFormItem.controls.QbdExpenses.setValue(selectedFieldExpenses);
    } else {
      this.checks.controls.forEach((ele) => {
        ele.patchValue({
          expense: item?.name
        });
      });
      this.checks.controls.forEach((ele) => {
        const qbdExpenses = (ele as FormGroup).controls.QbdExpenses;
        const amount =
          (qbdExpenses.value[0]?.amount as string) ?? this.baseAmount;
        const qbdExpensItem = {
          expenseObj: item,
          description: qbdExpenses.value[0]?.description ?? '',
          classObj: qbdExpenses.value[0]?.classObj ?? null,
          customerObj: qbdExpenses.value[0]?.customerObj ?? null,
          amount: amount ?? null
        } as unknown as IQBExpenseListItem2;
        this.baseQBDExpenseListArray = [];
        this.baseQBDExpenseListArray?.push(qbdExpensItem);

        (ele as FormGroup).controls.QbdExpenses.setValue(
          this.utils.deepCopy(this.baseQBDExpenseListArray)
        );
      });
    }
    this.countTotal();
  }

  /**
   * @description  Used to check Brayan Cohen customer enabled or not.
   */
  onCheckBrayanCohen() {
    const userPlugins = this.localStorageService.getItem('userPlugins');
    if(userPlugins?.includes('enterprise-bryancohen')){
      this.isBryanCohenCustomer = true;
      this.isBryanCohenCustomerQbEnable = true;
      this.isQBDExportEnabled = true;
      this.updateBryanCohenValidators();
      if (this.isBryanCohenCustomerQbEnable) {
        this.checks.controls.forEach((element) => {
          (element as FormGroup).controls.expense?.addValidators(
            Validators.required
          );
          // Position field is optional, no validation needed
          element.patchValue({ isQbdEnabled: true });
          element.updateValueAndValidity();
        });
      }
    }else{
      this.isQBDExportEnabled = false;
      this.isBryanCohenCustomer = false;
      this.isBryanCohenCustomerQbEnable = false;
      this.updateBryanCohenValidators();
    }
  }

  /**
   * @description Update validators for Date, Position, and Memo fields based on Bryan Cohen customer status
   */
  updateBryanCohenValidators() {
    this.checks.controls.forEach((element) => {
      const formGroup = element as FormGroup;
      
      // Update date field validators
      const dateControl = formGroup.controls.date;
      if (this.isBryanCohenCustomer) {
        dateControl.setValidators(Validators.required);
      } else {
        dateControl.clearValidators();
      }
      
      // Update position field validators
      const positionControl = formGroup.controls.position;
      if (this.isBryanCohenCustomer) {
        positionControl.setValidators(Validators.required);
      } else {
        positionControl.clearValidators();
      }
      
      // Update memo field validators
      const memoControl = formGroup.controls.memo;
      if (this.isBryanCohenCustomer) {
        memoControl.setValidators(Validators.required);
      } else {
        memoControl.clearValidators();
      }
      
      // Update validity
      dateControl.updateValueAndValidity();
      positionControl.updateValueAndValidity();
      memoControl.updateValueAndValidity();
    });
  }

  hasErrorForRow(rowNumber: number): boolean {
    return (
      this.bryanCohenErrors()?.find((error) =>
        error.row.includes(rowNumber)
      ) !== undefined
    );
  }

  getErrorsForRow(rowNumber: number): string {
    const errorObj = this.bryanCohenErrors()?.find((error) =>
      error.row.includes(rowNumber)
    );
    if (!errorObj) return '';
    return errorObj?.errors?.map((error) => `${error}`).join('\n') || '';
  }

  getPayee(rowNumber: number) {
    const errorObj = this.bryanCohenErrors()?.find((error) =>
      error.row.includes(rowNumber)
    );
    if (errorObj) {
      this.onEditPayeeAddress(errorObj.payee_id, rowNumber);
    }
  }

  onEditPayeeAddress(payeeId: string, rowNumber: number) {
    this.isEditPayee[rowNumber] = true;
    this.subscriptions.push(
      this.payeeModalService
        .openEditPayee(payeeId, undefined, {
          edit: true,
          id: payeeId,
          page: 'bryanCohenPayee'
        })
        .subscribe((payeeModal) => {
          if (payeeModal) {
            this.subscriptions.push(
              payeeModal.afterClosed().subscribe((result) => {
                this.isEditPayee[rowNumber] = false;
                if (result?.success) {
                  this.removeBryanCohenError(rowNumber);
                }
              })
            );
          }
        })
    );
  }

  removeBryanCohenError(rowNumber: number) {
    this.bryanCohenErrors.update((errors) =>
      errors.filter((error) => !error.row.includes(rowNumber))
    );
  }

  changeTab(tab: string) {
    this.activeTab.set(tab);
  }

  removeFormFromChecksArray(index: number) {
    this.checks.removeAt(index);
    this.checkCountInput.setValue(this.checks.length);
    this.countTotal();
  }

  deselectRowForPayment(checked: boolean, index: number) {
    const check = this.checks.controls[index];
    check.controls.isSelectedForPayment.setValue(checked);
    this.countTotal();
  }

  selectAllRowsForPayment(checked: boolean) {
    this.checks.controls.forEach((check) => {
      check.controls.isSelectedForPayment.setValue(checked);
    });
    this.countTotal();
  }

  checkPlugin(){
    this.subscriptions.push(
      this.headerService._headerData.subscribe((res) => {
        if(res){
          if(res.enabledPlugins.includes('qb-multiple-export')){
            this.isQBMultipleExportEnabled.set(true);
          }
        }
      })
    );
  }

  getQbCompanies(bankId: string){
    this.subscriptions.push(
      this.checkService.getCompanies(bankId).subscribe((res) => {
        this.realmId.set(res.data.realmId);
        this.qbCompanyDetails.set(res.data);
        if(this.realmId()){
          this.qbCategoryPage = 2;
          this.qbCategories.set([]);
          this.getQbSettings();
          this.getQbCategories();
        }
      })
    );
  }

  getQbSettings(){
    this.subscriptions.push(
      this.checkService.isPushBackEnable().subscribe((res) => {
        this.isQBPushbackEnabled.set(res.data.isPushBackEnabled === 1 && !!this.qbCompanyDetails().qbBankId);
        this.isQBShowWarning.set(res.data.showWarning === 1);
        if(this.isQBMultipleExportEnabled() && this.isQBPushbackEnabled()){
          this.isExportToQbOnlineSelected.set(true);
        }
      })
    );
  }

  getQbCategories(){
    this.subscriptions.push(
      this.checkService.GetCompanyDetails('category-items', this.realmId() ?? '').subscribe((res) => {
        this.qbCategories.set(res.data);
      })
    );
  }

  onScrollQBCategories() {
    if (!this.realmId()) return;
    this.subscriptions.push(
      this.checkService
        .GetCompanyDetailsPagination('category-items', this.realmId() as any, this.qbCategoryPage, '')
        .subscribe((res) => {
          if (res.success) {
            this.qbCategories.update(current => [...current, ...res.data]);
            this.qbCategoryPage += 1;
          }
        })
    );
  }

  onSearchQBCategories(searchTerm: string) {
    if (!this.realmId()) return;
    this.subscriptions.push(
      this.checkService
        .GetCompanyDetailsPagination('category-items', this.realmId() as any, 0, searchTerm)
        .subscribe((res) => {
          this.qbCategories.set(res.data);
          this.qbCategoryPage = 2;
        })
    );
  }

  private isGroupEditPage(): boolean {
    return this.pageInfo?.name === 'group' && !!this.groupId;
  }

  isQbOnlineExportSelected(): boolean {
    return this.isGroupEditPage()
      ? this.isGroupQBMultipleExportSelected()
      : this.isExportToQbOnlineSelected();
  }

  private shouldIncludeQbExportData(): boolean {
    return (
      this.isQBMultipleExportEnabled() &&
      this.isQBPushbackEnabled() &&
      this.isQbOnlineExportSelected()
    );
  }

  isQBMultipleExportEnabledClicked(isChecked: boolean) {
    if (this.isGroupEditPage()) {
      this.isGroupQBMultipleExportSelected.set(isChecked);
    } else {
      this.isExportToQbOnlineSelected.set(isChecked);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }
}
