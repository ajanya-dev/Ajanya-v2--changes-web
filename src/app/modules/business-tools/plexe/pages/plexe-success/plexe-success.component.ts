import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { PlexeService } from 'src/app/shared/service/plexe/plexe.service';
import { YodleeParentModalComponent } from 'src/app/shared/yodlee/components/yodlee-parent-modal/yodlee-parent-modal.component';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-plexe-success',
  templateUrl: './plexe-success.component.html',
  styleUrls: ['./plexe-success.component.scss'],
  standalone: true,
  imports: [NgIf, RouterLink]
})
export class PlexeSuccessComponent implements OnInit, OnDestroy {
  private dialog = inject(MatDialog);
  private route = inject(ActivatedRoute);
  private _bankAccService = inject(BankAccountsService);
  private plexeService = inject(PlexeService);
  private router = inject(Router);

  subscriptions: Subscription[] = [];
  onboardId = '';
  uploadedFile: File = {} as File;
  emptyFile: File = {} as File;
  bankAccountIds: string[] = [];
  isLoading = false;

  ngOnInit(): void {
    this.onboardId = this.route.snapshot.queryParams.id;
    this.getYodleeConnectBanks();
  }

  /**
   * @description Open Yodlee Modal to connect to new bank.
   */
  openNewConnect() {
    const data = {
      mode: 'connect_new_bank'
    };
    const dialogRef = this.dialog.open(YodleeParentModalComponent, {
      disableClose: true,
      autoFocus: false,
      data: data,
      panelClass: 'yodlee-modal-new'
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.updateBank();
      }
    });
  }

  /**
   * @description Retrieves Yodlee-connected bank accounts and populates the 'bankAccountIds' array.
   * Get Bank list from `bancAcEvents`
   */
  getYodleeConnectBanks() {
    this.subscriptions.push(
      this._bankAccService.bancAcEvents.subscribe((res) => {
        if (res.bankAcs.length > 0) {
          res.bankAcs.forEach((element: { id: string }) => {
            this.bankAccountIds.push(element.id);
          });
        }
      })
    );
  }

  /**
   * @description Updates the bank accounts for the current onboard process.
   */
  updateBank() {
    this.isLoading = true;
    const sendData: { bankAccountIds: string[] } = {
      bankAccountIds: this.bankAccountIds
    };
    this.subscriptions.push(
      this.plexeService
        .updateBankAccounts(this.onboardId, sendData)
        .pipe(finalize(() => (this.isLoading = false)))
        .subscribe((res) => {
          if (res.success) {
            this.router.navigate(['manage/working-capital/intro']);
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
