import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { V4VendorCreditsHeaderComponent } from '../v4-vendor-credits-header/v4-vendor-credits-header.component';
import { V4VendorCreditsTableComponent } from '../v4-vendor-credits-table/v4-vendor-credits-table.component';

@Component({
  selector: 'app-v4-vendor-credits-page',
  standalone: true,
  imports: [
    CommonModule,
    V4VendorCreditsHeaderComponent,
    V4VendorCreditsTableComponent
  ],
  templateUrl: './v4-vendor-credits-page.component.html',
  styleUrls: ['./v4-vendor-credits-page.component.scss']
})
export class V4VendorCreditsPageComponent {}
