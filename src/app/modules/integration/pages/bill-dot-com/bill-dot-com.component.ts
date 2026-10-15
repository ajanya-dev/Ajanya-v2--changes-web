import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { Utils } from 'src/app/data/utils';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { BillDotComConnectModalComponent } from '../../modals/bill-dot-com-connect-modal/bill-dot-com-connect-modal.component';
import { IDisconnectingState, IOrgs } from '../../model/integration';
import { CustomerSupportComponent } from '../../../../shared/components/customer-support/customer-support.component';
import { NgFor, NgStyle } from '@angular/common';
import { DemoVideoComponent } from '../../../../shared/components/demo-video/demo-video.component';
import { OcwBackButtonComponent } from '../../../../shared/components/ocw-back-button/ocw-back-button.component';

/**
 * Component for managing Bill.com integration.
 */
@Component({
  selector: 'app-bill-dot-com',
  templateUrl: './bill-dot-com.component.html',
  styleUrls: ['./bill-dot-com.component.scss'],
  standalone: true,
  imports: [
    OcwBackButtonComponent,
    DemoVideoComponent,
    NgFor,
    NgStyle,
    CustomerSupportComponent
  ]
})
export class BillDotComComponent implements OnInit, OnDestroy {
  instructions: string[] = [
    'Click on connect',
    'Authenticate with your bill.com credentials'
  ];
  utils = Utils;
  loading = {};
  orgs: IOrgs[];
  subscription: Subscription[] = [];
  disconnecting: IDisconnectingState = {};

  constructor(
    private _integrationService: IntegrationService,
    private _dialog: MatDialog,
    private _alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.getOrgs();
  }

  /**
   * Retrieves the list of organizations connected to Bill.com.
   */
  getOrgs() {
    this.subscription.push(
      this._integrationService.getBillOrgs().subscribe((data) => {
        if (data?.success) {
          this.orgs = data.data;
        }
      })
    );
  }

  /**
   * Initiates the disconnection of a Bill.com organization.
   * @param id The ID of the organization to disconnect.
   */
  disconnect(id: string) {
    const confirm = this._alertService.confirmAlert({
      content: 'Are you sure you want to disconnect?'
    });
    confirm.afterClosed().subscribe((res) => {
      if (res) {
        this.disconnecting[id] = true;
        this.subscription.push(
          this._integrationService
            .disconnectBilldotCom(id)
            .subscribe((data) => {
              if (data?.success) {
                this.disconnecting[id] = false;
                this._alertService.successAlert({ content: 'Disconnected' });
                this.getOrgs();
              }
            })
        );
      }
    });
  }

  /**
   * Opens the Bill.com connection modal for authentication.
   */
  openConnectModal() {
    const modal = this._dialog.open(BillDotComConnectModalComponent, {
      width: '450px',
      maxWidth: '95%'
    });

    modal.afterClosed().subscribe((res) => {
      if (res?.success) {
        this.getOrgs();
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription.forEach((e) => e.unsubscribe());
  }
}
