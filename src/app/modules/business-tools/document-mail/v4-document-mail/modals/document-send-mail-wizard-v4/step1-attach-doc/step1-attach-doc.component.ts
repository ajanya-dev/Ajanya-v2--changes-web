import { Component, inject, output, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  selector: 'app-step1-attach-doc',
  standalone: true,
  imports: [LucideAngularModule, CommonButtonV4Component],
  templateUrl: './step1-attach-doc.component.html'
})
export class Step1AttachDocComponent {
  private alertService = inject(V4AlertService);

  fileSelected = output<File>();

  isDragging = signal(false);

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
    const file = event.dataTransfer?.files[0];
    if (file) this.handleFile(file);
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.handleFile(file);
    input.value = '';
  }

  triggerFileInput(fileInput: HTMLInputElement): void {
    fileInput.click();
  }

  private handleFile(file: File): void {
    if (file.type !== 'application/pdf') {
      this.alertService.warningAlert({ content: 'Only PDF files are supported' });
      return;
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      this.alertService.warningAlert({ content: 'File size must be less than 50MB' });
      return;
    }

    this.fileSelected.emit(file);
  }
}
