import { Component, ElementRef, OnInit, ViewChild, inject, input, output, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { IPdfDocument, IPdfPage } from '../../../../models/document-mail.model';

declare const pdfjsLib: any;

interface PDFPageProxy {
  pageNumber: number;
  getViewport(params: { scale: number }): { width: number; height: number; scale: number };
  render(params: { canvasContext: CanvasRenderingContext2D; viewport: any; canvas?: HTMLCanvasElement }): { promise: Promise<void> };
}

@Component({
  selector: 'app-step2-page-select',
  standalone: true,
  imports: [LucideAngularModule, CommonButtonV4Component],
  templateUrl: './step2-page-select.component.html',
  styleUrl: './step2-page-select.component.scss'
})
export class Step2PageSelectComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private alertService = inject(V4AlertService);

  file = input.required<File>();
  stepBack = output<void>();
  continueEvent = output<{ pdfDocuments: IPdfDocument[]; selectedPagesByPdf: Map<number, number[]> }>();

  pdfDocuments = signal<IPdfDocument[]>([]);
  pdfPages = signal<IPdfPage[]>([]);
  loading = signal(true);
  error = signal('');

  maxSelectablePages = 10;

  get selectedCount(): number {
    return this.pdfPages().filter(p => p.selected).length;
  }

  get canAddMore(): boolean {
    return this.pdfPages().length < 60;
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
    await this.loadPdf(this.file());
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
            pdfIndex,
            thumbnail,
            selected: false
          };
        });
      });

      const pages = await Promise.all(pagePromises);

      const newDoc: IPdfDocument = {
        file,
        pages,
        startPageNumber
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

      await page.render({ canvasContext: context, viewport, canvas }).promise;
      return canvas.toDataURL('image/png');
    } catch {
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

      if (pages.length > this.maxSelectablePages) {
        this.alertService.warningAlert({
          content: `Only the first ${this.maxSelectablePages} pages have been selected (maximum limit).`
        });
      }
    } else {
      this.pdfPages.set(this.pdfPages().map(p => ({ ...p, selected: false })));
    }
  }

  onAddPdf(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (this.pdfPages().length >= 60) {
      this.alertService.warningAlert({ content: 'Maximum 60 pages reached. Cannot add more PDFs.' });
      input.value = '';
      return;
    }

    if (file.type !== 'application/pdf') {
      this.alertService.warningAlert({ content: 'Please select a valid PDF file.' });
      input.value = '';
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
    return page.pageNumber === allPages[allPages.length - 1].pageNumber;
  }

  onContinue(): void {
    if (this.selectedCount === 0) {
      this.alertService.warningAlert({ content: 'Please select at least one page to continue.' });
      return;
    }

    this.continueEvent.emit({
      pdfDocuments: this.pdfDocuments(),
      selectedPagesByPdf: this.selectedPagesByPdf
    });
  }
}
