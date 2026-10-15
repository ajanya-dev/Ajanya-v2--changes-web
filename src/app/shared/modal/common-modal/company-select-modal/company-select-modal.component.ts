import { Component } from '@angular/core';
import { MatDialogClose } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import {
  CompanySelectModalBase,
  TAvatarTone
} from '../company-select-modal.base';

/**
 * @description Modal component for selecting company.
 */
@Component({
  selector: 'app-company-select-modal',
  templateUrl: './company-select-modal.component.html',
  styleUrls: ['./company-select-modal.component.scss'],
  standalone: true,
  imports: [MatDialogClose, FormsModule]
})
export class CompanySelectModalComponent extends CompanySelectModalBase {
  readonly avatarTones: TAvatarTone[] = [
    {
      bg: 'var(--common-secondary-blue-color)',
      text: 'var(--common-blue-color)'
    },
    {
      bg: 'var(--common-secondary-yellow-color)',
      text: 'var(--common-yellow-color)'
    },
    {
      bg: 'var(--common-secondary-violet-color)',
      text: 'var(--common-violet-color)'
    },
    {
      bg: 'var(--common-secondary-green-color)',
      text: 'var(--common-green-color)'
    },
    {
      bg: 'var(--common-secondary-red-color)',
      text: 'var(--common-red-color)'
    }
  ];
}
