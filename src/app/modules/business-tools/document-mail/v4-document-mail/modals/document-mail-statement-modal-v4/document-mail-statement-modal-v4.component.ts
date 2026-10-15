import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { TitleCasePipe, DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { IDocumentMailStatements } from '../../../models/document-mail.model';

@Component({
  selector: 'app-document-mail-statement-modal-v4',
  standalone: true,
  imports: [MatDialogClose, TitleCasePipe, DatePipe, LucideAngularModule],
  templateUrl: './document-mail-statement-modal-v4.component.html',
  styleUrl: './document-mail-statement-modal-v4.component.scss'
})
export class DocumentMailStatementModalV4Component {
  public dialogData: {
    statements: IDocumentMailStatements[];
  } = inject(MAT_DIALOG_DATA);

  getStatusClass(statusName: string): string {
    const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';
    switch (statusName?.toLowerCase()) {
      case 'completed': return `${base} bg-v4-badge-success-bg-color text-v4-badge-success-text-color`;
      case 'pending':   return `${base} bg-v4-badge-warning-bg-color text-v4-badge-warning-text-color`;
      case 'refunded':  return `${base} bg-v4-badge-error-bg-color text-v4-common-red-color`;
      default:          return `${base} bg-v4-secondary-background-color text-v4-subtle-text-color`;
    }
  }
}
