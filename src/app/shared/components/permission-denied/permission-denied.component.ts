import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-permission-denied',
  templateUrl: './permission-denied.component.html',
  styleUrls: ['./permission-denied.component.scss'],
  standalone: true,
  imports:[NgClass]
})
export class PermissionDeniedComponent {
  actAsChildCompoent = input(false);
}
