import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { finalize, Subscription } from 'rxjs';
import { IOwnCompany } from 'src/app/layout/model/header';
import { CompanySwitchRepository } from 'src/app/modules/company-switch/repository/companySwitch.repository';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { DeleteModalComponent } from '../../modals/delete-modal/delete-modal.component';

/**
 * @description Component for displaying company list and asking confirmation for deletion.
 */
@Component({
  selector: 'app-permanently-delete',
  templateUrl: './permanently-delete.component.html',
  styleUrls: ['./permanently-delete.component.scss'],
  standalone: true,
  imports: [RouterLink, CommonButtonV35Component, NgOptimizedImage]
})
export class PermanentlyDeleteComponent implements OnInit, OnDestroy {
  private dialog = inject(MatDialog);
  private companySwitchRepo = inject(CompanySwitchRepository);

  subscriptions: Subscription[] = [];
  companyList: IOwnCompany[];
  isLoading = signal(false);

  ngOnInit(): void {
    this.getAllCompanies();
  }

  /**
   * @description Gets the list of all companies.
   */
  getAllCompanies() {
    this.isLoading.set(true);
    this.subscriptions.push(
      this.companySwitchRepo
        .getAllCompanies()
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe((res) => {
          this.companyList = res.data.ownCompanies;
        })
    );
  }

  /**
   * @description Opens dialog for account deletion.
   */
  deleteaccount() {
    this.dialog.open(DeleteModalComponent, {
      maxWidth: '470px',
      width: '93%',
      autoFocus: false,
      disableClose: true
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
