import { Component, input, output } from '@angular/core';
import { NgClass, SlicePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import {
  CmCompanyCardV4Component,
  ICompanyRow
} from '../cm-company-card-v4/cm-company-card-v4.component';

@Component({
  selector: 'app-cm-company-table-v4',
  standalone: true,
  imports: [
    NgClass,
    SlicePipe,
    LucideAngularModule,
    MatTooltipModule,
    CommonButtonV4Component,
    CmCompanyCardV4Component
  ],
  templateUrl: './cm-company-table-v4.component.html',
  styleUrls: ['./cm-company-table-v4.component.scss']
})
export class CmCompanyTableV4Component {
  companies = input.required<ICompanyRow[]>();
  loading = input(false);
  searchQuery = input('');
  editingCompanyId = input<string | null>(null);

  edit = output<ICompanyRow>();
  delete = output<ICompanyRow>();
  switchTo = output<ICompanyRow>();
  acceptInvite = output<ICompanyRow>();
  rejectInvite = output<ICompanyRow>();
  removeAccess = output<ICompanyRow>();
  resendRequest = output<ICompanyRow>();
  onboardingLink = output<ICompanyRow>();

  statusLabel(type: string): string {
    const map: Record<string, string> = {
      own: 'Owner',
      invited: 'Invited',
      requested: 'Requested'
    };
    return map[type] ?? '';
  }

  statusClasses(type: string): string {
    const map: Record<string, string> = {
      own: 'bg-v4-badge-success-bg-color text-v4-badge-success-text-color',
      invited: 'bg-v4-badge-info-bg-color text-v4-badge-info-text-color',
      requested: 'bg-v4-badge-warning-bg-color text-v4-badge-warning-text-color'
    };
    return map[type] ?? '';
  }
}
