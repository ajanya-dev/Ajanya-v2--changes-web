import {
  faArrowLeft,
  faCloudArrowUp,
  faFilePdf,
  faCircleInfo
} from '@fortawesome/pro-solid-svg-icons';
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DocumentMailService } from '../../services/document-mail.service';

@Component({
  selector: 'app-attach-doc',
  standalone: true,
  imports: [CommonModule, FaIconComponent],
  templateUrl: './attach-doc.component.html',
  styleUrl: './attach-doc.component.scss'
})
export class AttachDocComponent implements OnInit {
  private router = inject(Router);
  private alertService = inject(AlertService);
  private documentMailService = inject(DocumentMailService);

  isDragging = signal(false);
  uploading = signal(false);

  // FontAwesome icons
  faArrowLeft = faArrowLeft;
  faCloudArrowUp = faCloudArrowUp;
  faFilePdf = faFilePdf;
  faCircleInfo = faCircleInfo;

  step = 1;
  totalSteps = 3;

  ngOnInit(): void {
    // Clear any stale data from previous attempts when starting fresh
    this.documentMailService.clearTempData();
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  handleFile(file: File): void {
    if (file.type !== 'application/pdf') {
      this.alertService.warningAlert({
        content:
          'Only PDF files (.pdf) are supported. Please upload a valid PDF file.'
      });
      return;
    }

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      this.alertService.warningAlert({
        content: 'File size exceeds 50MB. Please upload a smaller file.'
      });
      return;
    }

    this.openPageSelect(file);
  }

  openPageSelect(file: File): void {
    this.documentMailService.setTempFile(file);

    this.router.navigate(['/manage/business-tools/document-mail/page-select']);
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onBack(): void {
    this.router.navigate(['/manage/business-tools/document-mail'], {state: {source: 'Mailing Dashboard'}});
  }
}
