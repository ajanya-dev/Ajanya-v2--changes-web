import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faUsers } from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { ISlackEmployee } from '../../../model/integration';

export interface ISlackPagination {
  currentPage: number;
  perPage: number;
  totalPages: number;
  totalEmployees: number;
}

@Component({
  selector: 'app-slack-employees-table',
  standalone: true,
  imports: [CommonModule, MatTooltipModule, CommonButtonV35Component, FaIconComponent],
  templateUrl: './slack-employees-table.component.html',
  styleUrl: './slack-employees-table.component.scss'
})
export class SlackEmployeesTableComponent {
  @Input() employees: ISlackEmployee[] = [];
  @Input() pagination: ISlackPagination = {
    currentPage: 1,
    perPage: 10,
    totalPages: 1,
    totalEmployees: 0
  };

  @Input() loading = {
    employeesLoading: false,
    syncingEmployees: false,
    issuingCheck: undefined as string | undefined
  };
  
  @Input() workspaceName = '';

  @Output() syncEmployees = new EventEmitter<void>();
  @Output() issueCheck = new EventEmitter<ISlackEmployee>();
  @Output() nextPage = new EventEmitter<void>();
  @Output() prevPage = new EventEmitter<void>();

  faUsers = faUsers;

  onSyncEmployees(): void {
    this.syncEmployees.emit();
  }

  onIssueCheck(employee: ISlackEmployee): void {
    this.issueCheck.emit(employee);
  }

  onNextPage(): void {
    this.nextPage.emit();
  }

  onPrevPage(): void {
    this.prevPage.emit();
  }

  getDisplayName(employee: ISlackEmployee): string {
    return employee.display_name || employee.full_name || '';
  }

  getEmail(employee: ISlackEmployee): string {
    return employee.email || '';
  }

  getUserRole(employee: ISlackEmployee): string {
    if (employee.is_owner) return 'Owner';
    if (employee.is_admin) return 'Admin';
    return 'Member';
  }
}