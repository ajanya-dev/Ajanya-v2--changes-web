import { Component, input, output } from '@angular/core';
import { NgClass, SlicePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

export interface ICompanyRow {
  id: string;
  companyId: string;
  companyName: string;
  companyLogoUrl?: string;
  type: 'own' | 'invited' | 'requested';
  /** invited status: 0=pending, 1=active, 3=requested */
  invitedStatus?: number;
  isActive: boolean;
  clientManagementId?: string;
  customerRef?: string | null;
}

@Component({
  selector: 'app-cm-company-card-v4',
  standalone: true,
  imports: [
    NgClass,
    SlicePipe,
    LucideAngularModule,
    MatTooltipModule,
    CommonButtonV4Component
  ],
  templateUrl: './cm-company-card-v4.component.html',
  styleUrl: './cm-company-card-v4.component.scss'
})
export class CmCompanyCardV4Component {
  company = input.required<ICompanyRow>();
  editingCompanyId = input<string | null>(null);

  edit = output<ICompanyRow>();
  delete = output<ICompanyRow>();
  switchTo = output<ICompanyRow>();
  acceptInvite = output<ICompanyRow>();
  rejectInvite = output<ICompanyRow>();
  removeAccess = output<ICompanyRow>();
  resendRequest = output<ICompanyRow>();
  onboardingLink = output<ICompanyRow>();

  get statusLabel(): string {
    const map: Record<string, string> = {
      own: 'Owner',
      invited: 'Invited',
      requested: 'Requested'
    };
    return map[this.company().type] ?? '';
  }

  get statusClasses(): string {
    const map: Record<string, string> = {
      own: 'bg-v4-badge-success-bg-color text-v4-badge-success-text-color',
      invited: 'bg-v4-badge-info-bg-color text-v4-badge-info-text-color',
      requested: 'bg-v4-badge-warning-bg-color text-v4-badge-warning-text-color'
    };
    return map[this.company().type] ?? '';
  }
}
