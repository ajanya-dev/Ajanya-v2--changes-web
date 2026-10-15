import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  Input,
  OnDestroy,
  ViewChildren,
  QueryList
} from '@angular/core';
import {
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { CurrencyPipe, NgClass } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { faPlus, faLevelUp } from '@fortawesome/pro-solid-svg-icons';
import { faTrash } from '@fortawesome/pro-regular-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { Subscription } from 'rxjs';
import { Utils } from 'src/app/data/utils';
import {
  IInvoiceDropdown,
  IItemsViewBill
} from 'src/app/modules/invoices/model/invoice';
import { AddInvoiceItemComponent } from 'src/app/shared/modal/invoice-modal/add-invoice-item/add-invoice-item.component';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { AmountInputComponent } from '../../../../shared/components/amount-input/amount-input.component';
import { CommonInputFieldComponent } from '../../../../shared/v3/common-input-field/common-input-field.component';
import { IBillItems } from '../../model/Bill';

interface IFormItem {
  id: string | number;
  description: string | null;
  quantity: number | null;
  unitPrice: number | null;
  total: number;
  name: string | null;
}

@Component({
  selector: 'app-add-items',
  templateUrl: './add-items.component.html',
  styleUrls: ['./add-items.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgClass,
    NgSelectModule,
    AmountInputComponent,
    FaIconComponent,
    CommonInputFieldComponent,
    CurrencyPipe,
    CommonButtonV35Component
  ]
})
export class AddItemsComponent implements OnInit, OnDestroy {
  @Input() mode: string;
  @Input() isEmbedded: boolean = false; // Added to detect embedded mode
  @Input() hasIncomingItems: boolean = false; 
  @Output() itemTotal = new EventEmitter<{
    items: IBillItems[];
    total: number;
  }>();

  @Output() tableScroll = new EventEmitter<void>();

  @ViewChildren('invoiceItemDropdown')
  invoiceItemDropdowns: QueryList<NgSelectComponent>;

  utils = Utils;
  subscriptions: Subscription[] = [];

  headers = ['ITEM', 'DESCRIPTION', 'QUANTITY', 'UNIT COST', 'TOTAL'];

  itemForm: UntypedFormGroup;
  invoiceItems: IInvoiceDropdown[] = [];

  page = 1;
  total = 0;

  faPlus = faPlus;
  faTrash = faTrash;
  faLevelUp = faLevelUp;

  searchTimeout: ReturnType<typeof setTimeout>;

  constructor(
    private invoiceService: InvoiceService, 
    public fb: UntypedFormBuilder,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.getInvoiceItems();
    this.initItemsForm();

    // Only add default empty rows if not in embedded mode
    if (this.mode === 'new' && !this.isEmbedded && !this.hasIncomingItems) {
      this.pushItem(2);
    } else if (this.isEmbedded) {
      // In embedded mode, start with no rows - they'll be populated from invoice data
      // or user can manually add items as needed
    }
    this.isCloseDropDown();
  }

  initItemsForm() {
    this.itemForm = this.fb.group({
      items: this.fb.array([])
    });
  }

  get items() {
    return this.itemForm.get('items') as UntypedFormArray;
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
    return this.fb.group({
      id: [item ? item.itemId : undefined, Validators.required],
      description: [item ? item.description : null],
      quantity: [item ? item.qty : null],
      unitPrice: [item ? item.cost : null],
      total: [item ? item.total : 0, Validators.required],
      name: [item ? item.itemName : null]
    });
  }

  getInvoiceItems(searchTerm = '') {
    this.subscriptions.push(
      this.invoiceService
        .getinvoiceitem(this.page, searchTerm)
        .subscribe((data) => {
          if (data?.success) {
            this.pushInvoiceItem(data.data);
          }
        })
    );
  }

  pushInvoiceItem(items: IInvoiceDropdown[]) {
    for (let i = 0; i < items.length; i += 1) {
      let found = false;

      for (let j = 0; j < this.invoiceItems.length; j += 1) {
        if (this.invoiceItems[j].id === items[i].id) {
          found = true;
          break;
        }
      }
      if (!found) {
        this.invoiceItems.push(items[i]);
      }
    }
  }

  search(event: Event) {
    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.getInvoiceItems((event.target as HTMLInputElement).value);
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
        item: e.name || '', // Map name to item for backward compatibility
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
    const dialogRef = this.dialog.open(AddInvoiceItemComponent, {
      maxWidth: '400px',
      width: '53%'
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

  /**
   * Method to close dropdown if there any outside scrolling event
   */
  isCloseDropDown() {
    this.subscriptions.push(
      this.invoiceService.listItemScrollEvent.subscribe(() => {
        this.invoiceItemDropdowns.forEach((dropdown) => dropdown.close());
      })
    );
  }

  /**
   * Handle table body scroll event
   */
  onTableScroll(): void {
    this.tableScroll.emit();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }
}
