import { MapBankAccountModalDesktopComponent } from '../../quick-books/modals/map-bank-account-modal-desktop/map-bank-account-modal-desktop.component';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MapBankAccountModalComponent } from '../map-bank-account-modal/map-bank-account-modal.component';
import {
  IQBBankMapDuplicate,
  IQBDuplicateMapDialogData
} from 'src/app/modules/integration/model/integration';
import { NgFor, NgIf } from '@angular/common';

/**
 * Component for managing duplicated QuickBooks mappings.
 */
@Component({
  selector: 'app-qbo-duplicated-mappings-modal',
  templateUrl: './qbo-duplicated-mappings-modal.component.html',
  styleUrls: ['./qbo-duplicated-mappings-modal.component.scss'],
  standalone: true,
  imports: [MatDialogClose, NgFor, NgIf]
})
export class QBODuplicatedMappingsModalComponent implements OnInit {
  mappedBanks: IQBBankMapDuplicate[] = [];
  subscriptions: Subscription[] = [];
  loading = false;
  QBDesktop = false;
  // QBDmappedBank:

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: IQBDuplicateMapDialogData,
    private router: Router,
    private _dialogRef: MatDialogRef<QBODuplicatedMappingsModalComponent>,
    public __dialog: MatDialog,
    private _integrationService: IntegrationService
  ) {}

  /**
   * Initializes the component and sets initial values.
   */
  ngOnInit(): void {
    if (typeof this.data === 'object' && 'data' in this.data) {
      this.mappedBanks = this.data.data;
      this.QBDesktop = true;
    } else if (Array.isArray(this.data)) {
      this.mappedBanks = this.data;
    }
  }

  /**
   * Retrieves duplicate mapped banks data for QuickBooks Online.
   */
  getduplicatemapped() {
    this.loading = true;
    this.subscriptions.push(
      this._integrationService
        .getQuickBookOnlineData()
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.mappedBanks = res.data.mapping_data;
            if (this.mappedBanks.length == 0) {
              this._dialogRef.close(true);
            }
          }
        })
    );
  }

  /**
   * Retrieves mapped banks data for QuickBooks Desktop.
   */
  getMappedData() {
    this.subscriptions.push(
      this._integrationService.getQuickBookDesktopData().subscribe((res) => {
        if (res.success) {
          this.mappedBanks = res.data.mapping_data;
          if (this.mappedBanks.length == 0) {
            this._dialogRef.close(true);
          }
        }
      })
    );
  }

  /**
   * Handles the event when the "Bank Map" button is clicked.
   * Redirects to the appropriate mapping page based on the integration type.
   */
  Bankmap() {
    this._dialogRef.close('mapping');
    if (this.QBDesktop) {
      this.router.navigateByUrl(
        '/manage/thirdparty_app/quickBooks/qb_desktop/mapping'
      );
    } else {
      this.router.navigateByUrl(
        'manage/thirdparty_app/quickBooks/quickbooks_online/mapping'
      );
    }
  }

  /**
   * Opens the modal for editing a bank mapping row.
   * @param id The ID of the bank mapping.
   * @param data The bank mapping data.
   * @param i The index of the bank mapping in the list.
   */
  onEditRow(id: string, data: IQBBankMapDuplicate, i: number) {
    if (this.QBDesktop) {
      const dialogRef: MatDialogRef<
        MapBankAccountModalDesktopComponent,
        { dbId: string; mode: string; ismapping: number }
      > = this.__dialog.open(MapBankAccountModalDesktopComponent, {
        maxWidth: '500px',
        width: '93%',
        disableClose: true,
        data: { qbId: id, mode: 'edit', ismapping: 2 }
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.mappedBanks = [];
          this.getMappedData();
        }
      });
    } else {
      const dialogRef = this.__dialog.open(MapBankAccountModalComponent, {
        maxWidth: '500px',
        width: '93%',
        disableClose: true,
        data: { qbId: id, data: data, mode: 'edit', ismapping: 1, index: i }
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.mappedBanks = [];
          this.getduplicatemapped();
        }
      });
    }
  }
}
