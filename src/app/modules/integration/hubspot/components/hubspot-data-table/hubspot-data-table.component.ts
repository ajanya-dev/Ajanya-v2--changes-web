import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { faBuilding, faExternalLinkAlt, faSync, faUser } from '@fortawesome/pro-solid-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { IConnectedCompanyList, IHubSpotCompanies } from '../../../model/integration';

export interface IHubSpotPagination {
  currentPage: number;
  perPage: number;
  total: number;
  lastPage: number;
}
@Component({
  selector: 'app-hubspot-data-table',
  standalone: true,
  imports: [CommonModule, MatTooltipModule, FaIconComponent, CommonButtonV35Component],
  templateUrl: './hubspot-data-table.component.html',
  styleUrl: './hubspot-data-table.component.scss'
})
export class HubspotDataTableComponent {
  @Input() dataType: 'contacts' | 'companies' | 'deals' = 'contacts';
  @Input() data: IHubSpotCompanies[] = [];
  @Input() pagination: IHubSpotPagination = {
    currentPage: 1,
    perPage: 10,
    total: 0,
    lastPage: 1
  };

  @Input() loading = {
    dataLoading: false,
    syncingData: false,
    processingItem: undefined as string | undefined
  };

  @Input() companyInfos: IConnectedCompanyList | null = null;

  @Output() syncData = new EventEmitter<void>();
  @Output() nextPage = new EventEmitter<void>();
  @Output() prevPage = new EventEmitter<void>();

  // FontAwesome icons
  faSync = faSync;
  faExternalLinkAlt = faExternalLinkAlt;
  faBuilding = faBuilding;
  faUser = faUser;

  onSyncData(): void {
    this.syncData.emit();
  }

  onNextPage(): void {
    this.nextPage.emit();
  }

  onPrevPage(): void {
    this.prevPage.emit();
  }

}