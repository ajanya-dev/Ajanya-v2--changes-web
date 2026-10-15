import { Component, input } from '@angular/core';

@Component({
  selector: 'app-v4-main-page-header',
  standalone: true,
  templateUrl: './v4-main-page-header.component.html',
  styleUrls: ['./v4-main-page-header.component.scss']
})
export class V4MainPageHeaderComponent {
  title = input.required<string>();
  subtitle = input.required<string>();
}
