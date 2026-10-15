import {
  Component,
  DestroyRef,
  OnInit,
  ViewChildren,
  QueryList,
  inject,
  input,
  output
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { LucideAngularModule, Plus, Trash2 } from 'lucide-angular';
import { Utils } from 'src/app/data/utils';
import {
  IInvoiceDropdown,
  IItemsViewBill
} from 'src/app/modules/invoices/model/invoice';
import { AddInvoiceItemV4Component } from 'src/app/shared/modal/invoice-modal/add-invoice-item-v4/add-invoice-item-v4.component';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import { CommonAmountInputV4Component } from 'src/app/shared/V4/common-amount-input-v4/common-amount-input-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { Iv4ngSelectConfig } from 'src/app/shared/V4/v4-dropdown/models/v4-common-dropdown-selector.interface';
import { IBillItems } from '../../../model/Bill';
import { MatTooltip } from '@angular/material/tooltip';

interface IFormItem {
  id: string | number;
  description: string | null;
  quantity: number | null;
  unitPrice: number | null;
  total: number;
  name: string | null;
}

@Component({
  selector: 'app-add-items-v4',
  templateUrl: './add-items-v4.component.html',
  styleUrls: ['./add-items-v4.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    V4CommonDropDownSelectorComponent,
    CommonAmountInputV4Component,
    CommonInputFieldV4Component,
    LucideAngularModule,
    CurrencyPipe,
    MatTooltip
  ]
})
export class AddItemsV4Component implements OnInit {
  mode = input<string>();
  isEmbedded = input(false);
  hasIncomingItems = input(false);
  itemTotal = output<{ items: IBillItems[]; total: number }>();
  tableScroll = output<void>();

  @ViewChildren(V4CommonDropDownSelectorComponent)
  invoiceItemDropdowns: QueryList<V4CommonDropDownSelectorComponent>;

  readonly PlusIcon = Plus;
  readonly Trash2Icon = Trash2;

  utils = Utils;

  readonly itemDropdownConfig: Iv4ngSelectConfig = {
    placeholder: 'Select Items',
    displayField: 'name',
    outputField: 'id',
    enableAddNew: true,
    addNewLabel: 'Add New Item',
    addNewSubLabel: 'Create a new invoice item',
    style: { size: 1 }
  };

  itemForm: FormGroup;
  invoiceItems: IInvoiceDropdown[] = [];

  page = 1;
  total = 0;

  searchTimeout: ReturnType<typeof setTimeout>;

  private invoiceService = inject(InvoiceService);
  public fb = inject(FormBuilder);
  public dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.getInvoiceItems();
    this.initItemsForm();

    if (
      this.mode() === 'new' &&
      !this.isEmbedded() &&
      !this.hasIncomingItems()
    ) {
      this.pushItem(2);
    }
    this.isCloseDropDown();
  }

  initItemsForm() {
    this.itemForm = this.fb.group({
      items: this.fb.array([])
    });
  }

  get items() {
    return this.itemForm.get('items') as FormArray;
  }

  pushItem(numberOfItems = 1) {
    for (let i = 0; i < numberOfItems; i += 1) {
      this.items.push(this.getItemRow());
    }
  }

  removeItem(index: number) {
    this.items.removeAt(index);
    this.setTotal();
  }

  getItemRow(item?: IItemsViewBill) {
    const group = this.fb.group({
      id: [item ? item.itemId : undefined, Validators.required],
      description: [item ? item.description : null],
      quantity: [item ? item.qty : null],
      unitPrice: [item ? item.cost : null],
      total: [item ? item.total : 0, Validators.required],
      name: [item ? item.itemName : null]
    });

    const idControl = group.get('id');
    if (idControl) {
      idControl.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((value) => {
          const index = this.items.controls.indexOf(group);
          if (index !== -1) {
            this.itemChange(value ?? '', index);
          }
        });
    }

    return group;
  }

  getInvoiceItems(searchTerm = '') {
    this.invoiceService
      .getinvoiceitem(this.page, searchTerm)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        if (data?.success) {
          this.pushInvoiceItem(data.data);
        }
      });
  }

  pushInvoiceItem(items: IInvoiceDropdown[]) {
    const newItems = items.filter(
      (item) => !this.invoiceItems.some((existing) => existing.id === item.id)
    );
    if (newItems.length) {
      this.invoiceItems = [...this.invoiceItems, ...newItems];
    }
  }

  search(searchTerm: string) {
    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.getInvoiceItems(searchTerm);
    }, 700);
  }

  itemChange(event: string, index: number) {
    if (!event) {
      this.items.controls[index].patchValue({
        quantity: undefined,
        unitPrice: undefined,
        description: undefined,
        total: undefined,
        name: undefined
      });
    } else {
      this.invoiceItems.forEach((item) => {
        if (item.id === event) {
          this.items.controls[index].patchValue({
            quantity: 1,
            unitPrice: item.unitPrice,
            description: item.note,
            total: item.unitPrice,
            name: item.name
          });
        }
      });
    }
    this.setTotal();
  }

  onScrollToEnd() {
    this.page += 1;
    this.getInvoiceItems();
  }

  countTotal(): number {
    let totalAmount = 0;
    this.items.controls.forEach((item) => {
      const unitPrice = item.get('unitPrice')?.value
        ? parseFloat(item.get('unitPrice')?.value)
        : 0;
      const quantity = item.get('quantity')?.value
        ? parseFloat(item.get('quantity')?.value)
        : 0;

      if (!Number.isNaN(unitPrice) && !Number.isNaN(quantity)) {
        item.patchValue({
          total: unitPrice * quantity
        });
        totalAmount += unitPrice * quantity;
      }
    });

    return totalAmount;
  }

  setTotal(emit = true) {
    this.total = this.countTotal();
    const items: IBillItems[] = this.items.value
      .filter((e: IFormItem) => e.id && e.total)
      .map((e: IFormItem) => ({
        id: e.id,
        description: e.description,
        item: e.name || '',
        itemName: e.name,
        quantity: e.quantity,
        total: e.total,
        unitPrice: e.unitPrice
      }));
    if (emit) {
      this.itemTotal.emit({ items, total: this.total });
    }
  }

  setItemsForm(data: IItemsViewBill[] | string, emit = true) {
    if (!data) {
      this.pushItem(2);
      return;
    }
    if (Array.isArray(data)) {
      data.forEach((e) => {
        this.invoiceItems.push({
          id: e.itemId,
          name: e.itemName,
          unitPrice: parseFloat(e.cost)
        });
        this.items.push(this.getItemRow(e));
      });
    }

    this.setTotal(emit);
  }

  openAddInvoiceItemModal(index: number) {
    const dialogRef = this.dialog.open(AddInvoiceItemV4Component, {
      maxWidth: '500px',
      width: '93%',
      panelClass: 'paddingless-modal-rounded'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const newItem = {
          id: result.id,
          name: result.name,
          unitPrice: result.unitPrice,
          note: result.description
        };
        this.invoiceItems = [newItem, ...this.invoiceItems];
        this.itemForm.get(['items', index, 'id'])?.setValue(result.id);
        this.itemChange(result.id, index);
      }
    });
  }

  isCloseDropDown() {
    this.invoiceService.listItemScrollEvent
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.invoiceItemDropdowns.forEach((dropdown) =>
          dropdown.ngSelectComponent?.close()
        );
      });
  }

  onTableScroll(): void {
    this.tableScroll.emit();
  }
}
