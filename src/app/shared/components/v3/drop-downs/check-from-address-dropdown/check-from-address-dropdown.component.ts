import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  forwardRef,
  inject,
  input,
  signal
} from '@angular/core';
import {
  FormControl,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule
} from '@angular/forms';
import { Subject, Subscription, finalize, takeUntil } from 'rxjs';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { IV3DropDownOnReady } from 'src/app/models/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { MatDialog } from '@angular/material/dialog';
import {
  faCircleQuestion,
  faLocationDot,
  faPenToSquare,
  faPlus
} from '@fortawesome/pro-solid-svg-icons';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { AddMailAddressModalComponent } from 'src/app/modules/check/modal/mail-modals/add-mail-address-modal/add-mail-address-modal.component';
import { IMailBulkShippingAddress } from 'src/app/modules/check/model/check';
import { NgClass } from '@angular/common';

interface IModalCloseDataAddress {
  name: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  email: string;
  note: string;
}

interface IModalCloseData {
  type?: string;
  mode?: string;
  id?: string;
  result?: boolean;
  data?: IModalCloseDataAddress;
}

@Component({
  selector: 'app-check-from-address-dropdown',
  standalone: true,
  imports: [
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    MatTooltip,
    MatTooltipModule,
    NgClass
  ],
  templateUrl: './check-from-address-dropdown.component.html',
  styleUrl: './check-from-address-dropdown.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckFromAddressDropdownComponent),
      multi: true
    }
  ]
})
export class CheckFromAddressDropdownComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  private checkService = inject(CheckService);
  private changeDetectorRef = inject(ChangeDetectorRef);
  public alertService = inject(AlertService);
  public headerService = inject(HeaderService);
  private dialog = inject(MatDialog);

  @Input() id = 'check-from-address-dropdown'; // Its better to pass a unique id always for avoiding conflict.
  @Input() enableAddNew = true;
  @Input() append = 'ng-select';
  @Input() placeholder = 'Select From Address';
  @Input() customHeight: '0' | '1' | '2' | '3' | '4' = '2';
  @Input() labelIconNeeded = true;
  @Input() dropdownIconNeeded = true;
  zIndex = input<number>(998);
  @Output() ready = new EventEmitter<IV3DropDownOnReady>();
  @Output() touch = new EventEmitter();
  @Output() addressChange = new EventEmitter<IMailBulkShippingAddress>();

  /**
   * Access to the ng-select component.
   *
   * @type {NgSelectComponent}
   * @memberof CheckFromAddressDropdownComponent
   */
  @ViewChild(NgSelectComponent) ngSelectComponent: NgSelectComponent;

  shippingAddressFrom = signal<IMailBulkShippingAddress[]>([]);
  isLoading = signal(false);

  selectedAddress: FormControl<IMailBulkShippingAddress | null | undefined> =
    new FormControl();

  changesSubscription: Subscription;
  onReadyResponse: IV3DropDownOnReady = {};
  destroy$ = new Subject();

  faCircleQuestion = faCircleQuestion;
  faLocationDot = faLocationDot;
  faPenToSquare = faPenToSquare;
  faPlus = faPlus;

  ngOnInit(): void {
    this.loadShippingAddressFrom();
    this.setupValueChanges();
  }

  ngAfterViewInit(): void {
    this.onReady();
  }

  /**
   * Loads shipping address from data.
   */
  loadShippingAddressFrom(_refreshData = false): void {
    // Refresh data loading
    this.isLoading.set(true);
    this.checkService
      .getAddressFrom()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe((res) => {
        this.shippingAddressFrom.set(res.data || []);
        this.changeDetectorRef.detectChanges();
      });
  }

  /**
   * Sets up value changes subscription to emit address changes.
   */
  setupValueChanges(): void {
    this.selectedAddress.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((address) => {
        // Address change detected
        if (address) {
          this.addressChange.emit(address);
        }
      });
  }

  /**
   * Called when the component is ready. Emits a response with the setItemWithId function.
   */
  onReady() {
    this.onReadyResponse = {
      setItemWithId: this.setItemWithId
    };
    this.ready.emit(this.onReadyResponse);
  }

  /**
   * Sets an item with a specific ID in the selected address.
   * @param id - The ID of the address to set.
   */
  setItemWithId = (id: string) => {
    const item = this.shippingAddressFrom().find((ele) => ele.id === id);
    if (item) {
      this.selectedAddress.setValue(item);
      this.changeDetectorRef.detectChanges();
    }
  };

  onTouched: (event?: Event) => void = () => {};

  /**
   * Writes a value to the form control.
   * @param value - The value to write.
   */
  writeValue(value: IMailBulkShippingAddress): void {
    if (value?.id) {
      this.setItemWithId(value.id);
    } else {
      this.selectedAddress.setValue(undefined);
    }
  }

  /**
   * Registers a callback function to be invoked when the form control value changes.
   * @param fn - The callback function.
   */
  registerOnChange(
    fn: (event?: IMailBulkShippingAddress | null | undefined) => void
  ): void {
    this.changesSubscription = this.selectedAddress.valueChanges.subscribe(fn);
  }

  /**
   * Registers a callback function to be invoked when the form control is touched.
   * @param fn - The callback function.
   */
  registerOnTouched(fn: (event?: Event | undefined) => void): void {
    this.onTouched = fn;
  }

  /**
   * Opens modal dialog for adding new mail from address.
   */
  addNewAddress() {
    this.clearSelection();
    this.openAddMailAddressModal();
  }

  /**
   * Opens the add mail address modal.
   */
  openAddMailAddressModal(isEdit = false) {
    const mailFromId = this.selectedAddress.value?.id || '';
    const addMailAddress = this.dialog.open(AddMailAddressModalComponent, {
      maxWidth: '700px',
      width: '98%',
      autoFocus: false,
      disableClose: true,
      data: {
        dataKey: 'mail-from',
        isForUpdate: isEdit,
        id: mailFromId
      }
    });

    addMailAddress.afterClosed().subscribe((data) => {
      this.handleModalClose(data);
    });
  }

  /**
   * Handles modal close data with different actions based on the data received.
   * @param data - The data returned from the modal
   */
  private handleModalClose(data: IModalCloseData): void {
    if (!data) {
      return;
    }

    // Handle delete action
    if (data.type === 'delete') {
      this.handleDeleteAction();
      return;
    }

    // Handle different modal actions based on type and mode
    if (typeof data === 'object') {
      switch (data.mode) {
        case 'create':
          this.handleCreateAction(data);
          break;
        case 'update':
          this.handleUpdateAction(data);
          break;
        default:
          // Handle legacy create case (when mode is not specified)
          if (!data.mode && data.id) {
            this.handleCreateAction(data);
          }
          break;
      }
    }
  }

  /**
   * Handles the create action when a new mail address is added.
   * @param data - The data containing the new address information
   */
  private handleCreateAction(data: IModalCloseData): void {
    const item = {
      name: data.data?.name || '',
      id: data.id || '',
      country: data.data?.country || '',
      dec_id: 0
    };
    this.shippingAddressFrom.update((addresses) => [...addresses, item]);
    this.selectedAddress.setValue(item);
  }

  /**
   * Handles the update action when an existing mail address is modified.
   * @param data - The data containing the updated address information
   */
  private handleUpdateAction(data: IModalCloseData): void {
    const item = this.shippingAddressFrom().find(
      (address) => address.id === data.id
    );

    if (item && data.data) {
      // Update the item's name with the new data
      item.name = data.data.name;
      this.selectedAddress.setValue(item);
      // Update the item in the shippingAddressFrom signal
      this.shippingAddressFrom.update((addresses) =>
        addresses.map((address) =>
          address.id === data.id
            ? { ...address, name: data.data?.name || '' }
            : address
        )
      );
    }
  }

  /**
   * Handles the delete action when a mail address is removed.
   */
  private handleDeleteAction(): void {
    this.clearSelection();
    const mailFromId = this.selectedAddress.value?.id || '';
    this.shippingAddressFrom.update((addresses) =>
      addresses.filter((address) => address.id !== mailFromId)
    );
    this.selectedAddress.setValue(undefined);
  }

  /**
   * Clears the selection in the ng-select component.
   */
  clearSelection() {
    this.ngSelectComponent.handleClearClick();
    this.ngSelectComponent.close();
  }

  ngOnDestroy(): void {
    this.changesSubscription?.unsubscribe();
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
