import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../../shared/service/theme/theme.service';
import { V4CommonDropDownSelectorComponent } from '../../../shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { Iv4ngSelectConfig } from '../../../shared/V4/v4-dropdown/models/v4-common-dropdown-selector.interface';
import { CommonButtonV4Component } from '../../../shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    V4CommonDropDownSelectorComponent,
    CommonButtonV4Component
  ],
  selector: 'app-v4-theme-showcase',
  templateUrl: './v4-theme-showcase.component.html',
  styleUrls: ['./v4-theme-showcase.component.scss']
})
export class V4ThemeShowcaseComponent implements OnInit {
  isDarkMode = false;
  activeTab: 'colors' | 'components' = 'colors';

  brandColors = [
    {
      label: 'Primary Brand Color',
      cssVar: '--v4-primary-brand-color',
      bgClass: 'bg-v4-primary-brand-color',
      dark: '#004a7c',
      light: '#004a7c'
    },
    {
      label: 'Primary Brand Bold Color',
      cssVar: '--v4-primary-brand-bold-color',
      bgClass: 'bg-v4-primary-brand-bold-color',
      dark: '#c7d4ff',
      light: '#004a7c'
    },
    {
      label: 'Secondary Brand Color',
      cssVar: '--v4-secondary-brand-color',
      bgClass: 'bg-v4-secondary-brand-color',
      dark: '#00a5b2',
      light: '#00a5b2'
    },
    {
      label: 'Brand Border Color',
      cssVar: '--v4-brand-border-color',
      bgClass: 'bg-v4-brand-border-color',
      dark: '#4d63d8',
      light: '#004a7c'
    },
    {
      label: 'Brand Focus Color',
      cssVar: '--v4-brand-focus-color',
      bgClass: 'bg-v4-brand-focus-color',
      dark: '#6f86ff',
      light: '#004a7c'
    },
    {
      label: 'Accent Violet Color',
      cssVar: '--v4-accent-violet-color',
      bgClass: 'bg-v4-accent-violet-color',
      dark: '#b07fff',
      light: '#7924ff'
    }
  ];

  ctaBannerColors = [
    {
      label: 'CTA Banner Background',
      cssVar: '--v4-cta-banner-bg-color',
      bgClass: 'bg-v4-cta-banner-bg-color',
      dark: '#1b2f4a',
      light: '#004a7c'
    },
    {
      label: 'CTA Banner Circle',
      cssVar: '--v4-cta-banner-circle-color',
      bgClass: 'bg-v4-cta-banner-circle-color',
      dark: '#ffffff0f',
      light: '#ffffff1a'
    }
  ];

  textColors = [
    {
      label: 'Main Text',
      cssVar: '--v4-main-text-color',
      bgClass: 'bg-v4-main-text-color',
      dark: '#f8fafc',
      light: '#111827'
    },
    {
      label: 'Secondary Text',
      cssVar: '--v4-secondary-text-color',
      bgClass: 'bg-v4-secondary-text-color',
      dark: '#c9cfe0',
      light: '#4b5563'
    },
    {
      label: 'Tertiary Text',
      cssVar: '--v4-tertiary-text-color',
      bgClass: 'bg-v4-tertiary-text-color',
      dark: '#94a3b8',
      light: '#6b7280'
    },
    {
      label: 'Subtle Text',
      cssVar: '--v4-subtle-text-color',
      bgClass: 'bg-v4-subtle-text-color',
      dark: '#9fb0cb',
      light: '#9ca3af'
    }
  ];

  backgroundColors = [
    {
      label: 'Main Background',
      cssVar: '--v4-main-background-color',
      bgClass: 'bg-v4-main-background-color',
      dark: '#162034',
      light: '#f4f8fa'
    },
    {
      label: 'Secondary Background',
      cssVar: '--v4-secondary-background-color',
      bgClass: 'bg-v4-secondary-background-color',
      dark: '#1c293c',
      light: '#ffffff'
    },
    {
      label: 'Tertiary Background',
      cssVar: '--v4-tertiary-background-color',
      bgClass: 'bg-v4-tertiary-background-color',
      dark: '#1c293c',
      light: '#fbfbfb'
    }
  ];

  inputColors = [
    {
      label: 'Input Border',
      cssVar: '--v4-input-border-color',
      bgClass: 'bg-v4-input-border-color',
      dark: '#3a3e47',
      light: '#d0d0d0'
    },
    {
      label: 'Input Background',
      cssVar: '--v4-input-background-color',
      bgClass: 'bg-v4-input-background-color',
      dark: '#1C293C',
      light: '#F3F4F6'
    },
    {
      label: 'Border Color',
      cssVar: '--v4-border-color',
      bgClass: 'bg-v4-border-color',
      dark: '#3a3e47',
      light: '#e5e7eb'
    }
  ];

  popupColors = [
    {
      label: 'Popup Background',
      cssVar: '--v4-popup-background-color',
      bgClass: 'bg-v4-popup-background-color',
      dark: '#1c293c',
      light: '#fbfbfb'
    },
    {
      label: 'Popup Header / Footer',
      cssVar: '--v4-popup-header-footer-color',
      bgClass: 'bg-v4-popup-header-footer-color',
      dark: '#162034',
      light: '#ffffff'
    }
  ];

  badgeColors = [
    {
      label: 'Success Background',
      cssVar: '--v4-badge-success-bg-color',
      bgClass: 'bg-v4-badge-success-bg-color',
      dark: '#dbfce7',
      light: '#dbfce7'
    },
    {
      label: 'Success Text',
      cssVar: '--v4-badge-success-text-color',
      bgClass: 'bg-v4-badge-success-text-color',
      dark: '#008236',
      light: '#008236'
    },
    {
      label: 'Info Background',
      cssVar: '--v4-badge-info-bg-color',
      bgClass: 'bg-v4-badge-info-bg-color',
      dark: '#dbeafe',
      light: '#dbeafe'
    },
    {
      label: 'Info Text',
      cssVar: '--v4-badge-info-text-color',
      bgClass: 'bg-v4-badge-info-text-color',
      dark: '#004a7c',
      light: '#004a7c'
    },
    {
      label: 'Error Background',
      cssVar: '--v4-badge-error-bg-color',
      bgClass: 'bg-v4-badge-error-bg-color',
      dark: '#ffe2e2',
      light: '#ffe2e2'
    },
    {
      label: 'Error Text',
      cssVar: '--v4-badge-error-text-color',
      bgClass: 'bg-v4-badge-error-text-color',
      dark: '#eb2e2e',
      light: '#eb2e2e'
    },
    {
      label: 'Warning Background',
      cssVar: '--v4-badge-warning-bg-color',
      bgClass: 'bg-v4-badge-warning-bg-color',
      dark: '#fef9c2',
      light: '#fef9c2'
    },
    {
      label: 'Warning Text',
      cssVar: '--v4-badge-warning-text-color',
      bgClass: 'bg-v4-badge-warning-text-color',
      dark: '#f2a735',
      light: '#f2a735'
    },
    {
      label: 'Neutral Background',
      cssVar: '--v4-badge-neutral-bg-color',
      bgClass: 'bg-v4-badge-neutral-bg-color',
      dark: '#f3f4f6',
      light: '#f3f4f6'
    },
    {
      label: 'Neutral Text',
      cssVar: '--v4-badge-neutral-text-color',
      bgClass: 'bg-v4-badge-neutral-text-color',
      dark: '#364153',
      light: '#364153'
    },
    {
      label: 'Accent Background',
      cssVar: '--v4-badge-accent-bg-color',
      bgClass: 'bg-v4-badge-accent-bg-color',
      dark: '#f3e8ff',
      light: '#f3e8ff'
    },
    {
      label: 'Accent Text',
      cssVar: '--v4-badge-accent-text-color',
      bgClass: 'bg-v4-badge-accent-text-color',
      dark: '#7924ff',
      light: '#7924ff'
    },
    {
      label: 'Sky Background',
      cssVar: '--v4-badge-sky-bg-color',
      bgClass: 'bg-v4-badge-sky-bg-color',
      dark: '#e0f2fe',
      light: '#e0f2fe'
    },
    {
      label: 'Sky Text',
      cssVar: '--v4-badge-sky-text-color',
      bgClass: 'bg-v4-badge-sky-text-color',
      dark: '#0595e5',
      light: '#0595e5'
    },
    {
      label: 'Brand Navy',
      cssVar: '--v4-badge-brand-navy-color',
      bgClass: 'bg-v4-badge-brand-navy-color',
      dark: '#004a7c',
      light: '#004a7c'
    }
  ];

  commonColors = [
    {
      label: 'Sky',
      cssVar: '--v4-common-sky-color',
      bgClass: 'bg-v4-common-sky-color',
      dark: '#0595e5',
      light: '#0595e5'
    },
    {
      label: 'Green',
      cssVar: '--v4-common-green-color',
      bgClass: 'bg-v4-common-green-color',
      dark: '#099753',
      light: '#08b160'
    },
    {
      label: 'Blue',
      cssVar: '--v4-common-blue-color',
      bgClass: 'bg-v4-common-blue-color',
      dark: '#004a7c',
      light: '#004a7c'
    },
    {
      label: 'Violet',
      cssVar: '--v4-common-violet-color',
      bgClass: 'bg-v4-common-violet-color',
      dark: '#9672df',
      light: '#9672df'
    },
    {
      label: 'Red',
      cssVar: '--v4-common-red-color',
      bgClass: 'bg-v4-common-red-color',
      dark: '#eb2e2e',
      light: '#fb5f5f'
    },
    {
      label: 'Yellow',
      cssVar: '--v4-common-yellow-color',
      bgClass: 'bg-v4-common-yellow-color',
      dark: '#f2a735',
      light: '#fa9c10'
    }
  ];

  statusSurfaceColors = [
    {
      label: 'Surface Success',
      cssVar: '--v4-surface-success',
      bgClass: 'bg-v4-surface-success',
      dark: '#14532D33',
      light: '#F0FDF4'
    },
    {
      label: 'Surface Success Bold',
      cssVar: '--v4-surface-success-bold',
      bgClass: 'bg-v4-surface-success-bold',
      dark: '#14532D4D',
      light: '#DCFCE7'
    },
    {
      label: 'Border Success',
      cssVar: '--v4-border-success',
      bgClass: 'bg-v4-border-success',
      dark: '#15803D',
      light: '#86EFAC'
    },
    {
      label: 'Border Success Subtle',
      cssVar: '--v4-border-success-subtle',
      bgClass: 'bg-v4-border-success-subtle',
      dark: '#166534',
      light: '#BBF7D0'
    },
    {
      label: 'Text Success',
      cssVar: '--v4-text-success',
      bgClass: 'bg-v4-text-success',
      dark: '#4ADE80',
      light: '#15803D'
    },
    {
      label: 'Surface Warning',
      cssVar: '--v4-surface-warning',
      bgClass: 'bg-v4-surface-warning',
      dark: '#78350F33',
      light: '#FFFBEB'
    },
    {
      label: 'Surface Warning Bold',
      cssVar: '--v4-surface-warning-bold',
      bgClass: 'bg-v4-surface-warning-bold',
      dark: '#78350F4D',
      light: '#FEF3C7'
    },
    {
      label: 'Border Warning',
      cssVar: '--v4-border-warning',
      bgClass: 'bg-v4-border-warning',
      dark: '#B45309',
      light: '#FCD34D'
    },
    {
      label: 'Border Warning Subtle',
      cssVar: '--v4-border-warning-subtle',
      bgClass: 'bg-v4-border-warning-subtle',
      dark: '#92400E',
      light: '#FDE68A'
    },
    {
      label: 'Text Warning',
      cssVar: '--v4-text-warning',
      bgClass: 'bg-v4-text-warning',
      dark: '#FBBF24',
      light: '#B45309'
    }
  ];

  insightCardColors = [
    // Red (Overdue)
    {
      label: 'Background Red',
      cssVar: '--v4-insight-card-background-red',
      bgClass: 'bg-v4-insight-card-background-red',
      dark: '#162034',
      light: '#FEF2F2'
    },
    {
      label: 'Border Red',
      cssVar: '--v4-insight-card-border-red',
      bgClass: 'bg-v4-insight-card-border-red',
      dark: '#3A3E47',
      light: '#FECACA'
    },
    {
      label: 'Icon Red',
      cssVar: '--v4-insight-card-icon-red',
      bgClass: 'bg-v4-insight-card-icon-red',
      dark: '#EB2E2E',
      light: '#DC2626'
    },
    {
      label: 'Label Text Red',
      cssVar: '--v4-insight-card-label-text-red',
      bgClass: 'bg-v4-insight-card-label-text-red',
      dark: '#EB2E2E',
      light: '#7F1D1D'
    },
    {
      label: 'Main Number Red',
      cssVar: '--v4-insight-card-main-number-red',
      bgClass: 'bg-v4-insight-card-main-number-red',
      dark: '#EB2E2E',
      light: '#B91C1C'
    },
    {
      label: 'Sub Number Red',
      cssVar: '--v4-insight-card-sub-number-red',
      bgClass: 'bg-v4-insight-card-sub-number-red',
      dark: '#C9CFE0',
      light: '#DC2626'
    },
    // Orange (Due This Week)
    {
      label: 'Background Orange',
      cssVar: '--v4-insight-card-background-orange',
      bgClass: 'bg-v4-insight-card-background-orange',
      dark: '#162034',
      light: '#FFFBEB'
    },
    {
      label: 'Border Orange',
      cssVar: '--v4-insight-card-border-orange',
      bgClass: 'bg-v4-insight-card-border-orange',
      dark: '#3A3E47',
      light: '#FDE68A'
    },
    {
      label: 'Icon Orange',
      cssVar: '--v4-insight-card-icon-orange',
      bgClass: 'bg-v4-insight-card-icon-orange',
      dark: '#F2A735',
      light: '#EA580C'
    },
    {
      label: 'Label Text Orange',
      cssVar: '--v4-insight-card-label-text-orange',
      bgClass: 'bg-v4-insight-card-label-text-orange',
      dark: '#F2A735',
      light: '#7C2D12'
    },
    {
      label: 'Main Number Orange',
      cssVar: '--v4-insight-card-main-number-orange',
      bgClass: 'bg-v4-insight-card-main-number-orange',
      dark: '#F2A735',
      light: '#C2410C'
    },
    {
      label: 'Sub Number Orange',
      cssVar: '--v4-insight-card-sub-number-orange',
      bgClass: 'bg-v4-insight-card-sub-number-orange',
      dark: '#C9CFE0',
      light: '#EA580C'
    },
    // Blue (Upcoming)
    {
      label: 'Background Blue',
      cssVar: '--v4-insight-card-background-blue',
      bgClass: 'bg-v4-insight-card-background-blue',
      dark: '#162034',
      light: '#EFF6FF'
    },
    {
      label: 'Border Blue',
      cssVar: '--v4-insight-card-border-blue',
      bgClass: 'bg-v4-insight-card-border-blue',
      dark: '#3A3E47',
      light: '#BFDBFE'
    },
    {
      label: 'Icon Blue',
      cssVar: '--v4-insight-card-icon-blue',
      bgClass: 'bg-v4-insight-card-icon-blue',
      dark: '#7B93FF',
      light: '#2563EB'
    },
    {
      label: 'Label Text Blue',
      cssVar: '--v4-insight-card-label-text-blue',
      bgClass: 'bg-v4-insight-card-label-text-blue',
      dark: '#C7D4FF',
      light: '#1E3A8A'
    },
    {
      label: 'Main Number Blue',
      cssVar: '--v4-insight-card-main-number-blue',
      bgClass: 'bg-v4-insight-card-main-number-blue',
      dark: '#7B93FF',
      light: '#1D4ED8'
    },
    {
      label: 'Sub Number Blue',
      cssVar: '--v4-insight-card-sub-number-blue',
      bgClass: 'bg-v4-insight-card-sub-number-blue',
      dark: '#C9CFE0',
      light: '#2563EB'
    },
    // Purple (Duplicates)
    {
      label: 'Background Purple',
      cssVar: '--v4-insight-card-background-purple',
      bgClass: 'bg-v4-insight-card-background-purple',
      dark: '#162034',
      light: '#FAF5FF'
    },
    {
      label: 'Border Purple',
      cssVar: '--v4-insight-card-border-purple',
      bgClass: 'bg-v4-insight-card-border-purple',
      dark: '#3A3E47',
      light: '#E9D5FF'
    },
    {
      label: 'Icon Purple',
      cssVar: '--v4-insight-card-icon-purple',
      bgClass: 'bg-v4-insight-card-icon-purple',
      dark: '#B07FFF',
      light: '#9333EA'
    },
    {
      label: 'Label Text Purple',
      cssVar: '--v4-insight-card-label-text-purple',
      bgClass: 'bg-v4-insight-card-label-text-purple',
      dark: '#B07FFF',
      light: '#581C87'
    },
    {
      label: 'Main Number Purple',
      cssVar: '--v4-insight-card-main-number-purple',
      bgClass: 'bg-v4-insight-card-main-number-purple',
      dark: '#B07FFF',
      light: '#7E22CE'
    },
    {
      label: 'Sub Number Purple',
      cssVar: '--v4-insight-card-sub-number-purple',
      bgClass: 'bg-v4-insight-card-sub-number-purple',
      dark: '#C9CFE0',
      light: '#9333EA'
    },
    // Green (High Value)
    {
      label: 'Background Green',
      cssVar: '--v4-insight-card-background-green',
      bgClass: 'bg-v4-insight-card-background-green',
      dark: '#162034',
      light: '#F0FDF4'
    },
    {
      label: 'Border Green',
      cssVar: '--v4-insight-card-border-green',
      bgClass: 'bg-v4-insight-card-border-green',
      dark: '#3A3E47',
      light: '#BBF7D0'
    },
    {
      label: 'Icon Green',
      cssVar: '--v4-insight-card-icon-green',
      bgClass: 'bg-v4-insight-card-icon-green',
      dark: '#00a5b2',
      light: '#16A34A'
    },
    {
      label: 'Label Text Green',
      cssVar: '--v4-insight-card-label-text-green',
      bgClass: 'bg-v4-insight-card-label-text-green',
      dark: '#00a5b2',
      light: '#14532D'
    },
    {
      label: 'Main Number Green',
      cssVar: '--v4-insight-card-main-number-green',
      bgClass: 'bg-v4-insight-card-main-number-green',
      dark: '#00a5b2',
      light: '#15803D'
    },
    {
      label: 'Sub Number Green',
      cssVar: '--v4-insight-card-sub-number-green',
      bgClass: 'bg-v4-insight-card-sub-number-green',
      dark: '#C9CFE0',
      light: '#16A34A'
    }
  ];

  // --- Dropdown demo data ---

  dropdownBasicList = [
    'Option One',
    'Option Two',
    'Option Three',
    'Option Four'
  ];

  dropdownBasicValue: string;

  dropdownIconList = [
    {
      name: 'Alice Johnson',
      role: 'Admin',
      initials: 'AJ',
      colorBg: 'v4-common-green-color'
    },
    {
      name: 'Bob Smith',
      role: 'Editor',
      initials: 'BS',
      colorBg: 'v4-common-blue-color'
    },
    {
      name: 'Carol White',
      role: 'Viewer',
      initials: 'CW',
      colorBg: 'v4-common-violet-color'
    }
  ];

  dropdownIconValue: string;

  dropdownIconConfig: Iv4ngSelectConfig = {
    placeholder: 'Select a user',
    displayField: 'name',
    displaySubField: 'role',
    iconField: 'initials',
    iconColorField: { background: 'colorBg' },
    outputField: 'name'
  };

  dropdownFaList = [
    {
      label: 'Savings Account',
      code: 'SAV',
      colorBg: 'v4-primary-brand-color'
    },
    {
      label: 'Current Account',
      code: 'CUR',
      colorBg: 'v4-primary-brand-color'
    },
    { label: 'Fixed Deposit', code: 'FD', colorBg: 'v4-primary-brand-color' }
  ];

  dropdownFaValue: string;

  dropdownFaConfig: Iv4ngSelectConfig = {
    placeholder: 'Select account type',
    displayField: 'label',
    outputField: 'code',
    iconColorField: { background: 'colorBg' },
    commons: {
      iconData: ['fas', 'landmark']
    }
  };

  constructor(
    private themeService: ThemeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isDarkMode = this.themeService.getInitialColourTheme();
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    this.themeService.update(this.isDarkMode ? 'dark-mode' : 'light-mode');
    this.themeService.sendThemeSwitch(this.isDarkMode);
    this.cdr.detectChanges();
  }
}
