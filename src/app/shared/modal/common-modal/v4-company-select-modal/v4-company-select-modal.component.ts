import { Component } from '@angular/core';
import { MatDialogClose } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import {
  CompanySelectModalBase,
  TAvatarTone
} from '../company-select-modal.base';

@Component({
  selector: 'app-v4-company-select-modal',
  templateUrl: './v4-company-select-modal.component.html',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    CommonButtonV4Component,
    MatDialogClose
  ]
})
export class V4CompanySelectModalComponent extends CompanySelectModalBase {
  readonly avatarTones: TAvatarTone[] = [
    {
      bg: 'var(--v4-badge-info-bg-color)',
      text: 'var(--v4-badge-info-text-color)'
    },
    {
      bg: 'var(--v4-badge-warning-bg-color)',
      text: 'var(--v4-badge-warning-text-color)'
    },
    {
      bg: 'var(--v4-badge-accent-bg-color)',
      text: 'var(--v4-badge-accent-text-color)'
    },
    {
      bg: 'var(--v4-badge-success-bg-color)',
      text: 'var(--v4-badge-success-text-color)'
    },
    {
      bg: 'var(--v4-badge-sky-bg-color)',
      text: 'var(--v4-badge-sky-text-color)'
    }
  ];
}
