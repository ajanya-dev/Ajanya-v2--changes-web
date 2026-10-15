import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';

@Component({
  selector: 'app-subscription-required',
  templateUrl: './subscription-required.component.html',
  styleUrls: ['./subscription-required.component.scss'],
  standalone: true
})
export class SubscriptionRequiredComponent {
  private router = inject(Router);
  private userService = inject(UserProfileService);

  subscriptions: Subscription[] = [];

  /**
   * @description Navigates the user based on their verification status.
   */
  navigate() {
    this.subscriptions.push(
      this.userService.UserVerification$.subscribe((res) => {
        if (res.email_verified === 0 || res.phone_verified === 0) {
          this.router.navigate(['manage/users/verify-email-phone'], {
            queryParams: { returnUrl: '/manage/verification/index' }
          });
        } else {
          this.router.navigate(['/manage/subscription']);
        }
      })
    );
  }
}
