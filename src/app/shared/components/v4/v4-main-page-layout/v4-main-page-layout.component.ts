import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { V4MainPageHeaderComponent } from 'src/app/shared/components/v4/v4-main-page-header/v4-main-page-header.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { V4MainPageApiCardComponent } from 'src/app/shared/components/v4/v4-main-page-api-card/v4-main-page-api-card.component';
import { V4MainPageCardComponent } from 'src/app/shared/components/v4/v4-main-page-component/v4-main-page-card.component';
import { V4MainPageBenefitsComponent } from 'src/app/shared/components/v4/v4-main-page-benefits/v4-main-page-benefits.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { IMainPageConfig, IFeatureCard } from './v4-main-page-data';

@Component({
  selector: 'app-v4-main-page-layout',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    V4MainPageHeaderComponent,
    V4MainPageApiCardComponent,
    V4MainPageCardComponent,
    V4MainPageBenefitsComponent,
    CommonButtonV4Component,
    FaIconComponent
  ],
  templateUrl: './v4-main-page-layout.component.html',
  styleUrls: ['./v4-main-page-layout.component.scss']
})
export class V4MainPageLayoutComponent {
  config = input.required<IMainPageConfig>();

  ctaClick = output<void>();
  cardClick = output<IFeatureCard>();
}
