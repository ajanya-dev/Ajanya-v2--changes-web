import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  inject
} from '@angular/core';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { IOnBehalfOf } from 'src/app/data/data/cloud-bank';
import { OnBehalfOffComponent } from 'src/app/modules/cloud-bank/cloud-bank-v2/modals/on-behalf-off/on-behalf-off.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgIf, NgFor } from '@angular/common';

/**
 * @description this component is used to manage onbehalf of form field
 */
@Component({
  selector: 'app-on-behalf-of-v3',
  templateUrl: './on-behalf-of-v3.component.html',
  styleUrls: ['./on-behalf-of-v3.component.scss'],
  standalone: true,
  imports: [
    MatCheckbox,
    NgIf,
    NgSelectModule,
    FormsModule,
    NgFor,
    FaIconComponent
  ]
})
export class OnBehalfOfV3Component implements OnInit, OnDestroy {
  /* Injecting dependencies using inject method */
  private _dialog = inject(MatDialog);
  private _alertService = inject(AlertService);

  /* Variables */
  @ViewChild('checkBoxElem') checkBoxElem: MatCheckbox;

  @Output() emitOnBehalfOfDetails = new EventEmitter();
  @Output() checkBoxChange = new EventEmitter();
  subscription: Subscription[] = [];
  selectedItem: string | undefined;
  selectedId: string | undefined;
  data: IOnBehalfOf[] = [];
  isBehalfOf = 0;
  isAddItem = false;
  empty: undefined;

  ngOnInit(): void {
    this.getDetas();
  }

  /**
   * @description Retrieves the details using the _cloudBankService.
   */
  getDetas(): void {}

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
   * @description Opens the "OnBehalfOffComponen" modal for editing on behalf of details
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
   * @description Deletes the selected item from the on behalf of the list
   */
  deleteItem(): void {
    const alert = this._alertService.confirmAlert();
    alert.afterClosed().subscribe((res) => {});
  }

  getCheckBoxChange(event: { checked: boolean }): void {
    if (event.checked) {
      this.isBehalfOf = 1;
      this.checkBoxChange.emit(event);
    } else {
      this.isBehalfOf = 0;
      this.checkBoxChange.emit(event);
      this.selectedItem = undefined;
    }
  }

  toggleCheckBox(checkBox: HTMLInputElement) {
    checkBox.checked = !checkBox.checked;
    this.getCheckBoxChange({ checked: checkBox.checked });
  }

  selectOnBehalf(): void {
    this.isBehalfOf = 1;
  }

  getChangeItem(event: string): void {
    this.emitOnBehalfOfDetails.emit(event);
    this.selectedItem = event;
    this.selectedId = event;
  }

  ngOnDestroy(): void {
    this.subscription.forEach((e) => e.unsubscribe());
  }
}
