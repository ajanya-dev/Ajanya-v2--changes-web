import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  OnDestroy,
  ViewChild,
  inject
} from '@angular/core';
import { CommonVerificationService } from 'src/app/shared/service/common/common-verification.service';
import {
  CVSourceType,
  IUserBusiness
} from 'src/app/modules/common-verification/model/common-verification';
import { Subscription } from 'rxjs';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { IUserVerification } from 'src/app/models/user';
import { AuthDataService } from 'src/app/shared/service/auth/auth-data.service';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';

/**
 * @description Drop down component for business.
 */
@Component({
  standalone: true,
  imports: [NgSelectModule, FormsModule, CommonModule, FontAwesomeModule],
  selector: 'app-drop-down-business',
  templateUrl: './drop-down-business.component.html',
  styleUrls: ['./drop-down-business.component.scss']
})
export class DropDownBusinessComponent implements OnInit, OnDestroy {
  private commonVerificationService = inject(CommonVerificationService);
  private userProfileService = inject(UserProfileService);
  private router = inject(Router);
  private authDataService = inject(AuthDataService);
  private gettingStartedService = inject(GettingStartedService);
  private personaHelperService = inject(PersonaHelperService);

  @ViewChild(NgSelectComponent) ngSelectComponent: NgSelectComponent;

  @Input() placeholder = 'Select Business';
  @Input() dropdownPosition = 'bottom';
  @Input() selectedId = '';
  @Input() returnUrl = 'manage/more/report';
  @Input() id: string;
  @Output() selectionEvent = new EventEmitter();

  page = 1;
  selectedItem: IUserBusiness | string;
  subscriptions: Subscription[] = [];
  kybBusinessData: IUserBusiness[] = [];
  userStatus: IUserVerification;

  ngOnInit(): void {
    this.getBusinessDetails();
    this.verifyEmailAndPhone();
    if (this.selectedId !== '') {
      this.selectedItem = this.selectedId;
    }
  }

  /**
   * @description Gets business list and sets it to `this.kybBusinessData`.
   */
  getBusinessDetails(): void {
    this.subscriptions.push(
      this.commonVerificationService
        .getUserBusinessesList(this.page)
        .subscribe((res) => {
          this.kybBusinessData = res.data;
        })
    );
  }

  /**
   * @description Gets next 10 element on each scroll event
   */
  onScrollToEnd() {
    this.subscriptions.push(
      this.commonVerificationService
        .getUserBusinessesList(this.page + 1)
        .subscribe((res) => {
          this.page += 1;
          const obj = res.data;
          (Object.keys(obj) as (keyof typeof obj)[]).forEach((key) => {
            const index = key as number;
            this.kybBusinessData.push(obj[index]);
          });
        })
    );
  }

  /**
   * @description Emits `selectionEvent` when selection is made. Sets selected business data to `this.selectedItem`.
   * @param event - selection event in template.
   */
  getChange(event: Event): void {
    if (!event.target) {
      const businessData = event as unknown as IUserBusiness;
      this.selectionEvent.emit(businessData);
      this.selectedItem = businessData;
    }
  }

  addNewBusiness() {
    this.clearSelection();
    if (
      this.userStatus?.email_verified === 0 ||
      this.userStatus?.phone_verified === 0
    ) {
      this.authDataService.verifyEmailAndMobile(
        this.authDataService.getVerificationMessage(this.userStatus)
      );
    } else if (environment.isV4Persona) {
      const isKycVerifed =
        this.gettingStartedService.gettingStartedData.isKycStatusDone;
      if (!isKycVerifed) {
        this.personaHelperService.openModal('kyc', CVSourceType['form-1099']);
      } else {
        this.personaHelperService.openModal('kyb', CVSourceType['form-1099']);
      }
    } else {
      this.router.navigate(['/manage/users/verify-user-id'], {
        queryParams: {
          type: CVSourceType['form-1099'],
          returnUrl: this.returnUrl
        }
      });
    }
    this.selectionEvent.emit('add-new');
  }

  clearSelection() {
    this.ngSelectComponent.handleClearClick();
    this.ngSelectComponent.close();
  }

  /**
   * @description Get email and phone verification details.
   */
  verifyEmailAndPhone() {
    this.subscriptions.push(
      this.userProfileService.UserVerification$.subscribe((res) => {
        this.userStatus = res;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => {
      el?.unsubscribe();
    });
  }
}
