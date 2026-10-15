import { Component, OnInit, inject, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faCheck,
  faPlus,
  faXmark,
  faFileLines
} from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DocumentMailService } from '../../services/document-mail.service';
import { IPdfDocument, IPdfPage } from '../../models/document-mail.model';

// Extend Window interface to include PDF.js from CDN
declare global {
  interface Window {
    pdfjsLib: any;
  }
}


declare const pdfjsLib: any;

interface PDFPageProxy {
  pageNumber: number;
  getViewport(params: { scale: number }): {
    width: number;
    height: number;
    scale: number;
  };
  render(params: {
    canvasContext: CanvasRenderingContext2D;
    viewport: any;
    canvas?: HTMLCanvasElement
  }): { promise: Promise<void> };
}

@Component({
  selector: 'app-page-select',
  standalone: true,
  imports: [CommonModule, FaIconComponent, CommonButtonV35Component],
  templateUrl: './page-select.component.html',
  styleUrl: './page-select.component.scss'
})
export class PageSelectComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private router = inject(Router);
  private alertService = inject(AlertService);
  private documentMailService = inject(DocumentMailService);

  // FontAwesome icons
  faArrowLeft = faArrowLeft;
  faCheck = faCheck;
  faPlus = faPlus;
  faXmark = faXmark;
  faFileLines = faFileLines;

  pdfDocuments = signal<IPdfDocument[]>([]);
  pdfPages = signal<IPdfPage[]>([]);
  loading = signal(true);
  error = signal('');
  step = 2;
  totalSteps = 3;
  maxSelectablePages = 10;

  get selectedCount(): number {
    return this.pdfPages().filter(p => p.selected).length;
  }

  get canSelectMore(): boolean {
    const maxTotalPages = 60;
    return this.selectedCount < this.maxSelectablePages && this.pdfPages().length < maxTotalPages;
  }

  get isAllSelected(): boolean {
    const pages = this.pdfPages();
    if (pages.length === 0) return false;
    const selectableCount = Math.min(pages.length, this.maxSelectablePages);
    return this.selectedCount === selectableCount;
  }

  get selectedPagesByPdf(): Map<number, number[]> {
    const selectedPages = this.pdfPages().filter(p => p.selected);
    const pagesByPdf = new Map<number, number[]>();

    selectedPages.forEach(page => {
      const pagesForPdf = pagesByPdf.get(page.pdfIndex) || [];
      pagesForPdf.push(page.originalPageNumber);
      pagesByPdf.set(page.pdfIndex, pagesForPdf);
    });

    return pagesByPdf;
  }

  async ngOnInit(): Promise<void> {
    // First, check if pdfDocuments already exist in service (user navigating back from step 3)
    let existingPdfDocuments = this.documentMailService.getPdfDocuments();
    let existingSelectedPages = this.documentMailService.getSelectedPagesByPdf();

    // If no data in memory, try to restore from storage
    if (existingPdfDocuments.length === 0) {
      this.loading.set(true);
      const restored = await this.documentMailService.restoreFromStorage();
      this.loading.set(false);

      if (restored) {
        existingPdfDocuments = this.documentMailService.getPdfDocuments();
        existingSelectedPages = this.documentMailService.getSelectedPagesByPdf();
      }
    }

    // Case 1: Multiple PDFs already exist (user coming back from step 3 or restored)
    if (existingPdfDocuments.length > 0) {
      this.loading.set(true);

      // Restore all PDF documents with their pages
      await this.restorePdfDocuments(existingPdfDocuments, existingSelectedPages);

      this.loading.set(false);
      return;
    }

    // Case 2: Single file approach (backward compatibility or fresh start)
    const initialFile = this.documentMailService.getTempFile();

    if (!initialFile) {
      this.alertService.warningAlert({
        content: 'No file found. Please upload a document first.'
      });
      this.router.navigate(['/manage/business-tools/document-mail/add-attachment']);
      return;
    }

    this.loadPdf(initialFile);
  }

  /**
   * Restore PDF documents from service with their pages and selections
   */
  private async restorePdfDocuments(
    documents: IPdfDocument[],
    selectedPagesByPdf: Map<number, number[]>
  ): Promise<void> {
    try {
      if (typeof pdfjsLib !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/pdfjs/pdf.worker.min.js';
      }

      const allPages: IPdfPage[] = [];
      let globalPageNumber = 1;

      // Process each PDF document
      for (let pdfIndex = 0; pdfIndex < documents.length; pdfIndex++) {
        const doc = documents[pdfIndex];
        const selectedPagesForThisPdf = selectedPagesByPdf.get(pdfIndex) || [];

        // Load the PDF to regenerate thumbnails
        const arrayBuffer = await doc.file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, isEvalSupported: false });
        const pdf = await loadingTask.promise;

        // Generate pages with thumbnails
        const pagePromises = Array.from({ length: pdf.numPages }, (_, index) => {
          const originalPageNum = index + 1;
          const currentGlobalPageNum = globalPageNumber + index;

          return pdf.getPage(originalPageNum).then(async (page: PDFPageProxy) => {
            const thumbnail = await this.generateThumbnail(page);
            return {
              pageNumber: currentGlobalPageNum,
              originalPageNumber: originalPageNum,
              pdfIndex: pdfIndex,
              thumbnail,
              selected: selectedPagesForThisPdf.includes(originalPageNum) // Restore selection
            };
          });
        });

        const pages = await Promise.all(pagePromises);

        // Update the document with regenerated pages
        documents[pdfIndex].pages = pages;
        documents[pdfIndex].startPageNumber = globalPageNumber;

        allPages.push(...pages);
        globalPageNumber += pdf.numPages;
      }

      // Update component state
      this.pdfDocuments.set(documents);
      this.pdfPages.set(allPages);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to restore PDFs';
      this.error.set(errorMessage);
      console.error('Error restoring PDF documents:', err);
    }
  }

  async loadPdf(file: File): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set('');

      if (typeof pdfjsLib !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/pdfjs/pdf.worker.min.js';
      }

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, isEvalSupported: false });
      const pdf = await loadingTask.promise;

      const currentDocs = this.pdfDocuments();
      const pdfIndex = currentDocs.length;
      const currentPageCount = this.pdfPages().length;
      const startPageNumber = currentPageCount + 1;

      const maxPages = 60;
      const remainingCapacity = maxPages - currentPageCount;
      const totalPages = Math.min(pdf.numPages, remainingCapacity);

      const pagePromises = Array.from({ length: totalPages }, (_, index) => {
        const originalPageNum = index + 1;
        const globalPageNum = startPageNumber + index;
        return pdf.getPage(originalPageNum).then(async (page: PDFPageProxy) => {
          const thumbnail = await this.generateThumbnail(page);
          return {
            pageNumber: globalPageNum,
            originalPageNumber: originalPageNum,
            pdfIndex: pdfIndex,
            thumbnail,
            selected: false
          };
        });
      });

      const pages = await Promise.all(pagePromises);

      const newDoc: IPdfDocument = {
        file: file,
        pages: pages,
        startPageNumber: startPageNumber
      };

      this.pdfDocuments.set([...currentDocs, newDoc]);
      this.pdfPages.set([...this.pdfPages(), ...pages]);
      this.loading.set(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load PDF';
      this.error.set(errorMessage);
      this.loading.set(false);
    }
  }

  private async generateThumbnail(page: PDFPageProxy): Promise<string> {
    try {
      const viewport = page.getViewport({ scale: 0.3 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) return '';

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: context,
        viewport,
        canvas
      }).promise;

      return canvas.toDataURL('image/png');
    } catch (error) {
      return '';
    }
  }

  togglePage(pageNumber: number): void {
    const pages = this.pdfPages();
    const pageIndex = pages.findIndex(p => p.pageNumber === pageNumber);

    if (pageIndex !== -1) {
      const page = pages[pageIndex];

      if (!page.selected && this.selectedCount >= this.maxSelectablePages) {
        this.alertService.warningAlert({
          content: `You can only select up to ${this.maxSelectablePages} pages.`
        });
        return;
      }

      pages[pageIndex].selected = !pages[pageIndex].selected;
      this.pdfPages.set([...pages]);
    }
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      // Select all (up to max limit)
      const pages = this.pdfPages();
      let selectedSoFar = 0;

      const updatedPages = pages.map(p => {
        if (selectedSoFar < this.maxSelectablePages) {
          selectedSoFar++;
          return { ...p, selected: true };
        }
        return { ...p, selected: false };
      });

      this.pdfPages.set(updatedPages);

      if (selectedSoFar >= this.maxSelectablePages && pages.length > this.maxSelectablePages) {
        this.alertService.warningAlert({
          content: `Only the first ${this.maxSelectablePages} pages have been selected (maximum limit).`
        });
      }
    } else {
      // Deselect all
      const pages = this.pdfPages().map(p => ({ ...p, selected: false }));
      this.pdfPages.set(pages);
    }
  }

  selectAll(): void {
    const pages = this.pdfPages();
    let selectedSoFar = 0;

    const updatedPages = pages.map(p => {
      if (selectedSoFar < this.maxSelectablePages) {
        selectedSoFar++;
        return { ...p, selected: true };
      }
      return { ...p, selected: false };
    });

    this.pdfPages.set(updatedPages);

    if (selectedSoFar >= this.maxSelectablePages) {
      this.alertService.warningAlert({
        content: `Only the first ${this.maxSelectablePages} pages have been selected (maximum limit).`
      });
    }
  }

  deselectAll(): void {
    const pages = this.pdfPages().map(p => ({ ...p, selected: false }));
    this.pdfPages.set(pages);
  }

  onBack(): void {
    this.router.navigate(['/manage/business-tools/document-mail/add-attachment']);
  }

  onAddPdf(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const maxTotalPages = 60;
    if (this.pdfPages().length >= maxTotalPages) {
      this.alertService.warningAlert({
        content: `You have already loaded ${maxTotalPages} pages (maximum limit). You cannot add more PDFs.`
      });
      input.value = '';
      return;
    }

    if (this.selectedCount >= this.maxSelectablePages) {
      this.alertService.warningAlert({
        content: `You have already selected ${this.maxSelectablePages} pages (maximum limit). You cannot add more PDFs.`
      });
      input.value = '';
      return;
    }

    if (file.type !== 'application/pdf') {
      this.alertService.warningAlert({
        content: 'Please select a valid PDF file.'
      });
      return;
    }

    this.loadPdf(file);

    input.value = '';
  }

  getPdfFileName(pdfIndex: number): string {
    const doc = this.pdfDocuments()[pdfIndex];
    return doc?.file.name || `PDF ${pdfIndex + 1}`;
  }

  isLastPageOverall(page: IPdfPage): boolean {
    const allPages = this.pdfPages();
    if (allPages.length === 0) return false;

    const lastPage = allPages[allPages.length - 1];
    return page.pageNumber === lastPage.pageNumber;
  }

  onContinue(): void {
    if (this.selectedCount === 0) {
      this.alertService.warningAlert({
        content: 'Please select at least one page to continue.'
      });
      return;
    }

    this.documentMailService.setPdfDocuments(
      this.pdfDocuments(),
      this.selectedPagesByPdf
    );

    this.router.navigate(['/manage/business-tools/document-mail/mail-details']);
  }
}
