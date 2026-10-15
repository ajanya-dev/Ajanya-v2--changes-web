import { NgClass } from '@angular/common';
import { Component, inject, Input, OnChanges, OnInit } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faBuilding,
  faCircleXmark,
  faPlus
} from '@fortawesome/pro-regular-svg-icons';
import { faCircleCheck, faClock } from '@fortawesome/pro-solid-svg-icons';
import { finalize, Subscription } from 'rxjs';
import { IBusinessDetails } from 'src/app/models/bank';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { CommonVerificationService } from 'src/app/shared/service/common/common-verification.service';
import { IGettingStartedAPI } from 'src/app/models/getting-started';
import { Router } from '@angular/router';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { CommonTablePaginationComponent } from '../common-table-pagination/common-table-pagination.component';

@Component({
  selector: 'app-verification-center-businesses',
  standalone: true,
  imports: [FontAwesomeModule, NgClass, CommonTablePaginationComponent],
  templateUrl: './verification-center-businesses-new.component.html',
  styleUrl: './verification-center-businesses.component.scss'
})
export class VerificationCenterBusinessesComponent
  implements OnInit, OnChanges
{
  @Input() verifications: IGettingStartedAPI;
  private localStorageService = inject(LocalStorageService);
  private verificationService = inject(CommonVerificationService);

  subscriptions: Subscription[] = [];
  private personaHelperService = inject(PersonaHelperService);
  private router = inject(Router);

  isLoadingContent = true;
  businessDetails: IBusinessDetails[] = [];
  paginatedBusiness: IBusinessDetails[] = [];
  faCheck = faCircleCheck;
  faClock = faClock;
  faPlus = faPlus;
  faBuilding = faBuilding;
  faCircleXmark = faCircleXmark;
  page = 1;
  perPage = 5;
  verificationDone = false;
  startIndex = 0;
  lastIndex = this.perPage;

  ngOnInit(): void {
    this.getBusinessDetails();
  }

  ngOnChanges(): void {
    if (
      this.verifications?.verification &&
      this.verifications?.kycStatus !== null &&
      this.verifications?.kycStatus !== null
    ) {
      this.verificationDone = true;
    } else {
      this.verificationDone = false;
    }
  }

  /**
   * @description Fetches details of solid and other businesses.
   */
  getBusinessDetails(): void {
    this.isLoadingContent = true;
    this.subscriptions.push(
      this.verificationService
        .getUserBusinesses()
        .pipe(
          finalize(() => {
            this.isLoadingContent = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.businessDetails = res.data as IBusinessDetails[];
            this.paginate();
          }
        })
    );
  }

  addNewBusiness(): void {
    if (!this.verificationDone) {
      this.localStorageService.setItem('verificationStep', 'payment');
      this.router.navigateByUrl('manage/verification/steps');
      return;
    }
    this.handleBusinessVerification();
  }

  /**
   * Handles the business verification step.
   */
  handleBusinessVerification(): void {
    this.personaHelperService
      .openModal('kyb', CVSourceType.add_new_business)
      .subscribe((res) => {
        if (res?.data?.inquiry_type === 'kyb') {
          this.getBusinessDetails();
        }
      });
  }

  onClickEvent(clcikType: 'prev' | 'next'): void {
    if (clcikType === 'next') {
      this.page += 1;
      this.startIndex += 5;
      this.lastIndex += 5;
    } else {
      this.page -= 1;
      this.startIndex -= 5;
      this.lastIndex -= 5;
    }
    this.isLoadingContent = true;
    setTimeout(() => {
      this.paginate();
    }, 1000);
  }

  paginate(): void {
    this.isLoadingContent = false;
    this.paginatedBusiness = [];
    this.paginatedBusiness = this.businessDetails.slice(
      this.startIndex,
      this.lastIndex
    );
  }
}
