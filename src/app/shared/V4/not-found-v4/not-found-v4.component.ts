import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { CommonButtonV4Component } from '../buttons/common-button-v4/common-button-v4.component';

@Component({
  selector: 'app-not-found-v4',
  standalone: true,
  imports: [CommonButtonV4Component],
  templateUrl: './not-found-v4.component.html',
  styleUrls: ['./not-found-v4.component.scss'],
})
export class NotFoundV4Component {
  private router = inject(Router);
  private location = inject(Location);

  goHome(): void {
    this.router.navigate(['/v4/manage/home']);
  }

  goBack(): void {
    this.location.back();
  }
}
