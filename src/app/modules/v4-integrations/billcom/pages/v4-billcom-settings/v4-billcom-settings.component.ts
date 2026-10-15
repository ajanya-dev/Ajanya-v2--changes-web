import {
  Component,
  DestroyRef,
  OnInit,
  effect,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { MatDialog } from '@angular/material/dialog';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { IBillOrg } from 'src/app/modules/integration/model/integration';
import { V4BillcomConnectModalComponent } from '../../modals/v4-billcom-connect-modal/v4-billcom-connect-modal.component';
import {
  billcomConnectModalTrigger,
  billcomConnectedOverride
} from '../../billcom-connection-state';

@Component({
  selector: 'app-v4-billcom-settings',
  standalone: true,
  templateUrl: './v4-billcom-settings.component.html',
  styleUrls: ['./v4-billcom-settings.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    CommonButtonV4Component
  ]
})
export class V4BillcomSettingsComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);

  loading = signal({
    orgsLoading: false,
    disconnectingId: null as string | null
  });

  isConnected = signal(false);
  orgs = signal<IBillOrg[]>([]);
  searchTerm = signal('');

  constructor() {
    // React to "open connect modal" requests from the integration panel
    // (Overview tab "Connect Bill.com" button).
    let lastTrigger = billcomConnectModalTrigger();
    effect(() => {
      const current = billcomConnectModalTrigger();
      if (current !== lastTrigger) {
        lastTrigger = current;
        this.onAddConnection();
      }
    });

    // Mirror local connection state up so the Overview tab can hide its
    // Connect button without waiting for the parent to refresh.
    effect(() => {
      billcomConnectedOverride.set(this.isConnected());
    });

    this.destroyRef.onDestroy(() => billcomConnectedOverride.set(null));
  }

  ngOnInit(): void {
    this.loadOrgs();
  }

  loadOrgs(): void {
    this.loading.update((l) => ({ ...l, orgsLoading: true }));

    this.integrationService
      .getBillOrgs()
      .pipe(
        finalize(() =>
          this.loading.update((l) => ({ ...l, orgsLoading: false }))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          const list = res.data ?? [];
          this.orgs.set(list);
          this.isConnected.set(list.length > 0);
        } else {
          this.orgs.set([]);
          this.isConnected.set(false);
        }
      });
  }

  filteredOrgs(): IBillOrg[] {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.orgs();
    return this.orgs().filter((o) => o.orgName?.toLowerCase().includes(term));
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
  }

  onAddConnection(): void {
    const ref = this.dialog.open(V4BillcomConnectModalComponent, {
      width: '480px',
      maxWidth: '95%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded'
    });

    ref.afterClosed().subscribe((result) => {
      if (result?.success) {
        this.loadOrgs();
      }
    });
  }

  onDisconnect(org: IBillOrg): void {
    const confirmRef = this.alertService.confirmAlert({
      content: `Are you sure you want to disconnect ${org.orgName}?`
    });

    confirmRef.afterClosed().subscribe((result) => {
      if (!result) return;

      this.loading.update((l) => ({ ...l, disconnectingId: org.id }));

      this.integrationService
        .disconnectBilldotCom(org.id)
        .pipe(
          finalize(() =>
            this.loading.update((l) => ({ ...l, disconnectingId: null }))
          ),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((res) => {
          if (res?.success) {
            this.alertService.successAlert({
              content: 'Disconnected',
              close: true
            });
            this.loadOrgs();
          }
        });
    });
  }
}
