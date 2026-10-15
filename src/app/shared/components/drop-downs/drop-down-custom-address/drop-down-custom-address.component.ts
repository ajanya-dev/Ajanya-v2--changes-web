import { CommonModule } from '@angular/common';
import { V35CommonDropDownSelectorComponent } from './../../../v3/v35-dropdown/v35-common-dropdown-selector.component';
import {
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AddMailAddressModalComponent } from 'src/app/modules/check/modal/mail-modals/add-mail-address-modal/add-mail-address-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Iv35ngSelectConfig,
  TListData
} from 'src/app/shared/v3/v35-dropdown/models/v35-common-dropdown-selector.interface';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faEdit } from '@fortawesome/pro-solid-svg-icons';
import { faPlus } from '@fortawesome/pro-regular-svg-icons';

@Component({
  selector: 'app-drop-down-custom-address',
  standalone: true,
  imports: [
    V35CommonDropDownSelectorComponent,
    CommonModule,
    FormsModule,
    FaIconComponent
  ],
  templateUrl: './drop-down-custom-address.component.html',
  styleUrl: './drop-down-custom-address.component.scss'
})
export class DropDownCustomAddressComponent implements OnInit {
  /**
   * Inject the dependencies
   */
  private dialog = inject(MatDialog);
  private checkService = inject(CheckService);
  private destroyRef = inject(DestroyRef);

  mailFromId: string;
  mailToId: string;

  isTypeMailTo: boolean = false;
  isTypeMailFrom: boolean = false;
  selectedItem: string = '';

  dropDownConfig: Iv35ngSelectConfig = {
    placeholder: 'Select Address',
    displayField: 'name',
    outputField: 'id',
    enableAddNew: true,
    style: {
      size: 2
    }
  };

  faEdit = faEdit;
  faPlus = faPlus;

  @ViewChild('dropDownCustomAddress')
  dropDownCustomAddress: V35CommonDropDownSelectorComponent;

  @Input() config: {
    dataKey: string;
    disabled: boolean;
    placeholder: string;
  };
  @Input() initialValue?: string;
  @Output() eventOptions = new EventEmitter<string>();

  listData: Array<TListData> = [];

  ngOnInit(): void {
    if (this.config.dataKey == 'mail-from') {
      this.isTypeMailFrom = true;
      this.loadShippingAddressFrom();
    } else if (this.config.dataKey == 'mail-to') {
      this.isTypeMailTo = true;
      this.loadShippingAddressTo();
    }

    if (this.config.placeholder) {
      this.dropDownConfig.placeholder = this.config.placeholder;
    }

    // Set initial value if provided
    if (this.initialValue) {
      this.selectedItem = this.initialValue;
      if (this.isTypeMailFrom) {
        this.mailFromId = this.initialValue;
      } else if (this.isTypeMailTo) {
        this.mailToId = this.initialValue;
      }
    }
  }

  openAddMailAddressModal(event: string) {
    const addMailAddress = this.dialog.open(AddMailAddressModalComponent, {
      maxWidth: '700px',
      width: '98%',
      autoFocus: false,
      disableClose: true,
      data: {
        dataKey: event,
        isForUpdate: this.isForUpdate(event),
        id: this.isTypeMailTo ? this.mailToId : this.mailFromId
      }
    });

    addMailAddress.afterClosed().subscribe((result) => {
      if (result) {
        if (result.type === 'delete') {
          this.clearSelection();
        } else if (result && result.id) {
          this.setSelection(result.id);
        }

        if (this.isTypeMailFrom) {
          this.loadShippingAddressFrom();
        } else if (this.isTypeMailTo) {
          this.loadShippingAddressTo();
        }
      }
    });
  }

  loadShippingAddressFrom(): void {
    this.checkService
      .getAddressFrom()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.listData = res.data;
      });
  }

  /**
   * Load shipping addresses to API
   */
  loadShippingAddressTo(
    toId?: string,
    mailToName?: string,
    mailToCountry?: string
  ) {
    this.checkService
      .getAddressTo()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.listData = res.data;
      });
  }

  onDropDownChange(event: string) {
    this.selectedItem = event;
    if (this.isTypeMailFrom) {
      this.mailFromId = event;
    } else if (this.isTypeMailTo) {
      this.mailToId = event;
    }
    this.eventOptions.emit(event);
  }

  isForUpdate(event: string) {
    if (this.isTypeMailFrom && this.mailFromId) {
      return true;
    } else if (this.isTypeMailTo && this.mailToId) {
      return true;
    }
    return false;
  }

  /**
   * Reset the component to initial state
   */
  reset(): void {
    this.clearSelection();
  }

  /**
   * Set a value programmatically
   */
  setValue(value: string): void {
    this.selectedItem = value;
    if (this.isTypeMailFrom) {
      this.mailFromId = value;
    } else if (this.isTypeMailTo) {
      this.mailToId = value;
    }
  }

  /**
   * Clear the current selection
   */
  private clearSelection(): void {
    this.selectedItem = '';
    this.mailFromId = '';
    this.mailToId = '';
    this.eventOptions.emit('');
    if (this.dropDownCustomAddress) {
      this.dropDownCustomAddress.clearSelection();
    }
  }

  /**
   * Set the selection to a specific value
   */
  private setSelection(id: string): void {
    this.selectedItem = id;
    if (this.isTypeMailFrom) {
      this.mailFromId = id;
    } else if (this.isTypeMailTo) {
      this.mailToId = id;
    }
    this.eventOptions.emit(id);
  }
}
