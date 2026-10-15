import { HttpHeaders } from '@angular/common/http';
import { Component, OnDestroy, inject } from '@angular/core';
import {
  UntypedFormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialogRef,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { IOwnCompany } from 'src/app/layout/model/header';
import { IApiRes } from 'src/app/models/api';
import { CompanySwitchRepository } from 'src/app/modules/company-switch/repository/companySwitch.repository';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { NgStyle, NgIf } from '@angular/common';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';

/**
 * @description Modal component for adding a new company
 */
@Component({
  selector: 'app-company-management-list-add-modal',
  templateUrl: './company-management-list-add-modal.component.html',
  styleUrls: ['./company-management-list-add-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    MatDialogActions,
    NgStyle,
    NgIf
  ]
})
export class CompanyManagementListAddModalComponent implements OnDestroy {
  companyName = new UntypedFormControl(null, Validators.required);
  subscriptions: Subscription[] = [];
  loading = false;

  private dialogRef = inject(
    MatDialogRef<CompanyManagementListAddModalComponent>
  );
  private headerService = inject(HeaderService);
  private companySwitchRepo = inject(CompanySwitchRepository);
  private alertService = inject(AlertService);
  private router = inject(Router);

  /**
   * @description Form submition for adding a new company. Api calls for adding new company and after adding company closes the modal with company id and name
   * @returns
   */
  addNewCompanyCall() {
    if (this.companyName.invalid) {
      return;
    }

    this.loading = true;
    const headerOptions = new HttpHeaders({
      'Content-Type': 'application/json',
      isDisable422: 'true'
    });
    this.subscriptions.push(
      this.companySwitchRepo
        .addNewCompany(this.companyName.value, headerOptions)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe(
          (res) => {
            const data = res as IApiRes<IOwnCompany>;
            if (data?.success) {
              this.dialogRef.close({
                companyId: data.data.id,
                companyName: this.companyName.value
              });
              this.headerService.setHeaderValueChanged(true);
            }
          },
          (error) => {
            if (error) {
              if (error.status === 422) {
                if (error.error.errorCode !== 214) {
                  this.verifyEmailAndMobile(error.error.errorMsg);
                }
              }
              this.dialogRef.close();
            }
          }
        )
    );
  }

  /**
   * @description Method for navigating to email and phone verification page.
   * @param msg -Error message
   */
  verifyEmailAndMobile(msg: string) {
    const ref = this.alertService.warningAlert({
      content: msg,
      doneMsg: 'Verify Now',
      isCancel: true,
      cancelMsg: 'Cancel'
    });

    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.router.navigate(['/manage/users/verify-email-phone']);
      }
    });
  }

  /**
   * @description Unsubscribe all subscripition when the component destroys
   */

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
