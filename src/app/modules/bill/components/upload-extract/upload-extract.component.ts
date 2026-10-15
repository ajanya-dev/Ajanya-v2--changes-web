import { Component, Output, EventEmitter } from '@angular/core';
import { BillService } from 'src/app/shared/service/Bill/bill.service';
import { IUplaodExtractionResult } from '../../model/Bill';

@Component({
  selector: 'app-upload-extract',
  templateUrl: './upload-extract.component.html',
  styleUrls: ['./upload-extract.component.scss'],
  standalone: true
})
export class UploadExtractComponent {
  @Output() fileExtract = new EventEmitter<IUplaodExtractionResult>();

  file: File;

  constructor(private billService: BillService) {}

  uploadEvent(files: File[]): void {
    if (files) {
      this.file = files[0];
    }
  }

  choose() {
    document.getElementById('file_select')?.click();
  }

  extractInvoiceImage() {
    if (!this.file) {
      return;
    }
    const body = new FormData();
    body.append('document', this.file);
    this.billService.extractInvoice(body).subscribe((data) => {
      if (data?.success) {
        this.fileExtract.emit(data.data);
      }
    });
  }
}
