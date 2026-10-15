import { Component, computed, inject, signal } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { LucideAngularModule } from 'lucide-angular';
import { IPdfDocument } from '../../../models/document-mail.model';
import { Step1AttachDocComponent } from './step1-attach-doc/step1-attach-doc.component';
import { Step2PageSelectComponent } from './step2-page-select/step2-page-select.component';
import { Step3MailDetailsComponent } from './step3-mail-details/step3-mail-details.component';

@Component({
  selector: 'app-document-send-mail-wizard-v4',
  standalone: true,
  imports: [
    LucideAngularModule,
    Step1AttachDocComponent,
    Step2PageSelectComponent,
    Step3MailDetailsComponent
  ],
  templateUrl: './document-send-mail-wizard-v4.component.html',
  styleUrl: './document-send-mail-wizard-v4.component.scss'
})
export class DocumentSendMailWizardV4Component {
  dialogRef = inject(MatDialogRef<DocumentSendMailWizardV4Component>);

  currentStep = signal<1 | 2 | 3>(1);
  tempFile = signal<File | null>(null);
  pdfDocuments = signal<IPdfDocument[]>([]);
  selectedPagesByPdf = signal<Map<number, number[]>>(new Map());

  stepTitle = computed(() => {
    switch (this.currentStep()) {
      case 1: return 'Attach Document to Mail';
      case 2: return 'Select the pages you want to mail';
      case 3: return 'Configure Mailing Details';
    }
  });

  stepSubtitle = computed(() => {
    switch (this.currentStep()) {
      case 1: return 'Upload the document you want to attach. Only PDF files are supported.';
      case 2: return 'Choose which pages from your document to include in the mail.';
      case 3: return 'Set sender, recipient, and shipping details for your documents.';
    }
  });

  onFileSelected(file: File): void {
    this.tempFile.set(file);
    this.currentStep.set(2);
    this.dialogRef.updateSize('1200px', '');
  }

  onPageSelectContinue(event: { pdfDocuments: IPdfDocument[]; selectedPagesByPdf: Map<number, number[]> }): void {
    this.pdfDocuments.set(event.pdfDocuments);
    this.selectedPagesByPdf.set(event.selectedPagesByPdf);
    this.currentStep.set(3);
  }

  onStepBack(): void {
    const step = this.currentStep();
    if (step === 2) {
      this.currentStep.set(1);
      this.dialogRef.updateSize('750px', '');
    } else if (step === 3) {
      this.currentStep.set(2);
    } else {
      this.dialogRef.close();
    }
  }

  onSubmitSuccess(): void {
    this.dialogRef.close({ success: true });
  }

  close(): void {
    this.dialogRef.close();
  }
}
