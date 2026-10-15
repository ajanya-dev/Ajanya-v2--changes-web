import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { ThemeService } from '../../service/theme/theme.service';
import { CommonButtonV35Component } from '../../v3/buttons/common-button-v35/common-button-v35.component';

export interface MaintenanceDialogData {
  description: string;
}

@Component({
  selector: 'app-scheduled-maintenance-break',
  standalone: true,
  imports: [CommonModule, CommonButtonV35Component,NgOptimizedImage],
  templateUrl: './scheduled-maintenance-break.component.html',
  styleUrl: './scheduled-maintenance-break.component.scss'
})
export class ScheduledMaintenanceBreakComponent implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<ScheduledMaintenanceBreakComponent>);
  private themeService = inject(ThemeService);
  public data: MaintenanceDialogData = inject(MAT_DIALOG_DATA);

  private destroy$ = new Subject<void>();
  isDarkMode = false;

  ngOnInit(): void {
    this.isDarkMode = this.themeService.getInitialColourTheme();

    this.themeService.getThemeSwitch()
      .pipe(takeUntil(this.destroy$))
      .subscribe((isDark) => {
        this.isDarkMode = isDark;
      });
  }

  get maintenanceImage(): string {
    return this.isDarkMode
      ? 'assets/images/maintenance/maintenance_dark.svg'
      : 'assets/images/maintenance/maintenance_light.svg';
  }

  onClose(): void {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
