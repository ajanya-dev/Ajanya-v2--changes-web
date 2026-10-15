import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  CircleCheck,
  LucideIconData
} from 'lucide-angular';

export interface IV4Benefit {
  icon?: LucideIconData;
  title: string;
  description: string;
}

@Component({
  selector: 'app-v4-main-page-benefits',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './v4-main-page-benefits.component.html',
  styleUrls: ['./v4-main-page-benefits.component.scss']
})
export class V4MainPageBenefitsComponent {
  heading = input.required<string>();
  benefits = input.required<IV4Benefit[]>();

  readonly defaultIcon = CircleCheck;
}
