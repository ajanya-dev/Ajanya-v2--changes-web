import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { IDocumentMailStatements } from '../../models/document-mail.model';
import { TitleCasePipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-document-mail-statement-modal',
  templateUrl: './document-mail-statement-modal.component.html',
  styleUrls: ['./document-mail-statement-modal.component.scss'],
  standalone: true,
  imports: [MatDialogClose, TitleCasePipe, DatePipe]
})
export class DocumentMailStatementModalComponent {
  public dailogData: {
    statements: IDocumentMailStatements[];
  } = inject(MAT_DIALOG_DATA);
}
