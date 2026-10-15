import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { PlexeService } from '../../../../../shared/service/plexe/plexe.service';
import {
  ActivatedRoute,
  Router,
  RouterLinkActive,
  RouterLink
} from '@angular/router';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { PlexeAddDocumentComponent } from '../../components/plexe-add-document/plexe-add-document.component';
import { PlexeAgreementComponent } from '../../components/plexe-agreement/plexe-agreement.component';
import { PlexePrimaryBankaccountComponent } from '../../components/plexe-primary-bankaccount/plexe-primary-bankaccount.component';
import { PlexeDocumentFormComponent } from '../../components/plexe-document-form/plexe-document-form.component';
import { NgFor, NgClass, NgIf } from '@angular/common';

@Component({
  selector: 'app-loan-application-setup',
  templateUrl: './loan-application-setup.component.html',
  styleUrls: ['./loan-application-setup.component.scss'],
  standalone: true,
  imports: [
    NgFor,
    NgClass,
    NgIf,
    PlexeDocumentFormComponent,
    PlexePrimaryBankaccountComponent,
    PlexeAgreementComponent,
    PlexeAddDocumentComponent,
    RouterLinkActive,
    RouterLink
  ]
})
export class LoanApplicationSetupComponent implements OnInit, OnDestroy {
  steps = [
    { stepNo: 1, name: 'Identification' },
    { stepNo: 2, name: 'Primary Bank A/C' },
    { stepNo: 3, name: 'Agreement' },
    { stepNo: 4, name: 'Documents' },
    { stepNo: 5, name: 'Done' }
  ];
  currentStep = 0;

  applicationStatus: number;
  onBoardingId: string;
  subscription: Subscription[] = [];
  step: number;
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private _plexeService: PlexeService,
    private _router: Router
  ) {}

  ngOnInit(): void {
    this.getUserApplications();
    this.getRouterData();
  }

  /**
   * @description Get route and get id from it.
   *
   */
  getRouterData(): void {
    const routerData = this.route.snapshot.queryParams;
    this.onBoardingId = routerData.id;
  }

  /**
   * @description set steps and current step.
   *
   */
  getCurrentPage(step: number): void {
    if (step === 6) {
      this.currentStep = 0;
    } else if (step === 7) {
      this.currentStep = 1;
    } else if (step === 8) {
      this.currentStep = 2;
    } else if (step === 9) {
      this.currentStep = 3;
    } else {
      this.currentStep = 4;
    }
  }

  /**
   * @description clicking to next step.
   *
   */
  nextSlide(): void {
    this.getUserApplications();
  }

  /**
   * @description Get user application data.
   *
   */
  getUserApplications(): void {
    this.isLoading = true;
    this.subscription.push(
      this._plexeService
        .getUserApplications()
        .pipe(
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.applicationStatus = res?.data[0]?.application_status;
            this.step = this.applicationStatus;
            this.getCurrentPage(this.step);
            if (this.applicationStatus === 11) {
              this._router.navigate(['manage/working-capital/dashboard/']);
            }
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscription.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
