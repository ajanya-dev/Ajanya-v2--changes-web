import { Component, inject, input } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-permission-denied-v4',
  templateUrl: './permission-denied-v4.component.html',
  styleUrls: ['./permission-denied-v4.component.scss'],
  standalone: true
})
export class PermissionDeniedV4Component {
  private router = inject(Router);
  private location = inject(Location);

  actAsChildCompoent = input(false);

  goHome(): void {
    this.router.navigate(['/v4/manage/home']);
  }

  goBack(): void {
    this.location.back();
  }
}
