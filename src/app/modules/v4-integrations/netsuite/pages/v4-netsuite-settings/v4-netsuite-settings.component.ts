import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgOptimizedImage } from '@angular/common';
import { finalize } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { NetsuiteIntegrationService } from 'src/app/shared/service/integration/netsuite.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4NetsuiteBankMappingModalComponent } from '../../modals/v4-netsuite-bank-mapping-modal/v4-netsuite-bank-mapping-modal.component';
import { V4NetsuiteSettingsModalComponent } from '../../modals/v4-netsuite-settings-modal/v4-netsuite-settings-modal.component';

/**
 * Fresher NetSuite connection state published on disconnect so the drawer's
 * Overview tab (Connect button / Connected badge) refreshes immediately.
 * `null` means "no override — use the parent's value". Kept here (not a
 * separate file) so all NetSuite settings state lives in one place.
 */
export const netsuiteConnectedOverride = signal<boolean | null>(null);

@Component({
  selector: 'app-v4-netsuite-settings',
  templateUrl: './v4-netsuite-settings.component.html',
  styleUrls: ['./v4-netsuite-settings.component.scss'],
  standalone: true,
  imports: [
    NgOptimizedImage,
    LucideAngularModule,
    MatTooltipModule,
    CommonButtonV4Component
  ]
})
export class V4NetsuiteSettingsComponent implements OnInit {
  private netSuiteService = inject(NetsuiteIntegrationService);
  private alertService = inject(V4AlertService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  isConnected = signal<boolean>(false);
  netSuiteId = signal<string>('');
  loading = signal(false);

  ngOnInit(): void {
    this.loadConnectionStatus();
  }

  loadConnectionStatus(): void {
    this.loading.set(true);
    this.netSuiteService
      .getNetSuiteConnectionDetails()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.netSuiteId.set(res.data.id);
          const connected = res.data.connected !== 0;
          this.isConnected.set(connected);
          netsuiteConnectedOverride.set(connected);
        }
      });
  }

  onDisconnect(): void {
    const dRef = this.alertService.confirmAlert({
      content: 'Are you sure you want to disconnect?',
      doneMsg: 'Yes'
    });
    dRef.afterClosed().subscribe((res) => {
      if (res) {
        this.loading.set(true);
        this.netSuiteService
          .onDisconnectNetSuite(this.netSuiteId())
          .pipe(
            finalize(() => this.loading.set(false)),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe((response) => {
            if (response.success) {
              // The backend confirmed disconnect — reflect it locally and
              // publish the override so the panel's Overview tab flips to the
              // "Connect" state immediately (avoid a stale re-fetch race).
              this.isConnected.set(false);
              this.netSuiteId.set('');
              netsuiteConnectedOverride.set(false);
              this.alertService.successAlert({
                content: 'Successfully disconnected.'
              });
            }
          });
      }
    });
  }

  openSettings(): void {
    this.dialog.open(V4NetsuiteSettingsModalComponent, {
      maxWidth: '800px',
      width: '85%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded'
    });
  }

  onMapNow(): void {
    this.dialog.open(V4NetsuiteBankMappingModalComponent, {
      maxWidth: '900px',
      width: '95%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded'
    });
  }
}
