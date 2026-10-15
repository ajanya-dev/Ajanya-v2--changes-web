import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { ClickTrackingService } from 'src/app/shared/service/click-tracking/click-tracking.service';

@Component({
  selector: 'app-virtual-card-landing-page',
  standalone: true,
  imports: [],
  templateUrl: './virtual-card-landing-page.component.html',
  styleUrl: './virtual-card-landing-page.component.scss'
})
export class VirtualCardLandingPageComponent {

  private clickTrackingService = inject(ClickTrackingService);
  private router = inject(Router);


  joinDemo(): void {
    // Track when clicked on book a demo.
    this.clickTrackingService.trackBookDemoClick()?.pipe(take(1)).subscribe();
    let path: string = '';

    // Get the current origin from the window object
    let { origin } = window;

    // Remove the protocol (https://) from the origin
    origin = origin.replace('https://', '');

    path = this.router.url;

    // Remove the leading slash from the path if it exists
    if (path.startsWith('/')) {
      path = path.substring(1);
    }

    // Construct the Calendly URL with UTM parameters and open it in a new window
    window.open(
      `https://calendly.com/zmn/demo?utm_source=${origin}&utm_campaign=${path}`
    );
  }

}
