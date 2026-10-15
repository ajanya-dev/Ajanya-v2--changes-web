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
import { IPayeeBankDetails } from 'src/app/modules/payee/payee-v2/model/payee';
import { Utils } from 'src/app/data/utils';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  faCircleQuestion,
  faCircleCheck
} from '@fortawesome/pro-solid-svg-icons';

/**
 * @description Drop down component for payee bank accounts.
 */
@Component({
  standalone: true,
  imports: [NgSelectModule, FormsModule, CommonModule, FontAwesomeModule, MatTooltipModule],
  selector: 'app-drop-down-payee-bank',
  templateUrl: './drop-down-payee-bank.component.html',
  styleUrls: ['./drop-down-payee-bank.component.scss']
})
export class DropDownPayeeBankComponent implements OnChanges {
  @Input() data: IPayeeBankDetails[] = [];
  @Input() payeeDetails: IPayeeBankDetails[] = [];
  @Input() selectedPayeeName: string;
  @Input() placeholder = 'Select Payee Bank Account';
  @Input() enableAddNew: boolean = true;
  @Output() selectionChange = new EventEmitter();
  @Output() addPayeeEvent: EventEmitter<void> = new EventEmitter<void>();
  @Output() clearEvent = new EventEmitter();
  utils = Utils;

  faCircleQuestion=faCircleQuestion
  faVerified = faCircleCheck;

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
  getChange(event: Event | 'add-new') {
    if (event === 'add-new') {
      this.addBankAccountToPayeeModal();
      this.clearSelection();
      return;
    }
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
      this.data = this.payeeDetails.filter((el: IPayeeBankDetails) =>
        el.bankName.includes(term)
      );
    } else {
      this.data = this.payeeDetails;
    }
  }

  /**
   * @description Updates `this.selectedPayeeName` if the any bank name includes the same, in `this.payeeDetails`.
   */
  updateSelectValue() {
    const selected = this.payeeDetails.filter((el: IPayeeBankDetails) =>
      el.bankName.includes(this.selectedPayeeName)
    );
    if (selected.length) {
      this.selectedPayeeName = `${selected[0].bankName} - ${this.utils.getMaskedAcNo(String(selected[0].accountNumber))}`;
    }
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
