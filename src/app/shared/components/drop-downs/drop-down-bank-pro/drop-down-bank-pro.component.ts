import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewEncapsulation
} from '@angular/core';
import { Subscription } from 'rxjs';
import { IBankDropdown } from 'src/app/models/bank';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { BankAccountsService } from '../../../service/bankAccounts/bank-accounts.service';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';

/**
 * @description Drop down component for bank with type included.
 */
@Component({
  standalone: true,
  imports: [NgSelectModule, FormsModule, CommonModule],
  selector: 'app-drop-down-bank-pro',
  templateUrl: './drop-down-bank-pro.component.html',
  styleUrls: ['./drop-down-bank-pro.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class DropDownBankProComponent implements OnInit, OnDestroy {
  // @Input() data:string[]=[];
  @Input() placeholder = 'Select Bank Account';
  @Input() selectedId!: string;
  addStatus = true;
  @Input() name = 'id';
  @Input() selectedItem: string | null;
  @Output() selectionEvent = new EventEmitter();

  @Input() type = 'ach-apply';
  @Input() filterZilBank = true;
  // ach-apply
  // manual-ach
  // cloud-bank
  // subscription

  page = 1;
  searchTerm = '';
  bankAccounts: IBankDropdown[] = [];
  subscriptions: Subscription[] = [];

  constructor(
    private _bankService: BankAccountsService,
    private _sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.loadBankAccounts();

    this._sharedService.getNewBankCreatedData().subscribe((result) => {
      if (result == null || result == undefined || result == '') {
        this.selectedItem = null;
        this.placeholder;
      }

      if (!result) {
        return;
      }

      //******************for create new bank  and set that name automaticaly into the bank acc field******** */
      this.subscriptions.push(
        this._bankService
          .getBankAccounts(this.page, undefined, this.addStatus ? 1 : undefined)
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
                this.selectedItem = res.data.bankAccountNickName;
              })
          );
          return;
        }
        this.selectedItem = result.bankAccountNickName;
      }
    });
  }

  /**
   * @description Loads the bank accounts and sets it to `this.bankAccounts`.
   */
  loadBankAccounts() {
    this.subscriptions.push(
      this._bankService
        .getBankAccounts(this.page, undefined, this.addStatus ? 1 : undefined)
        .subscribe((res) => {
          if (!res?.success) {
            return;
          }

          if (this.type === 'ach-apply' && this.filterZilBank) {
            this.bankAccounts = res.data.filter((resp: IBankDropdown) => {
              return resp.status != 5;
            });
            this.onScrollToEnd();
          }

          if (this.type === 'manual-ach' && !this.filterZilBank) {
            this.bankAccounts = res.data;
            this.onScrollToEnd();
          } else {
            this.bankAccounts = res.data;
          }
        })
    );
  }

  /**
   * @description Emits `selectionEvent` when selection is made. Opens add new bank account dialog if 'add-new' is selected.
   * @param event - selection event in template.
   */
  getChange(event: IBankDropdown) {
    this.selectionEvent.emit(event);
  }

  /**
   * @description Gets next 10 element on each scroll event
   */
  onScrollToEnd() {
    this.page++;
    this.subscriptions.push(
      this._bankService
        .getBankAccounts(this.page, undefined, this.addStatus ? 1 : undefined)
        .subscribe((res) => {
          const that = this;
          res.data.forEach((element: IBankDropdown) => {
            if (this.type === 'ach-apply' && this.filterZilBank) {
              if (element.status != 5) {
                that.bankAccounts.push(element);
                return;
              }
            }
            if (this.type === 'manual-ach' && !this.filterZilBank) {
              that.bankAccounts.push(element);
            } else {
              that.bankAccounts.push(element);
            }
          });
        })
    );
  }

  /**
   * @description Gets data based on search term.
   * @param event - event
   */
  search(event: KeyboardEvent) {
    let page = 0;

    this.searchTerm = (event?.target as HTMLInputElement).value;
    if (this.searchTerm === '') {
      page = 1;
    }
    this.subscriptions.push(
      this._bankService
        .getBankAccounts(page, this.searchTerm)
        .subscribe((res) => {
          if (this.type === 'ach-apply' && this.filterZilBank) {
            this.bankAccounts = res.data.filter((resp: IBankDropdown) => {
              return resp.status != 5;
            });
          }
          if (this.type === 'manual-ach' && !this.filterZilBank) {
            this.bankAccounts = res.data;
          } else {
            this.bankAccounts = res.data;
          }
        })
    );
  }

  ngOnDestroy(): void {
    this._sharedService.setNewBankCreatedData();

    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
