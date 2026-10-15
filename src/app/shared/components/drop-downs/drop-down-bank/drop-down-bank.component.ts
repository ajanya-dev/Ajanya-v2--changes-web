import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  AfterViewInit,
  SimpleChanges,
  OnChanges,
  ViewChild,
  inject,
  input,
  effect
} from '@angular/core';
import { Subscription, catchError } from 'rxjs';
import { IBankAccountEditDetails, IBankCreateRes, IBankDropdown } from 'src/app/models/bank';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';
import { BankAccountsService } from '../../../service/bankAccounts/bank-accounts.service';

/**
 * @description Drop down component for bank accounts.
 */
@Component({
  standalone: true,
  imports: [NgSelectModule, FormsModule, CommonModule],
  selector: 'app-drop-down-bank',
  templateUrl: './drop-down-bank.component.html',
  styleUrls: ['./drop-down-bank.component.scss']
})
export class DropDownBankComponent
  implements OnInit, OnChanges, AfterViewInit, OnDestroy
{
  @Input() id = 'id'; //Its better to pass a unique id always for avoiding conflict.
  @Input() isRequired = false;
  @Input() placeholder = 'Select Bank Account';
  @Input() addTag = false;
  @Input() isDropdownDisabled = false;
  @Input() showACHBadge = false;
  @Input() name = 'id';
  @Input() verifyColor = false;
  @Input() ismapping: string;
  @Input() displayCreditCardAd: boolean;
  @Input() selectDropdownItem: IBankDropdown;
  @Input() enableAddNew: false;
  @Input() isPayroll = false;
  @Input() appendTo = 'body';
  shouldReload = input<boolean>(false);
  payload = input<any|undefined>(undefined);
  selectedBankId = input('');

  @Output() selectionEvent = new EventEmitter<IBankDropdown>();
  @Output() newBankAccountAdded = new EventEmitter();
  @Output() clearEvent = new EventEmitter();

  selectedItem: IBankDropdown | string | null;
  page = 1;
  searchTerm = '';
  bankAccounts: IBankDropdown[] = [];
  subscriptions: Subscription[] = [];
  searchTimeout: ReturnType<typeof setTimeout>;

  private _paymentService = inject(PaymentsService);

  constructor(
    private _bankService: BankAccountsService,
    private _sharedService: SharedService,
    private headerService: HeaderService,
    private bankModalService: BankModalService,
  ) {
    effect(() => {
      if(!this.selectedBankId()) return;
      this.getBankByIds([this.selectedBankId()as string]);
    }, {allowSignalWrites: true});

    effect(() => {
      const isReload = this.shouldReload();      
      if (!isReload) return;
      this.loadBankAccounts(true);
    }, {allowSignalWrites: true});
  }

  /* Access ng-select */
  @ViewChild(NgSelectComponent) ngSelectComponent: NgSelectComponent;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.isRequired) {
      this.loadRequiredLabel();
    }
    if (changes.selectDropdownItem && this.selectDropdownItem) {
      this.handleSelectedItem();
    }
    if (this.selectDropdownItem === undefined && this.isPayroll) {
      this.selectedItem = this.selectDropdownItem;
    }
  }

  ngAfterViewInit(): void {
    this.loadRequiredLabel();
  }

  ngOnInit(): void {
    this.loadBankAccounts();

    this.subscriptions.push(
      this._sharedService.getNewBankCreatedData().subscribe((result) => {
        if (result == null || result == undefined || result == '') {
          this.selectedItem = null;
        }
  
        if (!result) {
          return;
        }
  
        //******************for create new bank  and set that name automaticaly into the bank acc field******** */
        this.subscriptions.push(
          this._bankService
            .getBankAccounts(
              this.page,
              undefined,
              this.showACHBadge ? 1 : undefined,
              this.ismapping ? this.ismapping : undefined,
              undefined,
              undefined,
              undefined,
              this.payload()  
            )
            .subscribe((res) => {
              this.bankAccounts = res.data;
            })
        );
  
        //***********************in edit case use this section******************** */
        if (result) {
          if (result.bankAccountId != undefined) {
            //Call API only when create new account
            this.subscriptions.push(
              this._bankService
                .viewBankById(result.bankAccountId)
                .subscribe((res) => {
                  const dropdownItem = this.convertIntoDropdownFormat(res.data)
                  this.bankAccounts.push(dropdownItem);
                  this.selectedItem = dropdownItem;
                })
            );
            return;
          }
          if (result.res) {
            const newBankDetails = this.convertIntoDropdownFormat(result.res);
            this.selectedItem = `${newBankDetails.nickName ?? ''}${newBankDetails.nickName ? ' ' : ''}${newBankDetails.accountNumber}`;
          } else {
            this.selectedItem = result.bankAccountNickName;
          }
        }
      })
    );
  }

  /**
   * @description THe selected drop down item is added to `this.bankAccounts` if not already present.
   * Also sets the same to `this.selectedItem`
   */
  handleSelectedItem() {
    setTimeout(() => {
      if (!this.isPayroll) {
        if (!this.bankAccounts.includes(this.selectDropdownItem)) {
          this.bankAccounts.push(this.selectDropdownItem);
        }
        this.selectedItem = this.selectDropdownItem;
      } else {
        const existingItem = this.bankAccounts.find(
          (res) => res.id === this.selectDropdownItem.id
        );
        if (!existingItem) {
          this.bankAccounts.push(this.selectDropdownItem);
        } else {
          this.selectedItem = existingItem;
        }
      }
    }, 100);
  }

  /**
   * @description Loads the bank accounts and sets it to `this.bankAccounts`.
   */
  loadBankAccounts(refreshList?: boolean) {
    this.subscriptions.push(
      this._bankService
        .getBankAccounts(
          this.page,
          undefined,
          this.showACHBadge ? 1 : undefined,
          this.ismapping ? this.ismapping : undefined,
          undefined,
          undefined,
          undefined,
          this.payload()  
        )
        .pipe(
          catchError((error) => {
            if (
              error.error.permissionRequired === 'bankaccount-read' &&
              error.error.permissionType === 'page'
            ) {
              const noPermission = {
                noPermission: true,
                payMethode: 'bank accounts'
              };
              this._paymentService.isPermissionDenied.next(noPermission);
            }
            throw error;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.bankAccounts = res.data;
            if (refreshList) {
              this.handleSelectedItem();
              const existingItem = this.bankAccounts.find(
                (res) => res.id === this.selectDropdownItem.id
              );
              this.selectionEvent.emit(existingItem);
            }
          }
        })
    );
  }

  /**
   * @description Emits `selectionEvent` when selection is made. Opens add new bank account dialog if 'add-new' is selected.
   * @param event - selection event in template.
   */
  getChange(event: IBankDropdown | 'add-new') {
    if (event === 'add-new') {
      this.addNewBankAccount();
      this.ngSelectComponent.handleClearClick();
      return;
    }
    this.selectionEvent.emit(event);
  }

  /**
   * @description Clears the selection in ng select.
   */
  clearSelection() {
    this.ngSelectComponent.handleClearClick();
  }

  /**
   * @description Gets next 10 element on each scroll event
   */
  onScrollToEnd() {
    this.subscriptions.push(
      this._bankService
        .getBankAccounts(
          this.page + 1,
          this.searchTerm,
          this.showACHBadge ? 1 : undefined,
          this.ismapping ? this.ismapping : undefined,
          undefined,
          undefined,
          undefined,
          this.payload()  
        )
        .subscribe((res) => {
          if (res.data.length !== 0) {
            this.page++;
          }

          const that = this;
          res.data.forEach((element: IBankDropdown) => {
            that.bankAccounts.push(element);
          });
        })
    );
  }

  /**
   * @description Gets data based on search term.
   * @param event - event
   */
  search(event: KeyboardEvent) {
    clearTimeout(this.searchTimeout);
    this.searchTerm = (event?.target as HTMLInputElement).value;
    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.subscriptions.push(
        this._bankService
          .getBankAccounts(
            this.page,
            this.searchTerm,
            undefined,
            this.ismapping ? this.ismapping : undefined,
            undefined,
            undefined,
            undefined,
            this.payload()  
          )
          .subscribe((res) => {
            this.bankAccounts = res.data;
          })
      );
    }, 600);
  }

  /**
   * @description CLears the changes made.
   */
  clear() {
    this.searchTerm = '';
    this.loadBankAccounts();
    this.clearEvent.emit();
  }

  /**
   * @description Adds or removes required label class.
   */
  loadRequiredLabel(): void {
    const dd = document.querySelectorAll(
      `#drop_down_${this.id} .ng-select-container .ng-value-container .ng-placeholder`
    );
    if (this.isRequired) dd[0]?.classList.add('drop_down_required_star');
    else dd[0]?.classList.remove('drop_down_required_star');
  }

  /**
   * @description Opens modal dialog for adding new bank account. Emits `newBankAccountAdded` event, on success.
   */
  addNewBankAccount() {
    if(this.bankModalService.isBankPermissionChecking()) return;
    this.subscriptions.push(
      this.bankModalService.openAddBankOptimizedModal().subscribe((bankModal) => {
        if (bankModal) {
          this.subscriptions.push(
            bankModal.afterClosed().subscribe((result) => {
              
              if (result?.success) {
                const bankDetails = this.convertIntoDropdownFormat(
                  result.bankAcData as IBankCreateRes
                );
                this.bankAccounts.push(bankDetails);
                this.newBankAccountAdded.emit(bankDetails);
                this.selectDropdownItem = bankDetails;
                this.headerService.refreshDynamicHeader.next(true);
              }
            })
          );
        }
      })
    );
  }

  convertIntoDropdownFormat(data: IBankCreateRes | IBankAccountEditDetails): IBankDropdown {
    return {
      accountNumber: `xxxx${data.bankAccountNumber.slice(-4)}`,
      achApplicationStatus: 0,
      bankName: data.bankAccountName,
      cashAccount: 0,
      id: data.id,
      isItZil: 0,
      mAch: 0,
      name: '',
      nickName: data.bankAccountNickName,
      status: '',
      statusDescription: '',
      verified: 0,
      verifiedBy: '',
      payrollVerified: (data as IBankAccountEditDetails).payrollVerified ?? 0
    };
  }

  getBankByIds(bankId:string[]){
    this.subscriptions.push(
      this._bankService.getBankAccountByIds(bankId).
      subscribe((res) => {
        if(res.success){
          this.bankAccounts.push(res.data[0]);
          this.selectedItem = res.data[0];
        }
      })
    )
  }

  ngOnDestroy(): void {
    this._sharedService.setNewBankCreatedData();
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
