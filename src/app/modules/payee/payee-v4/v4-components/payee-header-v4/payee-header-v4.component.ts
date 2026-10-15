import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  OnInit,
  inject,
  signal,
  ViewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { LucideAngularModule } from 'lucide-angular';
import { finalize } from 'rxjs';
import { PayeeModalService } from 'src/app/shared/service/payee-modal/payee-modal.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { IConnectedThirdPartyData } from 'src/app/modules/integration/model/integration';
import { environment } from 'src/environments/environment';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import { ImportPayeeModalV4Component } from '../../modals/import-payee-modal-v4/import-payee-modal-v4.component';
import { PayeeV4StateService } from '../payee-v4-state.service';

@Component({
  standalone: true,
  selector: 'app-payee-header-v4',
  imports: [
    LucideAngularModule,
    CommonButtonV4Component,
    V4PageHeaderComponent
  ],
  templateUrl: './payee-header-v4.component.html',
  styleUrls: ['./payee-header-v4.component.scss']
})
export class PayeeHeaderV4Component implements OnInit {
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private payeeModalService = inject(PayeeModalService);
  private v3DataTableService = inject(V3DataTableService);
  private integrationService = inject(IntegrationService);
  private alertService = inject(V4AlertService);

  payeeV4State = inject(PayeeV4StateService);

  showImportDropdown = false;

  hubspotDetails: IConnectedThirdPartyData | null = null;
  isHubSpotImportEnabled = signal(false);
  isImportingHubSpot = signal(false);

  clioDetails: IConnectedThirdPartyData | null = null;
  isClioImportEnabled = signal(false);
  isImportingClio = signal(false);

  @ViewChild('importDropdownRef') importDropdownRef!: ElementRef;

  ngOnInit() {
    this.getHubspotDetails();
    this.getClioDetails();
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (
      this.showImportDropdown &&
      this.importDropdownRef &&
      !this.importDropdownRef.nativeElement.contains(event.target)
    ) {
      this.showImportDropdown = false;
    }
  }

  toggleImportDropdown() {
    this.showImportDropdown = !this.showImportDropdown;
  }

  openImportModal() {
    this.showImportDropdown = false;
    this.dialog.open(ImportPayeeModalV4Component, {
      width: '95%',
      maxWidth: '672px',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: {
        payeeTypeId: this.payeeV4State.payeeTypeId(),
        title: this.payeeV4State.importModalTitle()
      }
    });
  }

  openAddPayee() {
    const payeeTypeOptions = this.payeeV4State.lockPayeeType()
      ? [this.payeeV4State.payeeTypeName()]
      : ['vendor', 'employee', 'customer'];
    this.payeeModalService
      .openAddPayee(
        undefined,
        {
          payeeType: this.payeeV4State.payeeTypeId(),
          payeeTypeOptions
        },
        true
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payeeModal) => {
        if (payeeModal) {
          payeeModal
            .afterClosed()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((res) => {
              if (res?.success) {
                this.v3DataTableService.refreshV3DataTable();
              }
            });
        }
      });
  }

  getHubspotDetails() {
    if (environment.env_id === 'csnhc' || environment.env_id === 'compass')
      return;
    this.integrationService
      .getDetails('hubspot')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success) {
          this.hubspotDetails = res.data;
          this.isHubSpotImportEnabled.set(!!this.hubspotDetails?.connected);
        }
      });
  }

  importFromHubSpot() {
    this.showImportDropdown = false;
    const companyIds = this.hubspotDetails?.companies?.map((c) => c.companyId);
    this.isImportingHubSpot.set(true);
    this.integrationService
      .importHubSpotTransactions('1', companyIds)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isImportingHubSpot.set(false))
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            content: 'Successfully imported payees.'
          });
          this.v3DataTableService.refreshV3DataTable();
        }
      });
  }

  getClioDetails() {
    this.integrationService
      .getDetails('clio')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success) {
          this.clioDetails = res.data;
          this.isClioImportEnabled.set(!!this.clioDetails?.connected);
        }
      });
  }

  importFromClio() {
    this.showImportDropdown = false;
    const companyIds = this.clioDetails?.companies?.map((c) => c.companyId);
    this.isImportingClio.set(true);
    this.integrationService
      .importClioTransactions('1', companyIds)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isImportingClio.set(false))
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            content: 'Successfully imported payees.'
          });
          this.v3DataTableService.refreshV3DataTable();
        }
      });
  }
}
