import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { WhatsNewService } from 'src/app/shared/service/whats-new/whats-new.service';
import { environment } from 'src/environments/environment';
import { SignupPolicyComponent } from '../../../company-switch/shared/components/signup-policy/signup-policy.component';

@Component({
  selector: 'app-signup-policy-page',
  templateUrl: './signup-policy-page.component.html',
  styleUrls: ['./signup-policy-page.component.scss'],
  standalone: true,
  imports: [SignupPolicyComponent]
})
export class SignupPolicyPageComponent {
  router = inject(Router);
  private whatsNewService = inject(WhatsNewService);
  private env = environment;

  navigateToOnboarding() {
    if (this.env.env_id === 'compass') {
      this.router.navigate(['/manage/verification/index']);
      return;
    }
    this.whatsNewService.routeUserBasedOnVideoFlag(
      'manage/onboarding/step1',
      ''
    );
    this.whatsNewService.isOnboarding = true;
  }
}
