import { Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { SubscriptionService } from 'src/app/shared/service/subscription/subscription.service';
import { NgClass, NgIf } from '@angular/common';
import { OcwBackButtonComponent } from '../../../../shared/components/ocw-back-button/ocw-back-button.component';

@Component({
  selector: 'app-update-card',
  templateUrl: './update-card.component.html',
  styleUrls: ['./update-card.component.scss'],
  standalone: true,
  imports: [OcwBackButtonComponent, NgClass, NgIf]
})
export class UpdateCardComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];

  cardLink: any;
  loading = false;

  constructor(
    private _subscriptionService: SubscriptionService,
    private _sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.updateCardLink();
  }

  updateCardLink(): void {
    const body = {
      successPageUrl: `${window.location.origin}/manage/refill-credit`
    };

    this.loading = true;
    this.subscriptions.push(
      this._subscriptionService
        .updateCard(body)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe((res) => {
          if (res?.success) {
            this.cardLink = this._sanitizer.bypassSecurityTrustResourceUrl(
              res?.data?.url
            );
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((e) => e.unsubscribe());
  }
}
