import { CommonModule } from '@angular/common';
import { Component, inject, Inject, Input, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBriefcase } from '@fortawesome/pro-regular-svg-icons';
import { NgSelectModule } from '@ng-select/ng-select';
import { finalize, Subscription } from 'rxjs';
import { IBusinessDetails } from 'src/app/models/bank';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CommonVerificationService } from 'src/app/shared/service/common/common-verification.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';

@Component({
  selector: 'app-business-list-modal',
  standalone: true,
  imports: [
    FontAwesomeModule,
    CommonButtonV35Component,
    NgSelectModule,
    FormsModule,
    CommonModule
  ],
  templateUrl: './business-list-modal.component.html',
  styleUrl: './business-list-modal.component.scss'
})
export class BusinessListModalComponent implements OnDestroy {
  businessData: IBusinessDetails[] = [];
  subscription: Subscription[] = [];

  private commonVerificationService = inject(CommonVerificationService);
  private dialogRef = inject(MatDialogRef<BusinessListModalComponent>);
  private alertService = inject(AlertService);
  loading = false;
  isRejected = false;
  faBriefcase = faBriefcase;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { business: IBusinessDetails[]; bankId: string }
  ) {
    this.businessData = data.business;
  }

  @Input() dropdownPosition = 'bottom';
  @Input() placeholder = 'Select Your Business';

  selectedItem: string;
  selectedId: string;
  isSelected = false;

  getChange(item: IBusinessDetails): void {
    this.selectedItem = item?.businessName;
    this.selectedId = item.id;
    if (item.status === 3) {
      this.isRejected = true;
    }
  }

  clickEvent(): void {
    this.isSelected = true;
    if (!this.selectedItem || this.selectedItem === '') {
      return;
    }

    if (this.isRejected) {
      this.alertService.infoAlert({
        content: 'The selected business has been rejected.'
      });
      return;
    }

    this.loading = true;
    this.subscription.push(
      this.commonVerificationService
        .bankAchApplication({
          businessId: this.selectedId,
          bankAccountId: this.data.bankId
        })
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe({
          next: (res) => {
            this.alertService.successAlert({
              content: 'Business Added Succes'
            });
            this.dialogRef.close(res);
          }
        })
    );
  }

  close(): void {
    this.dialogRef.close(false);
  }

  ngOnDestroy(): void {
    this.subscription.forEach((el) => {
      el.unsubscribe();
    });
  }
}
