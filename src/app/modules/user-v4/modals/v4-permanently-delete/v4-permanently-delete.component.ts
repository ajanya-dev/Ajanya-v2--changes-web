import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import {
  MatDialog,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { Subscription, finalize } from 'rxjs';
import { LucideAngularModule, X, Loader2 } from 'lucide-angular';
import { IOwnCompany } from 'src/app/layout/model/header';
import { CompanySwitchRepository } from 'src/app/modules/company-switch/repository/companySwitch.repository';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4DeleteModalComponent } from 'src/app/modules/user-v4/modals/v4-delete-modal/v4-delete-modal.component';

@Component({
  selector: 'app-v4-permanently-delete',
  standalone: true,
  imports: [LucideAngularModule, MatDialogClose, CommonButtonV4Component],
  templateUrl: './v4-permanently-delete.component.html'
})
export class V4PermanentlyDeleteComponent implements OnInit, OnDestroy {
  private companySwitchRepo = inject(CompanySwitchRepository);
  private dialog = inject(MatDialog);
  private dialogRef = inject(MatDialogRef<V4PermanentlyDeleteComponent>);

  readonly XIcon = X;
  readonly LoaderIcon = Loader2;

  subscriptions: Subscription[] = [];
  companyList: IOwnCompany[] = [];
  isLoading = signal(false);

  ngOnInit(): void {
    this.getAllCompanies();
  }

  getAllCompanies(): void {
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

  deleteAccount(): void {
    this.dialogRef.close();
    this.dialog.open(V4DeleteModalComponent, {
      maxWidth: '470px',
      width: '93%',
      autoFocus: false,
      disableClose: true,
      panelClass: 'paddingless-modal-rounded'
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
