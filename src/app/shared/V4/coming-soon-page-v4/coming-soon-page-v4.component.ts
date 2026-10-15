import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule, Rocket, Sparkles } from 'lucide-angular';
import { CommonButtonV4Component } from '../buttons/common-button-v4/common-button-v4.component';

@Component({
  selector: 'app-coming-soon-page-v4',
  standalone: true,
  imports: [LucideAngularModule, CommonButtonV4Component],
  templateUrl: './coming-soon-page-v4.component.html',
  styleUrls: ['./coming-soon-page-v4.component.scss'],
})
export class ComingSoonPageV4Component {
  subtitle = 'This feature is under development.';

  readonly icons = {
    rocket: Rocket,
    sparkles: Sparkles,
  };

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);

  constructor() {
    this.route.data.subscribe((data) => {
      if (data['subtitle']) {
        this.subtitle = data['subtitle'];
      }
    });
  }

  goHome(): void {
    this.router.navigate(['/v4/manage/home']);
  }

  goBack(): void {
    this.location.back();
  }
}
