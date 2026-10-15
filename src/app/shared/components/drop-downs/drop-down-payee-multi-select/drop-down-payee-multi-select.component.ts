import { CommonModule } from '@angular/common';
import {
  Component,
  effect,
  EventEmitter,
  inject,
  input,
  Input,
  OnDestroy,
  OnInit,
  Output,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faSpinner } from '@fortawesome/pro-solid-svg-icons';
import { NgSelectModule } from '@ng-select/ng-select';
import { finalize, Subscription } from 'rxjs';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';

/**
 * @description Drop down component for payee with multi select.
 */
@Component({
  standalone: true,
  imports: [
    NgSelectModule,
    FormsModule,
    CommonModule,
    MatTooltip,
    FaIconComponent
  ],
  selector: 'app-drop-down-payee-multi-select',
  templateUrl: './drop-down-payee-multi-select.component.html',
  styleUrls: ['./drop-down-payee-multi-select.component.scss']
})
export class DropDownPayeeMultiSelectComponent implements OnInit, OnDestroy {
  private payeeService = inject(PayeeService);
  private sharedService = inject(SharedService);

  @Input() placeholder = 'Select Your Payee';
  @Input() appendTo = 'ng-select';
  selectedPayeeIds = input<string[] | null>(null);
  sliceNumber = input<number>(3);
  isSliceNeed = input<boolean>(false);

  @Output() selectionEvent = new EventEmitter();

  isLoading = signal(false);
  subscriptions: Subscription[] = [];
  page = 1;
  searchTerm = '';
  payees: IPayeeDropdown[] = [];
  selectedPayees: IPayeeDropdown[] = [];
  searchTimeout: ReturnType<typeof setTimeout>;
  faSpinner = faSpinner;

  constructor() {
    effect(
      () => {
        if (!this.selectedPayeeIds() || this.selectedPayeeIds() === null)
          return;
        this.getPayees(this.selectedPayeeIds() as string[]);
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit(): void {
    this.loadPayees();
  }

  /**
   * @description Load the payees list.
   */
  loadPayees() {
    this.isLoading.set(true);
    this.subscriptions.push(
      this.payeeService
        .getPayees(this.page)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe((res) => {
          this.payees = res.data;
        })
    );
  }

  /**
   * @description Emits `selectionEvent`.
   * @param event - selection event.
   */
  payeeSelect(event: IPayeeDropdown) {
    if (event) {
      if (this.selectedPayees.length) {
        this.removeDuplicatesAndRelated();
        return;
      }
      this.selectionEvent.emit(event);
    }
  }

  removeDuplicatesAndRelated() {
    const seen = new Set<string>();
    const toRemove = new Set<string>();
    // eslint-disable-next-line no-restricted-syntax
    for (const payee of this.selectedPayees) {
      if (seen.has(payee.id)) {
        toRemove.add(payee.id);
      } else {
        seen.add(payee.id);
      }
    }
    this.selectedPayees = this.selectedPayees.filter(
      (payee) => !toRemove.has(payee.id)
    );
    this.selectionEvent.emit(this.selectedPayees);
  }

  /**
   * @description Gets next 10 element on each scroll event
   */
  onScrollToEnd() {
    this.subscriptions.push(
      this.payeeService
        .getPayees(this.page + 1, this.searchTerm)
        .subscribe((res) => {
          this.page += 1;
          res.data.forEach((element: IPayeeDropdown) => {
            this.payees.push(element);
          });
          this.payees = [...this.payees];
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
        this.payeeService
          .getPayees(this.page, this.searchTerm)
          .subscribe((res) => {
            this.payees = res.data;
          })
      );
    }, 600);
  }

  getPayees(payeeIds: string[]) {
    if(!payeeIds?.length) return;
    this.subscriptions.push(
      this.payeeService.getPayeesByIds(payeeIds).subscribe((res) => {
        // Filter out payees that already exist in the array
        const newPayees = res.data.filter(
          (newPayee) =>
            !this.payees.some(
              (existingPayee) => existingPayee.id === newPayee.id
            )
        );

        // Add only new payees to the existing array
        this.payees = [...this.payees, ...newPayees];
        this.selectedPayees = this.payees.filter((payee) =>
          payeeIds.includes(payee.id)
        );
      })
    );
  }

  clear() {
    this.searchTerm = '';
    this.selectedPayees = [];
    this.selectionEvent.emit(this.selectedPayees);
  }

  isItemSelected(item: IPayeeDropdown): boolean {
    return this.selectedPayees?.some(
      (selected) => selected.id === item.id
    ) as boolean;
  }

  clearItem(payeeId: string) {
    this.selectedPayees = this.selectedPayees.filter(
      (selected) => selected.id !== payeeId
    );
    this.selectionEvent.emit(this.selectedPayees);
  }

  ngOnDestroy(): void {
    this.sharedService.setNewPayeeCreatedData(null);

    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
