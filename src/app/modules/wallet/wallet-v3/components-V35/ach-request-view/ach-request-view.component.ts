import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { WalletDataV35Service } from '../../services/wallet-data-v35.service';

@Component({
  selector: 'app-ach-request-view',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './ach-request-view.component.html',
  styleUrl: './ach-request-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AchRequestViewComponent implements OnInit, OnDestroy {
  public walletService = inject(WalletDataV35Service);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);

  reqId: string;
  subscription: Subscription[] = [];

  ngOnInit(): void {
    this.getRequestId();
  }

  /**
   * @description Get transfer id from url.
   */
  getRequestId() {
    this.subscription.push(
      this.activatedRoute.paramMap.subscribe((params) => {
        this.reqId = params.get('id') as string;
        this.walletService.getWalletAchRequests(this.reqId);
      })
    );
  }

  /** navigating to back or  ACH Transfer Requests table page */
  goBack(): void {
    this.router.navigateByUrl('/manage/wallet/manual-ach/request');
  }

  ngOnDestroy(): void {
    this.subscription.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
