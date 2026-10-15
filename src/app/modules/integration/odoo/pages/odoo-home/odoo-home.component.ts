import { NgOptimizedImage } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CustomerSupportComponent } from 'src/app/shared/components/customer-support/customer-support.component';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { OdooService } from '../../service/odoo.service';
import { finalize, Subscription } from 'rxjs';
import { ConnectOdooModalComponent } from '../../modals/connect-odoo-modal/connect-odoo-modal.component';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';

@Component({
  selector: 'app-odoo-home',
  standalone: true,
  imports: [
    OcwBackButtonComponent,
    CustomerSupportComponent,
    CommonButtonV35Component,
    NgOptimizedImage,
    FontAwesomeModule,
    MatTooltipModule,
    RouterLink,
    DemoVideoComponent
  ],
  templateUrl: './odoo-home.component.html',
  styleUrl: './odoo-home.component.scss'
})
export class OdooHomeComponent {
  private odooService = inject(OdooService);
  private alertService = inject(AlertService);
  private dialog = inject(MatDialog);

  subscriptions: Subscription[] = [];

  loading = {
    globalLoading: false,
    defaultLoading: false,
    importLoading: false
  };

  instructions: string[] = [
    'Click on connect',
    'Authenticate with your Odoo credentials'
  ];

  isConnected = false;
  odooId: string;

  /**
   * Initializes the component and checks Odoo connection status.
   */
  ngOnInit(): void {
    this.onCheckOdooConnection();
  }

  /**
   * @description Checks the connection status of Netsuite.
   */
  onCheckOdooConnection(): void {
    this.loading.defaultLoading = true;
    this.subscriptions.push(
      this.odooService
        .getOdooConnectionDetails()
        .pipe(
          finalize(() => {
            this.loading.defaultLoading = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.odooId = res.data.id;
              this.isConnected = res.data.connected === 1;
            }
          },
          error: (err) => {
            this.isConnected = false;
            this.odooId = '';
          }
        })
    );
  }

  /**
   * @description Handles connecting or disconnecting from Odoo based on current connection status.
   */
  onConnectOdoo(): void {
    if (this.isConnected) {
      this.onDisConnect();
    } else {
      this.onConnect();
    }
  }

  /**
   * @description Opens the modal to connect to Odoo.
   */
  onConnect(): void {
    this.dialog
      .open(ConnectOdooModalComponent, {
        width: '400px',
        disableClose: true
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.onCheckOdooConnection();
        }
      });
  }

  /**
   * @description Handles disconnecting from Netsuite.
   */
  onDisConnect(): void {
    const dRef = this.alertService.confirmAlert({
      content: 'Are you sure you want to disconnect?',
      doneMsg: 'Yes'
    });
    dRef.afterClosed().subscribe((res) => {
      if (res) {
        this.loading.defaultLoading = true;
        this.subscriptions.push(
          this.odooService
            .disconnectOdoo(this.odooId)
            .pipe(
              finalize(() => {
                this.loading.defaultLoading = false;
              })
            )
            .subscribe((response) => {
              if (response.success) {
                this.onCheckOdooConnection();
                this.alertService.successAlert({
                  content: 'Successfully disconnected.'
                });
              }
            })
        );
      }
    });
  }

  /**
   * Cleans up resources when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
