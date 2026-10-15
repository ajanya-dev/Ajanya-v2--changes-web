import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ISalesforceContact } from '../../../model/integration';

export interface ISalesforcePagination {
  currentPage: number;
  perPage: number;
  totalPages: number;
  totalContacts: number;
}

@Component({
  selector: 'app-salesforce-contacts-table',
  standalone: true,
  imports: [CommonModule, MatTooltipModule],
  templateUrl: './salesforce-contacts-table.component.html',
  styleUrl: './salesforce-contacts-table.component.scss'
})
export class SalesforceContactsTableComponent {
  @Input() contacts: ISalesforceContact[] = [];
  @Input() pagination: ISalesforcePagination = {
    currentPage: 1,
    perPage: 10,
    totalPages: 1,
    totalContacts: 0
  };
  @Input() loading = {
    contactsLoading: false,
    syncingContacts: false,
    issuingCheck: undefined as string | undefined
  };
  @Input() accountUsername = '';

  @Output() syncContacts = new EventEmitter<void>();
  @Output() issueCheck = new EventEmitter<ISalesforceContact>();
  @Output() nextPage = new EventEmitter<void>();
  @Output() prevPage = new EventEmitter<void>();

  onSyncContacts(): void {
    this.syncContacts.emit();
  }

  onIssueCheck(contact: ISalesforceContact): void {
    this.issueCheck.emit(contact);
  }

  onNextPage(): void {
    this.nextPage.emit();
  }

  onPrevPage(): void {
    this.prevPage.emit();
  }
}
