import { Component, Inject, inject, OnInit } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { subscriptionOffers } from 'src/app/data/data/subscription';
import { ISubscriptionOffers } from 'src/app/modules/subscription/model/subscription';
import { selectUserVerification } from 'src/app/modules/store/userManagement/userManagement.selectors';
import { IAppState } from 'src/app/store/app-state.model';

@Component({
  selector: 'app-trial-period-offer-modal',
  templateUrl: './trial-period-offer-modal.component.html',
  styleUrls: ['./trial-period-offer-modal.component.scss'],
  standalone: true,
  imports: [MatDialogClose]
})
export class TrialPeriodOfferModalComponent implements OnInit {
  offer: ISubscriptionOffers = subscriptionOffers;
  currentOffer: { offerPerc: number; value: number };
  emailVerified: number;
  phoneVerified: number;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { remainingDays: number },
    private router: Router,
    private matDialogRef: MatDialogRef<TrialPeriodOfferModalComponent>
  ) {}
  private store = inject(Store<IAppState>);

  ngOnInit(): void {
    this.currentOffer = this.offer[this.data.remainingDays];
    this.store.select(selectUserVerification).subscribe((res) => {
      this.emailVerified = res?.email_verified ?? 0;
      this.phoneVerified = res?.phone_verified ?? 0;
    });
  }

  grabDeal() {
    this.router.navigate(['manage/subscription/plan'], {
      state: { isFromTrial: this.currentOffer.value }
    });
      this.matDialogRef.close();
  }
}
