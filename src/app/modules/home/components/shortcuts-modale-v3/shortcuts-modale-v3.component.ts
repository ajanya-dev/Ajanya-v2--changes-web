import { v3ShortCutModaleData } from '../../../../data/data/v3-home-page-shortcuts';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { IPaymentShortCutsDetails } from 'src/app/modules/home/model/home-page-shortcuts';
import { ISubSideBarItem } from 'src/app/data/data/v3-home-page-shortcuts';
import { MatRipple } from '@angular/material/core';
import { NgFor, NgClass, NgIf } from '@angular/common';

/**
 * @description This component is used to display a shortcut modal for managing shortcuts.
 */
@Component({
  selector: 'app-shortcuts-modale-v3',
  templateUrl: './shortcuts-modale-v3.component.html',
  styleUrls: ['./shortcuts-modale-v3.component.scss'],
  standalone: true,
  imports: [MatDialogClose, NgFor, MatRipple, NgClass, MatDialogActions, NgIf]
})
export class ShortcutsModaleV3Component implements OnInit, OnDestroy {
  private dailogRef = inject(MatDialogRef);
  private _paymentService = inject(PaymentsService);
  private dialogData = inject(MAT_DIALOG_DATA);

  subscriptions: Subscription[] = [];
  fontAwesomeCheckBox = 'fa-solid fa-square-check';
  fontAwesomeSquare = 'fa-thin fa-square';
  loading = false;
  shortCutItems = v3ShortCutModaleData;

  ngOnInit(): void {
    if (this.dialogData) {
      this.shortCutItems.forEach(
        (el) =>
          (el.enabled =
            this.dialogData[
              el.id as keyof IPaymentShortCutsDetails['payment_shortcuts']
            ] ?? false)
      );
    }
  }

  selectOrUnselectItem(index: number) {
    this.shortCutItems[index].enabled = !this.shortCutItems[index].enabled;
  }

  /**
   * @description Add shortcuts to the shortcut sidebar.
   */
  add() {
    const payload: { [id: ISubSideBarItem['id']]: boolean } = {};
    this.shortCutItems.forEach((el) => {
      payload[el.id] = el.enabled;
    });

    this.loading = true;
    this.subscriptions.push(
      this._paymentService
        .patchPaymentShortCuts(payload)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.dailogRef.close({ success: true, data: payload });
            }
          },
          error: () => {
            this.dailogRef.close({ success: false });
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}
