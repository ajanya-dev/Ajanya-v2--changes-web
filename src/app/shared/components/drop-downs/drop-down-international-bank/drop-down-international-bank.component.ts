import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { Utils } from 'src/app/data/utils';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IInternationalPayeeAccount } from 'src/app/modules/cloud-bank/cloud-bank-v2/model/internationalPayments';
import { MatTooltipModule } from '@angular/material/tooltip';
import { faCircleQuestion } from '@fortawesome/pro-solid-svg-icons';

@Component({
  standalone: true,
  imports: [NgSelectModule, FormsModule, CommonModule, FontAwesomeModule,MatTooltipModule],
  selector: 'app-drop-down-international-bank',
  templateUrl: './drop-down-international-bank.component.html',
  styleUrls: ['./drop-down-international-bank.component.scss']
})
export class DropDownInternationalBankComponent implements OnChanges {
  @Input() data: IInternationalPayeeAccount[] = [];
  @Input() payeeDetails: IInternationalPayeeAccount[] = [];
  @Input() selectedPayeeName: string;
  @Input() placeholder = 'Select Payee Bank Account';
  @Input() enableAddNew: boolean = true;
  @Output() selectionChange = new EventEmitter();
  @Output() addPayeeEvent: EventEmitter<void> = new EventEmitter<void>();
  @Output() clearEvent = new EventEmitter();
  utils = Utils;

  faCircleQuestion=faCircleQuestion;

  /**
   * Access ng-select
   */
  @ViewChild(NgSelectComponent) ngSelectComponent: NgSelectComponent;

  ngOnChanges(changes: SimpleChanges) {
    if (changes.selectedPayeeName) {
      this.updateSelectValue();
    }
  }

  /**
   * @description Emits `selectionEvent` when selection is made. Calls `this.addBankAccountToPayeeModal` if 'add-new' is selected.
   * @param event - selection event in template.
   */
  getChange(event: IInternationalPayeeAccount | 'add-new') {
    if (event === 'add-new') {
      this.addBankAccountToPayeeModal();
      this.clearSelection();
      return;
    }
    this.getBankDisplayName(event);
    this.selectionChange.emit(event);
  }

  /**
   * @description Emits `clearEvent`.
   */
  onClear() {
    this.clearEvent.emit();
  }

  /**
   * @description Clears the selection in ng select.
   */
  clearSelection() {
    this.ngSelectComponent.handleClearClick();
  }

  /**
   * @description Opens modal for adding bank account to payee.
   */
  addBankAccountToPayeeModal(): void {
    this.addPayeeEvent.emit();
  }

  /**
   * @description Gets data based on search term.
   * @param event - event
   */
  search(searchTerm: KeyboardEvent) {
    const term = (searchTerm.target as HTMLInputElement).value;
    if (term !== '') {
      this.data = this.payeeDetails.filter((el: IInternationalPayeeAccount) =>
        el.bank_name.includes(term)
      );
    } else {
      this.data = this.payeeDetails;
    }
  }

  /**
   * @description Updates `this.selectedPayeeName` if the any bank name includes the same, in `this.payeeDetails`.
   */
  updateSelectValue() {
    if (this.payeeDetails) {
      const selected = this.payeeDetails.filter(
        (el: IInternationalPayeeAccount) =>
          el.bank_name.includes(this.selectedPayeeName)
      );
      if (selected.length) {
        this.selectedPayeeName = `${selected[0].bank_name} - ${this.utils.getMaskedAcNo(String(selected[0].account_number))}`;
      }
    }
  }

  /**
   * @description Updates `this.selectedPayeeName` if the any bank name includes the same, in `this.payeeDetails`.
   */
  getBankDisplayName(bankData: IInternationalPayeeAccount) {
    if (bankData)
      this.selectedPayeeName = `${bankData.bank_name} - ${this.utils.getMaskedAcNo(bankData.account_number)}`;
  }

  /**
   * @description Method for ngFor trackBy.
   * @param index - Index of item.
   * @param item - Array item.
   * @returns Item id.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trackById(index: number, item: any) {
    return item?.id;
  }
}
