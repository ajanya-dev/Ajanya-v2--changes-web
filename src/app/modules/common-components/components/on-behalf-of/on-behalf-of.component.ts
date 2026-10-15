import {
  Component,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter
} from '@angular/core';
import { OnBehalfOffComponent } from '../../../cloud-bank/cloud-bank-v2/modals/on-behalf-off/on-behalf-off.component';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'dexie';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { MatCheckboxChange, MatCheckbox } from '@angular/material/checkbox';
import { IOnBehalfOf } from 'src/app/data/data/cloud-bank';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgIf, NgClass, NgFor } from '@angular/common';

@Component({
  selector: 'app-on-behalf-of',
  templateUrl: './on-behalf-of.component.html',
  styleUrls: ['./on-behalf-of.component.scss'],
  standalone: true,
  imports: [MatCheckbox, NgIf, NgClass, NgSelectModule, FormsModule, NgFor]
})
export class OnBehalfOfComponent implements OnInit, OnDestroy {
  @Output() emitOnBehalfOfDetails = new EventEmitter();
  @Output() checkBoxChange = new EventEmitter();
  subscription: Subscription[] = [];
  selectedItem: string | null;
  selectedId: string | null;
  data: IOnBehalfOf[] = [];
  isBehalfOf = 0;
  isAddItem = false;

  constructor(
    private _dialog: MatDialog,
    private _alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.getDetas();
  }

  getDetas(): void {}

  /**
   * @description  Opens a modal dialog for adding an item on behalf of another entity
   */
  openModal(): void {
    this.isAddItem = true;
    const modal = this._dialog.open(OnBehalfOffComponent, {
      width: '400px'
    });
    modal.afterClosed().subscribe((res) => {
      if (res?.success) {
        this.emitOnBehalfOfDetails.emit(res?.data?.id);
        this.getDetas();
        this.selectedId = res?.data?.id;
      }
    });
  }

  /**
   * @description Opens a modal dialog for editing an item on behalf of another entity.
   */
  editOnBehalfOf(): void {
    const modal = this._dialog.open(OnBehalfOffComponent, {
      width: '400px',
      data: this.selectedItem
    });
    modal.afterClosed().subscribe((res) => {
      if (res?.success) {
        this.emitOnBehalfOfDetails.emit(res?.data?.id);
        this.selectedItem = res?.data?.id;
        this.selectedId = res?.data?.id;
        this.getDetas();
      }
    });
  }

  /**
   * @description  Prompts the user for confirmation before deleting an item on behalf of another entity.
   * If confirmed, it sends a request to delete the item.
   */
  deleteItem(): void {
    const alert = this._alertService.confirmAlert();
    alert.afterClosed().subscribe((res) => {});
  }

  /**
   * @description Handles the change event of a checkbox.
   *  @param {MatCheckboxChange} event - The change event of the checkbox.
   */
  getCheckBoxChange(event: MatCheckboxChange): void {
    if (event.checked) {
      this.isBehalfOf = 1;
      this.checkBoxChange.emit(event);
    } else {
      this.isBehalfOf = 0;
      this.selectedItem = null;
      this.checkBoxChange.emit(event);
    }
  }

  /**
   * @description Handles the change event when an item is selected on behalf of another entity.
   *  @param {string} event - The event indicating the selected item.
   */
  getChangeItem(event: string): void {
    this.emitOnBehalfOfDetails.emit(event);
    this.selectedItem = event;
    this.selectedId = event;
  }

  /**
   * @description Unsubscribes from all active subscriptions to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.subscription.forEach((e) => e.unsubscribe());
  }
}
