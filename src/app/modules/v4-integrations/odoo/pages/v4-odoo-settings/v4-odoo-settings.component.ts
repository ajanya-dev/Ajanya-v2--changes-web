import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgOptimizedImage } from '@angular/common';
import { finalize } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { LucideAngularModule } from 'lucide-angular';
import { OdooService } from 'src/app/modules/integration/odoo/service/odoo.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4OdooBankMappingModalComponent } from '../../modals/v4-odoo-bank-mapping-modal/v4-odoo-bank-mapping-modal.component';
import { odooConnectedOverride } from '../../odoo-connection-state';

@Component({
  selector: 'app-v4-odoo-settings',
  templateUrl: './v4-odoo-settings.component.html',
  styleUrls: ['./v4-odoo-settings.component.scss'],
  standalone: true,
  imports: [NgOptimizedImage, LucideAngularModule, CommonButtonV4Component]
})
export class V4OdooSettingsComponent implements OnInit {
  private odooService = inject(OdooService);
  private alertService = inject(V4AlertService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  isConnected = signal<boolean>(false);
  odooId = signal<string>('');
  loading = signal(false);

  ngOnInit(): void {
    this.loadConnectionStatus();
  }

  loadConnectionStatus(): void {
    this.loading.set(true);
    this.odooService
      .getOdooConnectionDetails()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.odooId.set(res.data.id);
          const connected = res.data.connected !== 0;
          this.isConnected.set(connected);
          odooConnectedOverride.set(connected);
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
        this.odooService
          .disconnectOdoo(this.odooId())
          .pipe(
            finalize(() => this.loading.set(false)),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe((response) => {
            if (response.success) {
              odooConnectedOverride.set(false);
              this.loadConnectionStatus();
              this.alertService.successAlert({
                content: 'Successfully disconnected.'
              });
            }
          });
      }
    });
  }

  onMapNow(): void {
    this.dialog.open(V4OdooBankMappingModalComponent, {
      maxWidth: '900px',
      width: '95%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded'
    });
  }
}
