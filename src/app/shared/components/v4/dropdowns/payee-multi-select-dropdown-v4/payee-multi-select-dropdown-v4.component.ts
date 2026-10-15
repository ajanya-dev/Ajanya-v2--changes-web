import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  effect,
  inject,
  Input,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
  ViewEncapsulation
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTooltip } from '@angular/material/tooltip';
import { LucideAngularModule, LoaderCircle, Check } from 'lucide-angular';
import { NgSelectModule } from '@ng-select/ng-select';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';

@Component({
  standalone: true,
  imports: [
    NgSelectModule,
    FormsModule,
    CommonModule,
    MatTooltip,
    LucideAngularModule
  ],
  selector: 'app-payee-multi-select-dropdown-v4',
  templateUrl: './payee-multi-select-dropdown-v4.component.html',
  styleUrls: ['./payee-multi-select-dropdown-v4.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PayeeMultiSelectDropdownV4Component implements OnInit, OnDestroy {
  private payeeService = inject(PayeeService);
  private sharedService = inject(SharedService);
  private destroyRef = inject(DestroyRef);

  @Input() placeholder = 'All Payees';
  @Input() appendTo = 'body';
  selectedPayeeIds = input<string[] | null>(null);
  sliceNumber = input<number>(5);
  isSliceNeed = input<boolean>(true);

  selectionEvent = output<IPayeeDropdown | IPayeeDropdown[]>();

  readonly LoaderIcon = LoaderCircle;
  readonly CheckIcon = Check;

  isLoading = signal(false);
  page = signal(1);
  searchTerm = signal('');
  payees = signal<IPayeeDropdown[]>([]);
  selectedPayees = signal<IPayeeDropdown[]>([]);
  searchTimeout: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      const ids = this.selectedPayeeIds();
      if (!ids || ids === null) return;
      this.getPayees(ids);
    });
  }

  ngOnInit(): void {
    this.loadPayees();
  }

  loadPayees() {
    this.isLoading.set(true);
    this.payeeService
      .getPayees(this.page())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe((res) => {
        this.payees.set(res.data);
      });
  }

  payeeSelect(event: IPayeeDropdown) {
    if (event) {
      if (this.selectedPayees().length) {
        this.removeDuplicatesAndRelated();
        return;
      }
      this.selectionEvent.emit(event);
    }
  }

  removeDuplicatesAndRelated() {
    const seen = new Set<string>();
    const toRemove = new Set<string>();
    this.selectedPayees().forEach((payee) => {
      if (seen.has(payee.id)) {
        toRemove.add(payee.id);
      } else {
        seen.add(payee.id);
      }
    });
    this.selectedPayees.update((current) =>
      current.filter((payee) => !toRemove.has(payee.id))
    );
    this.selectionEvent.emit(this.selectedPayees());
  }

  onScrollToEnd() {
    this.payeeService
      .getPayees(this.page() + 1, this.searchTerm())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.page.update((p) => p + 1);
        this.payees.update((current) => [...current, ...res.data]);
      });
  }

  search(event: KeyboardEvent) {
    clearTimeout(this.searchTimeout);
    this.searchTerm.set((event?.target as HTMLInputElement).value);
    this.searchTimeout = setTimeout(() => {
      this.page.set(1);
      this.payeeService
        .getPayees(this.page(), this.searchTerm())
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((res) => {
          this.payees.set(res.data);
        });
    }, 600);
  }

  getPayees(payeeIds: string[]) {
    if (!payeeIds?.length) return;
    this.payeeService
      .getPayeesByIds(payeeIds)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        const currentPayees = this.payees();
        const newPayees = res.data.filter(
          (newPayee) =>
            !currentPayees.some(
              (existingPayee) => existingPayee.id === newPayee.id
            )
        );
        this.payees.set([...currentPayees, ...newPayees]);
        this.selectedPayees.set(
          this.payees().filter((payee) => payeeIds.includes(payee.id))
        );
      });
  }

  clear() {
    this.searchTerm.set('');
    this.selectedPayees.set([]);
    this.selectionEvent.emit(this.selectedPayees());
  }

  isItemSelected(item: IPayeeDropdown): boolean {
    return this.selectedPayees()?.some(
      (selected) => selected.id === item.id
    ) as boolean;
  }

  clearItem(payeeId: string) {
    this.selectedPayees.update((current) =>
      current.filter((selected) => selected.id !== payeeId)
    );
    this.selectionEvent.emit(this.selectedPayees());
  }

  getMoreItemsTooltip(items: IPayeeDropdown[]): string {
    return items.map((item) => item.name).join(', ');
  }

  ngOnDestroy(): void {
    this.sharedService.setNewPayeeCreatedData(null);
  }
}
