import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { squareConnectedOverride } from '../../square-connection-state';

@Component({
  selector: 'app-v4-square-settings',
  standalone: true,
  templateUrl: './v4-square-settings.component.html',
  imports: [CommonModule, LucideAngularModule, CommonButtonV4Component]
})
export class V4SquareSettingsComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);

  loading = signal({ dataLoading: false, disconnecting: false });
  isConnected = signal(false);
  isImportLoading = signal({ customer: false, vendor: false, employee: false });

  ngOnInit(): void {
    this.loadSquareData();
  }

  loadSquareData(): void {
    this.loading.update((l) => ({ ...l, dataLoading: true }));

    this.integrationService
      .getSquareDetails()
      .pipe(
        finalize(() => this.loading.update((l) => ({ ...l, dataLoading: false }))),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          const connected = res.data?.connected === 1;
          this.isConnected.set(connected);
          squareConnectedOverride.set(connected);
        } else {
          this.isConnected.set(false);
          squareConnectedOverride.set(false);
        }
      });
  }

  onDisconnect(): void {
    const confirmRef = this.alertService.confirmAlert({
      content: 'Are you sure you want to disconnect your Square account?'
    });

    confirmRef.afterClosed().subscribe((result) => {
      if (!result) return;

      this.loading.update((l) => ({ ...l, disconnecting: true }));

      this.integrationService
        .disconnectSquare()
        .pipe(
          finalize(() => this.loading.update((l) => ({ ...l, disconnecting: false }))),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((res) => {
          if (res.success) {
            this.alertService.successAlert({
              content: res.message || 'Successfully disconnected Square.',
              close: true
            });
            this.isConnected.set(false);
            squareConnectedOverride.set(false);
          }
        });
    });
  }

  import(type: number): void {
    if (type === 2) {
      this.isImportLoading.update((l) => ({ ...l, customer: true }));
    } else if (type === 3) {
      this.isImportLoading.update((l) => ({ ...l, vendor: true }));
    } else {
      this.isImportLoading.update((l) => ({ ...l, employee: true }));
    }

    this.integrationService
      .importFromSquare({ type })
      .pipe(
        finalize(() =>
          this.isImportLoading.set({ customer: false, vendor: false, employee: false })
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({ close: true });
        }
      });
  }
}
