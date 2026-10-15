import {
  Component,
  inject,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  ChangeDetectorRef,
  signal,
  HostListener,
  DestroyRef
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faArrowRight,
  faChevronLeft,
  faChevronRight,
  faPlus,
  faCheck,
  faEllipsisVertical,
  faXmark,
  faMagnifyingGlassPlus,
  faMagnifyingGlassMinus,
  faGripVertical,
  faPenToSquare,
  faTrash,
  faCircleQuestion
} from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  faBriefcase,
  faBuilding,
  faCalendar,
  faEnvelope,
  faFont,
  faSignature,
  faUser,
  faSquareCheck,
  faCircleDot,
  faPaperclip
} from '@fortawesome/pro-regular-svg-icons';
import { finalize, take, Subject, debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import {
  ISignatureField,
  IPdfPage,
  IRecipient,
  IFieldValue,
  FieldType,
  ICreateFieldRequest,
  IDocumentDetails,
} from '../../model/zil-sing.model';
import { ZilSignService } from '../../service/zil-sign.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { FieldInputModalComponent, IFieldInputModalData } from './components/field-input-modal/field-input-modal.component';
import { ConfirmSignModalComponent, IConfirmSignModalData, IRecipientFieldCount } from '../../modal/confirm-sign-modal/confirm-sign-modal.component';
import { FieldContextMenuComponent, ContextMenuAction } from './components/field-context-menu/field-context-menu.component';
import { PlaceFieldModalComponent, IPlaceFieldModalData, IPlaceFieldModalResult } from './components/place-field-modal/place-field-modal.component';
import { SignAgreementModalComponent } from '../../modal/sign-agreement-modal/sign-agreement-modal/sign-agreement-modal.component';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { IApiResSuccessOnly } from 'src/app/models/api';
import { MatTooltipModule } from '@angular/material/tooltip';

// Extend Window interface to include PDF.js from local assets
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

// Access PDF.js from global window object (loaded from local assets)
declare const pdfjsLib: any;

@Component({
  selector: 'app-sign-pdf-viewer',
  standalone: true,
  imports: [FaIconComponent, CommonButtonV35Component, NgClass, FormsModule, FieldContextMenuComponent, MatTooltipModule],
  templateUrl: './sign-pdf-viewer.component.html',
  styleUrl: './sign-pdf-viewer.component.scss'
})
export class SignPdfViewerComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('pdfContainer') pdfContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('pdfOverlay') pdfOverlay!: ElementRef<HTMLDivElement>;
  @ViewChild('pdfPagesContainer')
  pdfPagesContainer!: ElementRef<HTMLDivElement>;


  private sanitizer = inject(DomSanitizer);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private zilSignService = inject(ZilSignService);
  private alertService = inject(AlertService);
  private dialog = inject(MatDialog);
  private localStorageService = inject(LocalStorageService);
  private destroyRef = inject(DestroyRef);

  loadingSubmit = false;
  documentId: string = '';
  documentName: string = '';
  signerToken: string = '';
  isSignerMode: boolean = false;
  fieldSettingsSaved: boolean = false;
  fieldValues: Map<string, string> = new Map();
  storedInitials: string | null = null;
  storedSignatureStyle: 'cursive' | 'standard' | 'bold' = 'cursive';

  email = signal<string>('');
  username = signal<string>('');
  canSubmit = signal<boolean>(false);

  faArrowLeft = faArrowLeft;
  faArrowRight = faArrowRight;
  faChevronLeft = faChevronLeft;
  faChevronRight = faChevronRight;
  faPlus = faPlus;
  faCheck = faCheck;
  faEllipsisVertical = faEllipsisVertical;
  faXmark = faXmark;
  faMagnifyingGlassPlus = faMagnifyingGlassPlus;
  faMagnifyingGlassMinus = faMagnifyingGlassMinus;
  faGripVertical = faGripVertical;
  faPenToSquare = faPenToSquare;
  faSignature = faSignature;
  faTrash = faTrash;
  faCircleQuestion = faCircleQuestion;

  pdfUrl = '';
  urlSafe: SafeResourceUrl;
  currentPage = 1;
  totalPages = 0;
  zoomLevel = 100;
  zoom = 1.5;
  pdfPages: IPdfPage[] = [];
  pdfDoc: any = null;
  pdfLoading = true;
  pdfError = '';

  recipients: IRecipient[] = [];
  currentRecipientId: number | null = null;

  signatureFields: ISignatureField[] = [];
  /** groupName keys of checkbox groups that failed submit validation */
  failingGroupNames = new Set<string>();
  draggedFieldType: FieldType | null = null;
  draggingField: ISignatureField | null = null;
  draggingFieldElement: HTMLElement | null = null;
  hasDragged = false;
  dragOffsetX = 0;
  dragOffsetY = 0;
  selectedRecipientId: number | null = null;
  selectedField: ISignatureField | null = null;
  showFieldInspector = false;
  resizingField: ISignatureField | null = null;
  resizeHandle: string | null = null;
  resizeStartX = 0;
  resizeStartY = 0;
  resizeStartWidth = 0;
  resizeStartHeight = 0;
  resizeStartLeft = 0;
  resizeStartTop = 0;
  faBuilding = faBuilding;
  faEnvelope = faEnvelope;
  faBriefcase = faBriefcase;
  faUser = faUser;
  faFont = faFont;
  faCalendar = faCalendar;
  faSquareCheck = faSquareCheck;
  faCircleDot = faCircleDot;
  faPaperclip = faPaperclip;

  isDragOver = false;
  snapToGrid = true;
  snapDistance = 10;
  showGrid = false;
  private windowResizeHandler?: () => void;

  // Context menu state
  showContextMenu = false;
  contextMenuX = 0;
  contextMenuY = 0;
  contextMenuFieldId = '';

  // Add-more popover state (checkbox/radio editor mode)
  addMoreTarget: { field: ISignatureField } | null = null;

  // Field settings auto-save
  private fieldSettingsChanged$ = new Subject<void>();
  private editingGroupName: string | null = null;

  private recipientColors: string[] = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
    '#6366F1' // Indigo
  ];

  /**
   * Helper function to check if a field is prefilled (recipientId is null, 0, or -1)
   * Prefilled fields can be edited by the sender in real-time like signer mode
   */
  private isPrefillField(field: ISignatureField): boolean {
    return !field.recipientId || field.recipientId === 0 || field.recipientId === -1;
  }

  /**
   * Helper function to check if a field is assigned to a recipient (recipientId > 0)
   * These fields are configured by sender but filled by recipients
   */
  private isRecipientField(field: ISignatureField): boolean {
    return !!field.recipientId && field.recipientId > 0;
  }

  /**
   * Helper function to check if a recipient can have fields assigned
   * Recipients with role 'receives_copy' cannot have fields
   */
  canAssignFields(recipient: IRecipient): boolean {
    return recipient.role !== 'receives_copy';
  }

  ngOnInit(): void {
    this.signerToken =
      this.route.snapshot.params['token'] ||
      this.route.snapshot.queryParams['token'] ||
      '';
    this.isSignerMode = !!this.signerToken;

    this.email.set(this.localStorageService.getItem('email') || '');
    this.username.set(this.localStorageService.getItem('username') || '');

    if (this.isSignerMode) {
      this.loadDocumentByToken();
    } else {
      this.documentId = this.route.snapshot.params['id'];
      if (!this.documentId) {
        this.pdfError = 'Document ID is required';
        this.pdfLoading = false;
        return;
      }
      this.loadDocumentDetails();
    }

    // Auto-save field settings after 600ms of inactivity
    this.fieldSettingsChanged$
      .pipe(debounceTime(600), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.onFieldSettingsAutoSave());
  }

  ngAfterViewInit(): void {
    this.setupPdfDropZone();
    this.setupFieldDragging();

    if (typeof window !== 'undefined') {
      this.windowResizeHandler = () => {
        this.cdr.detectChanges();
      };
      window.addEventListener('resize', this.windowResizeHandler);
    }
  }

  loadDocumentDetails(): void {
    this.zilSignService
      .getDocumentDetails(this.documentId)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.documentName = response.data.name;
            this.pdfUrl = response.data.pdfUrl;

            // Add "Prefill by you" as a special recipient option (for custom fields only)
            const prefillRecipient: IRecipient = {
              id: -1,
              name: 'Prefill by you',
              email: '',
              role: 'owner'
            };
            this.recipients = [prefillRecipient, ...(response.data.recipients || [])];

            this.signatureFields = response.data.fields || [];

            // Initialize fieldValues Map — use API value if present, fall back to defaultValue
            this.signatureFields.forEach(field => {
              if (!field.id) return;
              if (field.value) {
                this.fieldValues.set(field.id, field.value);
                if (field.type === 'attachment' && field.filename) {
                  this.fieldValues.set(field.id + '-filename', field.filename);
                }
              } else if (field.defaultValue) {
                this.fieldValues.set(field.id, field.defaultValue);
              }
            });

            this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(
              this.pdfUrl
            );

            // Auto-select first signer recipient if only one exists
            this.autoSelectRecipient();

            setTimeout(() => {
              this.renderPDF();
            }, 0);
          } else {
            this.pdfError = 'Failed to load document details';
            this.pdfLoading = false;
            this.cdr.detectChanges();
          }
        },
        error: (error) => {
          this.pdfError = error?.error?.message || 'Failed to load document';
          this.pdfLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  loadDocumentByToken(): void {
    this.zilSignService
      .getDocumentByTokenOutside(this.signerToken)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          if (response.success && (response.data as IDocumentDetails)?.status!=='signed') {
            const data = response.data as IDocumentDetails;
            // Check if document is already signed - if so, navigate to success page
            const alreadySigned = data.already_signed;
            
            if (alreadySigned) {
              // Navigate to success page with email options
              this.router.navigate(['/outside/zil-sign/success'], {
                queryParams: {
                  token: this.signerToken,
                  documentId: data.id
                }
              });
              return;
            }

            this.documentId = data.id;
            this.documentName = data.name;
            this.pdfUrl = data.pdfUrl;

            // Add "Prefill by you" as a special recipient option (only in non-signer mode, for custom fields only)
            if (!this.isSignerMode) {
              const prefillRecipient: IRecipient = {
                id: -1,
                name: 'Prefill by you',
                email: '',
                role: 'owner'
              };
              this.recipients = [prefillRecipient, ...(data.recipients || [])];
            } else {
              this.recipients = data.recipients || [];
            }

            this.currentRecipientId = data.currentRecipientId ||
              (data.fields?.find(f => f.recipientId != null)?.recipientId ?? null);
            this.signatureFields = data.fields || [];

            // Initialize fieldValues Map — use API value if present, fall back to defaultValue
            this.signatureFields.forEach(field => {
              if (!field.id) return;
              if (field.value) {
                this.fieldValues.set(field.id, field.value);
                if (field.type === 'attachment' && field.filename) {
                  this.fieldValues.set(field.id + '-filename', field.filename);
                }
              } else if (field.defaultValue) {
                this.fieldValues.set(field.id, field.defaultValue);
              }
            });

            this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(
              this.pdfUrl
            );

            if (!this.isSignerMode) {
              this.autoSelectRecipient();
            }

            setTimeout(() => {
              this.renderPDF();
            }, 0);
          } else {
            this.pdfError = (response.data as IApiResSuccessOnly)?.errorMsg || 'Failed to load document';
            this.pdfLoading = false;
            this.cdr.detectChanges();
          }
        },
        error: (error) => {
          this.pdfError =
            error?.error?.message || 'Invalid or expired signing link';
          this.pdfLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  async renderPDF(): Promise<void> {
    try {
      this.pdfLoading = true;
      this.pdfError = '';

      const container = this.pdfPagesContainer?.nativeElement;
      if (!container) {
        this.pdfLoading = false;
        return;
      }

      container.innerHTML = '';
      this.pdfPages = [];

      if (typeof pdfjsLib !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/pdfjs/pdf.worker.min.js';
      }

      const pdfData = await this.zilSignService.fetchPdfData(this.pdfUrl);

      const loadingTask = pdfjsLib.getDocument({ data: pdfData, isEvalSupported: false });
      const pdf = await loadingTask.promise;
      this.pdfDoc = pdf;
      this.totalPages = pdf.numPages;

      if (this.isSignerMode && this.currentRecipientId) {
        // Show only fields assigned to current recipient
        // Exclude prefilled fields with values (backend already appended them to PDF)
        this.signatureFields = this.signatureFields.filter((f) => {
          const isPrefilled = !f.recipientId;
          const hasValue = f.value && f.value.trim() !== '';

          if (f.recipientId === this.currentRecipientId) return true;
          // Attachment prefill fields need a transparent overlay so the PDF link is clickable
          if (isPrefilled && hasValue) return f.type === 'attachment';
          return isPrefilled && !hasValue;
        });
      }

      let currentY = 0;
      const scale = this.zoom;

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
          continue;
        }

        canvas.height = viewport.height;
        canvas.width = viewport.width;
        canvas.style.display = 'block';
        canvas.style.marginBottom = '20px';
        canvas.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        canvas.style.background = 'white';

        const pageWrapper = document.createElement('div');
        pageWrapper.style.position = 'relative';
        pageWrapper.style.display = 'block';
        pageWrapper.style.marginBottom = '20px';
        pageWrapper.appendChild(canvas);

        const overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = `${viewport.width}px`;
        overlay.style.height = `${viewport.height}px`;
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '100';
        pageWrapper.appendChild(overlay);

        container.appendChild(pageWrapper);

        const renderContext: any = {
          canvasContext: context,
          viewport: viewport
        };

        await page.render(renderContext).promise;

        const thumbnailDataUrl = await this.generateThumbnail(page);

        // Get PDF page dimensions in points (72 DPI)
        // PDF.js viewport.width is in pixels at the given scale
        // To get PDF points, divide by scale
        const pdfPageWidth = viewport.width / scale;
        const pdfPageHeight = viewport.height / scale;
        const viewportScale = scale; // Scale factor for converting PDF points to pixels

        this.pdfPages.push({
          pageNumber: pageNum,
          canvas: canvas,
          overlay: overlay,
          offsetY: currentY,
          width: viewport.width,
          height: viewport.height,
          thumbnail: thumbnailDataUrl,
          pdfWidth: pdfPageWidth,
          pdfHeight: pdfPageHeight,
          viewportScale: viewportScale
        });

        currentY += viewport.height + 20;
      }

      this.pdfLoading = false;
      this.cdr.detectChanges();

      setTimeout(() => {
        this.renderFieldsIntoOverlays();
      }, 100);
    } catch (error: any) {
      this.pdfError = error.message || 'Failed to render PDF';
      this.pdfLoading = false;
      this.cdr.detectChanges();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.scrollToPage(page);
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.scrollToPage(this.currentPage);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.scrollToPage(this.currentPage);
    }
  }

  scrollToPage(page: number): void {
    const pageInfo = this.pdfPages.find((p) => p.pageNumber === page);
    if (!pageInfo) return;

    const container = this.pdfContainer?.nativeElement;
    if (!container) return;

    container.scrollTo({
      top: pageInfo.offsetY - 20,
      behavior: 'smooth'
    });

    this.currentPage = page;
  }

  zoomIn(): void {
    this.zoomLevel = Math.min(this.zoomLevel + 10, 200);
    this.zoom = this.zoomLevel / 100;
    this.renderPDF();
  }

  zoomOut(): void {
    this.zoomLevel = Math.max(this.zoomLevel - 10, 50);
    this.zoom = this.zoomLevel / 100;
    this.renderPDF();
  }

  onDragStart(event: DragEvent, fieldType: FieldType): void {
    this.draggedFieldType = fieldType;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData('text/plain', fieldType);
    }
  }

  getFieldTypeLabel(type: FieldType): string {
    const labels: Record<FieldType, string> = {
      signature: 'Signature',
      initial: 'Initial',
      name: 'Full Name',
      sign_date: 'Sign Date',
      company: 'Company',
      title: 'Job Title',
      date: 'Date',
      text: 'Text',
      email: 'Email',
      checkbox: 'Checkbox',
      radio: 'Radio',
      attachment: 'Attachment'
    };
    return labels[type] || type;
  }

  getFieldTypeIcon(type: FieldType): string {
    const icons: Record<FieldType, string> = {
      signature: 'fas fa-pen-to-square',
      initial: 'fas fa-signature',
      name: 'fas fa-user',
      sign_date: 'fas fa-calendar',
      company: 'fas fa-building',
      title: 'fas fa-briefcase',
      date: 'fas fa-calendar',
      text: 'fas fa-font',
      email: 'fas fa-envelope',
      checkbox: 'far fa-square-check',
      radio: 'far fa-circle-dot',
      attachment: 'far fa-paperclip'
    };
    return icons[type] || 'fas fa-square';
  }

  onDragEnd(event: DragEvent): void {
    this.draggedFieldType = null;
  }

  setupPdfDropZone(): void {
    const overlay = this.pdfOverlay?.nativeElement;
    const container = this.pdfContainer?.nativeElement;

    if (!overlay || !container) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.draggedFieldType) {
        this.isDragOver = true;
        this.cdr.detectChanges();
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = container.getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;

      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        this.isDragOver = false;
        this.cdr.detectChanges();
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      this.isDragOver = false;

      if (this.draggedFieldType) {
        // Convert screen coordinates to PDF points
        const coords = this.screenToPdfPoints(e.clientX, e.clientY);
        if (coords) {
          this.addSignatureField(coords.x, coords.y, this.draggedFieldType, coords.pageNumber);
        }
        this.draggedFieldType = null;
        this.cdr.detectChanges();
      }
    };

    overlay.addEventListener('dragover', handleDragOver);
    overlay.addEventListener('dragleave', handleDragLeave);
    overlay.addEventListener('drop', handleDrop);

    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('dragleave', handleDragLeave);
    container.addEventListener('drop', handleDrop);
  }

  setupFieldDragging(): void {
    const container = this.pdfContainer?.nativeElement;
    if (!container) return;

    const mouseMoveHandler = (e: MouseEvent) => {
      if (this.draggingField && this.draggingFieldElement) {
        e.preventDefault();
        this.hasDragged = true;

        // Convert screen coordinates to PDF points
        const coords = this.screenToPdfPoints(e.clientX, e.clientY);
        if (coords) {
          const oldPageNumber = this.draggingField.pageNumber;

          let pdfX = Math.max(0, coords.x - this.dragOffsetX);
          let pdfY = Math.max(0, coords.y - this.dragOffsetY);

          if (this.snapToGrid) {
            // Convert snap distance from pixels to PDF points
            const page = this.pdfPages.find((p) => p.pageNumber === coords.pageNumber);
            const snapDistancePdf = page ? this.snapDistance / page.viewportScale : this.snapDistance;
            pdfX = Math.round(pdfX / snapDistancePdf) * snapDistancePdf;
            pdfY = Math.round(pdfY / snapDistancePdf) * snapDistancePdf;
          }

          if (coords.pageNumber === this.draggingField.pageNumber) {
            this.draggingField.x = pdfX;
            this.draggingField.y = pdfY;
          } else {
            this.draggingField.pageNumber = coords.pageNumber;
            this.draggingField.x = pdfX;
            this.draggingField.y = pdfY;

            const newPage = this.pdfPages.find(
              (p) => p.pageNumber === coords.pageNumber
            );
            const oldPage = this.pdfPages.find(
              (p) => p.pageNumber === oldPageNumber
            );

            if (
              newPage?.overlay &&
              oldPage?.overlay &&
              this.draggingFieldElement
            ) {
              oldPage.overlay.removeChild(this.draggingFieldElement);
              newPage.overlay.appendChild(this.draggingFieldElement);
            }
          }

          // Convert PDF points to screen pixels for display
          const screenCoords = this.pdfPointsToScreen(this.draggingField);
          if (this.draggingFieldElement) {
            this.draggingFieldElement.style.left = `${screenCoords.x}px`;
            this.draggingFieldElement.style.top = `${screenCoords.y}px`;
          }

          const page = this.pdfPages.find(
            (p) => p.pageNumber === coords.pageNumber
          );
          if (page) {
            const fieldY = page.offsetY + screenCoords.y;
            const containerRect = container.getBoundingClientRect();
            const scrollTop = container.scrollTop;
            const visibleTop = scrollTop;
            const visibleBottom = scrollTop + containerRect.height;

            if (fieldY < visibleTop + 50) {
              container.scrollTo({ top: fieldY - 50, behavior: 'smooth' });
            } else if (
              fieldY + screenCoords.height >
              visibleBottom - 50
            ) {
              container.scrollTo({
                top:
                  fieldY +
                  screenCoords.height -
                  containerRect.height +
                  50,
                behavior: 'smooth'
              });
            }
          }
        }
      }
    };

    const mouseUpHandler = () => {
      if (this.draggingField) {
        // Only save position and re-render if the field was actually dragged
        if (this.hasDragged) {
          const fieldIndex = this.signatureFields.findIndex(
            (f) => f.id === this.draggingField?.id
          );
          if (fieldIndex !== -1 && this.draggingField) {
            this.signatureFields[fieldIndex] = { ...this.draggingField };
            // Sync selectedField so settings-panel changes after a drag don't
            // overwrite the new position with the stale pre-drag coordinates.
            if (this.selectedField?.id === this.draggingField.id) {
              this.selectedField = { ...this.signatureFields[fieldIndex] };
            }
          }

          this.saveFieldPosition(this.draggingField);
          setTimeout(() => {
            this.hasDragged = false;
            this.renderFieldsIntoOverlays();
          }, 100);
        } else {
          // Just reset the flag if not dragged
          this.hasDragged = false;
        }

        this.draggingField = null;
        this.draggingFieldElement = null;
        this.cdr.detectChanges();
      }
    };

    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
  }

  onFieldMouseDown(event: MouseEvent, field: ISignatureField): void {
    event.preventDefault();
    event.stopPropagation();
    this.hasDragged = false;
    this.draggingField = { ...field };
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  getFieldAbsoluteX(field: ISignatureField): number {
    const screenCoords = this.pdfPointsToScreen(field);
    return screenCoords.x;
  }

  getFieldAbsoluteY(field: ISignatureField): number {
    const screenCoords = this.pdfPointsToScreen(field);
    return screenCoords.y;
  }

  getFieldsForPage(pageNumber: number): ISignatureField[] {
    let fields = this.signatureFields.filter(
      (f) => f.pageNumber === pageNumber
    );

    if (this.isSignerMode && this.currentRecipientId) {
      // Show only fields assigned to current recipient.
      // Exclude prefilled fields with values only when they are baked into the PDF
      // (text, signature, date, etc.). Attachment fields are never baked in —
      // they must always be shown as overlays so the signer can see the file.
      fields = fields.filter((f) => {
        const isPrefilled = !f.recipientId;
        const hasValue = f.value && f.value.trim() !== '';

        if (f.recipientId === this.currentRecipientId) return true;
        return isPrefilled && !hasValue;
      });
    }

    return fields;
  }

  getMaxPdfWidth(): number {
    if (typeof window === 'undefined' || this.pdfPages.length === 0) {
      return this.pdfPages[0]?.width || 800;
    }

    const originalWidth = this.pdfPages[0].width;
    const windowWidth = window.innerWidth;

    let availableWidth = windowWidth;

    if (!this.isSignerMode) {
      if (windowWidth < 640) {
        availableWidth -= 250;
      } else if (windowWidth < 768) {
        availableWidth -= 280;
      } else if (windowWidth < 1024) {
        availableWidth -= windowWidth * 0.2;
      } else {
        availableWidth -= windowWidth * 0.2;
      }
    }

    if (windowWidth >= 1024) {
      availableWidth -= 200;
    }

    const padding = windowWidth < 768 ? 16 : windowWidth < 1024 ? 24 : 40;
    availableWidth -= padding;

    return Math.min(originalWidth, availableWidth - 20);
  }

  createInlineInput(field: ISignatureField, value: string): HTMLElement {
    const input = document.createElement('input');
    input.type = this.getInputType(field.type);
    input.value = value;
    input.style.width = '100%';
    input.style.height = '100%';
    input.style.boxSizing = 'border-box';
    input.style.border = 'none';
    input.style.outline = 'none';
    input.style.background = 'transparent';
    input.style.fontSize = '12px';
    input.style.padding = '4px';
    input.style.textAlign = 'center';
    input.style.color = 'var(--main-text-color)';
    input.placeholder = this.getFieldPlaceholder(field.type);
    input.id = `field-input-${field.id}`;

    if (field.characterLimit) {
      input.maxLength = field.characterLimit;
    }

    if (field.type === 'email') {
      input.pattern = '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$';
    }

    if (field.validation === 'numeric') {
      input.addEventListener('keydown', (e) => {
        const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End', '.', '-'];
        if (!allowed.includes(e.key) && !/^\d$/.test(e.key)) e.preventDefault();
      });
    } else if (field.validation === 'alphabet') {
      input.addEventListener('keydown', (e) => {
        const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End', ' '];
        if (!allowed.includes(e.key) && !/^[a-zA-Z]$/.test(e.key)) e.preventDefault();
      });
    }

    input.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      this.fieldValues.set(field.id || '', target.value);
    });

    input.addEventListener('blur', (e) => {
      const target = e.target as HTMLInputElement;
      const value = target.value.trim();

      // Update field values
      if (value) {
        this.fieldValues.set(field.id || '', value);
        
        // Extract and store initials when a name field is saved
        if (field.type === 'name') {
          const extractedInitials = this.extractInitials(value);
          if (extractedInitials) {
            this.storedInitials = extractedInitials;
            // Auto-populate any existing empty initials fields
            this.autoPopulateInitialsFields();
          }
        }
      } else {
        this.fieldValues.delete(field.id || '');
      }

      // Validate email if provided
      if (field.type === 'email' && value && !this.isValidEmail(value)) {
        this.alertService.failedAlert({
          content: 'Please enter a valid email address',
          title: 'Invalid Email'
        });
        // Don't auto-focus to prevent infinite loop - let user manually fix the email
        return; // Don't replace with placeholder if email is invalid
      }

      // If empty and in signer mode, replace input with placeholder after a short delay
      if (this.isSignerMode && !value && field.type !== 'signature' && field.type !== 'initial') {
        setTimeout(() => {
          const fieldElement = target.closest('div[style*="position: absolute"]') as HTMLElement;
          if (fieldElement && !this.fieldValues.get(field.id || '')) {
            const placeholder = this.createFieldPlaceholder(field);
            fieldElement.innerHTML = '';
            fieldElement.appendChild(placeholder);
            fieldElement.style.cursor = 'pointer';
            this.cdr.detectChanges();
          }
        }, 100);
      }
    });

    input.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    input.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });

    return input;
  }

  createInlineInputForPrefill(field: ISignatureField, value: string): HTMLElement {
    const input = document.createElement('input');
    input.type = this.getInputType(field.type);
    input.value = value;
    input.style.width = '100%';
    input.style.height = '100%';
    input.style.boxSizing = 'border-box';
    input.style.border = 'none';
    input.style.outline = 'none';
    input.style.background = 'transparent';
    input.style.fontSize = '12px';
    input.style.padding = '4px';
    input.style.textAlign = 'center';
    input.style.color = 'var(--main-text-color)';
    input.placeholder = this.getFieldPlaceholder(field.type);
    input.id = `field-input-${field.id}`;

    if (field.characterLimit) {
      input.maxLength = field.characterLimit;
    }

    // Store the original value to detect changes
    const originalValue = value;

    if (field.type === 'email') {
      input.pattern = '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$';
    }

    input.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      this.fieldValues.set(field.id || '', target.value);
    });

    input.addEventListener('blur', (e) => {
      const target = e.target as HTMLInputElement;
      const value = target.value.trim();

      // Validate email if provided
      if (field.type === 'email' && value && !this.isValidEmail(value)) {
        this.alertService.failedAlert({
          content: 'Please enter a valid email address',
          title: 'Invalid Email'
        });
        return;
      }

      // Only save if the value has actually changed
      if (value !== originalValue) {
        if (value) {
          // // Extract and store initials when a name field is saved
          if (field.type === 'name') {
            const extractedInitials = this.extractInitials(value);
            if (extractedInitials) {
              this.storedInitials = extractedInitials;
              // Auto-populate any existing empty initials fields
              this.autoPopulateInitialsFields();
            }
          }
          
          // Save the field value (will trigger re-render)
          this.saveFieldValue(field.id || '', value);
        } else {
          // Delete the value and re-render to show placeholder
          this.fieldValues.delete(field.id || '');
          this.renderFieldsIntoOverlays();
          this.cdr.detectChanges();
        }
      }
    });

    input.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    input.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });

    return input;
  }
  
  createFieldPlaceholder(field: ISignatureField): HTMLElement {
    const placeholder = document.createElement('div');
    placeholder.style.display = 'flex';
    placeholder.style.flexDirection = 'row';
    placeholder.style.alignItems = 'center';
    placeholder.style.gap = '4px';
    placeholder.style.pointerEvents = 'none';
    placeholder.style.width = '100%';
    placeholder.style.height = '100%';
    placeholder.style.justifyContent = 'flex-start';
    placeholder.style.paddingLeft = '8px';

    const icon = document.createElement('i');
    icon.className = this.getFieldTypeIcon(field.type);
    icon.style.fontSize = '12px';
    icon.style.color = field.recipientId
      ? this.getRecipientColor(field.recipientId)
      : 'var(--main-text-color)';

    const label = document.createElement('span');
    const recipientName = field.recipientId
      ? this.recipients.find((r) => r.id === field.recipientId)?.name
      : null;
    const fieldLabel = field.label || this.getFieldTypeLabel(field.type);

    // Add "Required" indicator if in signer mode and field is unfilled
    const fieldValue = this.fieldValues.get(field.id || '');
    const isUnfilled = this.isSignerMode && !!field.required && (!fieldValue || fieldValue.trim() === '');
    const requiredSuffix = isUnfilled ? ' (Required)' : '';

    label.textContent = recipientName
      ? `${fieldLabel}${requiredSuffix}`
      : `${fieldLabel}${requiredSuffix}`;
    label.style.fontSize = '10px';
    label.style.fontWeight = '500';
    label.style.color = isUnfilled ? 'var(--common-red-color)' : 'var(--main-text-color)';
    label.style.textAlign = 'left';
    label.style.whiteSpace = 'normal';
    label.style.wordBreak = 'break-word';
    label.style.display = 'inline-block';
    label.style.maxWidth = '100%';
    label.style.overflow = 'hidden';
    label.style.textOverflow = 'ellipsis';
    label.style.whiteSpace = 'nowrap';

    placeholder.appendChild(icon);
    placeholder.appendChild(label);

    return placeholder;
  }
  
  getInputType(fieldType: FieldType): string {
    switch (fieldType) {
      case 'email':
        return 'email';
      case 'date':
      case 'sign_date':
        return 'date';
      case 'text':
      case 'name':
      case 'company':
      case 'title':
      default:
        return 'text';
    }
  }
  
  getFieldPlaceholder(fieldType: FieldType): string {
    const placeholders: Record<FieldType, string> = {
      signature: 'Sign Here',
      initial: 'Initial Here',
      name: 'Enter your full name',
      sign_date: 'MM/DD/YYYY',
      company: 'Enter company name',
      title: 'Enter job title',
      date: 'MM/DD/YYYY',
      text: 'Enter text',
      email: 'Enter email address',
      checkbox: 'Enter checkbox',
      radio: 'Enter radio',
      attachment: 'Enter attachment'
    };
    return placeholders[fieldType] || 'Enter value';
  }
  
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get current date in YYYY-MM-DD format for sign_date fields
   */
  getCurrentSignDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Extract initials from a full name
   * Examples: "John Doe" -> "JD", "John" -> "J", "John Michael Doe" -> "JD"
   */
  private extractInitials(fullName: string): string {
    if (!fullName || !fullName.trim()) {
      return '';
    }

    const nameParts = fullName.trim().split(/\s+/).filter(part => part.length > 0);
    
    if (nameParts.length === 0) {
      return '';
    }
    
    if (nameParts.length === 1) {
      // Single name: return first letter twice (e.g., "John" -> "JJ")
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    // Multiple names: first letter of first name + first letter of last name
    const firstName = nameParts[0].charAt(0).toUpperCase();
    const lastName = nameParts[nameParts.length - 1].charAt(0).toUpperCase();
    
    return firstName + lastName;
  }

  /**
   * Get font family based on signature style
   */
  private getSignatureFontFamily(style: 'standard' | 'cursive' | 'bold'): string {
    switch (style) {
      case 'cursive':
        return 'Dancing Script, cursive';
      case 'bold':
        return 'Arial, sans-serif';
      default:
        return 'Arial, sans-serif';
    }
  }

  /**
   * Get font weight based on signature style
   */
  private getSignatureFontWeight(style: 'standard' | 'cursive' | 'bold'): string {
    return style === 'bold' ? 'bold' : 'normal';
  }

  /**
   * Generate initials image from text (base64)
   * Similar to generateTextInitial in FieldInputModalComponent
   */
  private generateInitialsImage(initialsText: string, style?: 'cursive' | 'standard' | 'bold'): string {
    if (!initialsText || !initialsText.trim()) {
      return '';
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Use the provided style or fall back to stored signature style
    const signatureStyle = style || this.storedSignatureStyle;
    const fontFamily = this.getSignatureFontFamily(signatureStyle);
    const fontWeight = this.getSignatureFontWeight(signatureStyle);
    const fontSize = 48;
    
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    const text = initialsText.trim();
    const metrics = ctx.measureText(text);
    
    canvas.width = metrics.width + 40;
    canvas.height = fontSize + 40;
    
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = '#000000';
    ctx.fillText(text, 20, fontSize + 10);
    
    return canvas.toDataURL('image/png').split(',')[1] || canvas.toDataURL('image/png');
  }

  /**
   * Auto-populate all empty initials fields with stored initials
   */
  private autoPopulateInitialsFields(): void {
    if (!this.storedInitials) return;

    let hasUpdates = false;
    this.signatureFields.forEach(field => {
      if (field.type === 'initial') {
        const currentValue = this.fieldValues.get(field.id || '');
        if (!currentValue || currentValue.trim() === '') {
          const initialsImage = this.generateInitialsImage(this.storedInitials || '');
          if (initialsImage) {
            this.fieldValues.set(field.id || '', initialsImage);

            if (!this.isSignerMode) {
            this.zilSignService
              .saveFieldValue(this.documentId, field.id || '', field.type, initialsImage, null)
              .pipe(take(1))
              .subscribe({
                next: (response) => {
                  if (response.success) {
                    // Update the field's backend value for visibility filtering
                    field.value = initialsImage;
                  }
                },
                error: () => {
                  // On failure, remove from local storage
                  this.fieldValues.delete(field.id || '');
                }
              });
            }
            hasUpdates = true;
          }
        }
      }
    });

    if (hasUpdates) {
      this.renderFieldsIntoOverlays();
      this.cdr.detectChanges();
    }
  }

  renderFieldsIntoOverlays(): void {
    this.pdfPages.forEach((page) => {
      if (page.overlay) {
        page.overlay.innerHTML = '';
      }
    });

    const visibleFields = this.getVisibleFields();

    visibleFields.forEach((field) => {
      const page = this.pdfPages.find((p) => p.pageNumber === field.pageNumber);
      if (!page || !page.overlay) return;

      // Convert PDF points to screen pixels
      const screenCoords = this.pdfPointsToScreen(field);

      const fieldElement = document.createElement('div');
      fieldElement.style.position = 'absolute';
      fieldElement.style.left = `${screenCoords.x}px`;
      fieldElement.style.top = `${screenCoords.y}px`;
      fieldElement.style.width = `${screenCoords.width}px`;
      fieldElement.style.height = `${screenCoords.height}px`;
      fieldElement.style.pointerEvents = 'auto';
      fieldElement.style.zIndex =
        this.draggingField?.id === field.id ? '102' : '101';
      fieldElement.style.cursor = this.isSignerMode ? 'pointer' : 'move';
      fieldElement.style.display = 'flex';
      fieldElement.style.alignItems = 'center';
      fieldElement.style.justifyContent = 'center';
      fieldElement.style.borderRadius = '4px';
      if (this.draggingField?.id !== field.id) {
        fieldElement.style.transition = 'box-shadow 0.2s, opacity 0.2s';
      } else {
        fieldElement.style.transition = 'none';
      }
      fieldElement.style.userSelect = 'none';

      const isPrefillAttachmentInSignerMode =
        this.isSignerMode && this.isPrefillField(field) &&
        field.type === 'attachment' && !!this.fieldValues.get(field.id || '');

      if (isPrefillAttachmentInSignerMode) {
        // Transparent click-target over the PDF-rendered attachment link
        fieldElement.style.border = 'none';
        fieldElement.style.backgroundColor = 'transparent';
        fieldElement.style.boxShadow = 'none';
        fieldElement.style.cursor = 'pointer';
        fieldElement.style.pointerEvents = 'auto';
      } else {
        fieldElement.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';

        let borderColor: string;
        let backgroundColor: string;
        let opacity = 1;

        if (this.isRecipientField(field)) {
          borderColor = this.getRecipientBorderColorRgba(field.recipientId!, 0.9);
          backgroundColor = this.getRecipientColorRgba(field.recipientId!, 0.3);
          opacity = 1;
        } else {
          borderColor = 'border-secondary-text-color'; // Gray-500 with 70% opacity
          backgroundColor = 'bg-secondary-background-color'; // Gray-500 with 15% opacity
          opacity = 0.9;
        }

        fieldElement.style.border = `2px solid ${borderColor}`;
        fieldElement.style.backgroundColor = backgroundColor;

        if (!this.isSignerMode && this.isPrefillField(field) && !this.fieldValues.has(field.id || '')) {
          fieldElement.style.borderStyle = 'dashed';
        } else {
          fieldElement.style.borderStyle = 'solid';
        }

        fieldElement.style.opacity = opacity.toString();

        if (this.draggingField?.id === field.id) {
          fieldElement.style.outline = '2px solid rgba(59, 130, 246, 0.8)';
          fieldElement.style.outlineOffset = '2px';
        }

        // Highlight the selected field, and also all siblings in the same checkbox/radio group
        const isGroupSiblingSelected =
          (field.type === 'checkbox' || field.type === 'radio') &&
          !!field.groupName &&
          field.groupName === this.selectedField?.groupName &&
          this.selectedField?.id !== field.id;

        if (!this.isSignerMode && (this.selectedField?.id === field.id || isGroupSiblingSelected)) {
          fieldElement.style.outline = '2px solid rgba(239, 68, 68, 0.9)';
          fieldElement.style.outlineOffset = '2px';
        }

        // In signer mode: orange outline on checkbox fields that belong to a failing group
        if (
          this.isSignerMode &&
          field.type === 'checkbox' &&
          field.groupName &&
          this.failingGroupNames.has(field.groupName)
        ) {
          fieldElement.style.outline = '2px solid rgba(249, 115, 22, 0.9)';
          fieldElement.style.outlineOffset = '2px';

          // Error badge anchored below the bottom-most field in the group on this page
          const groupFields = this.signatureFields.filter(
            f => f.type === 'checkbox' && f.groupName === field.groupName && f.pageNumber === field.pageNumber
          );
          const isBottomField = groupFields.length > 0 &&
            groupFields.reduce((prev, curr) =>
              curr.y + curr.height > prev.y + prev.height ? curr : prev
            ).id === field.id;

          if (isBottomField) {
            const badge = document.createElement('div');
            badge.style.position = 'absolute';
            badge.style.top = '100%';
            badge.style.left = '0';
            badge.style.marginTop = '4px';
            badge.style.fontSize = '10px';
            badge.style.fontWeight = '600';
            badge.style.color = '#fff';
            badge.style.backgroundColor = 'rgba(249, 115, 22, 0.95)';
            badge.style.padding = '2px 6px';
            badge.style.borderRadius = '4px';
            badge.style.whiteSpace = 'nowrap';
            badge.style.pointerEvents = 'none';
            badge.style.zIndex = '200';
            badge.style.lineHeight = '1.4';

            const representative = groupFields.find(f => f.minRequired !== undefined || f.maxRequired !== undefined);
            const min = representative?.minRequired;
            const max = representative?.maxRequired;
            if (min !== undefined && min > 0 && max !== undefined && max > 0 && max !== min) {
              badge.textContent = `Select min ${min} and max ${max} options`;
            } else if (min !== undefined && min > 0) {
              badge.textContent = `Select at least ${min} option${min > 1 ? 's' : ''}`;
            } else if (max !== undefined && max > 0) {
              badge.textContent = `Select at most ${max} option${max > 1 ? 's' : ''}`;
            } else {
              badge.textContent = `Selection required`;
            }

            fieldElement.style.overflow = 'visible';
            fieldElement.appendChild(badge);
          }
        }
      }

      const recipientName = field.recipientId
        ? this.recipients.find((r) => r.id === field.recipientId)?.name
        : null;

      const fieldLabel = field.label || this.getFieldTypeLabel(field.type);
      let fieldValue = this.fieldValues.get(field.id || '');
      
      // Auto-populate sign_date fields with current date if empty (only in signer mode)
      if (this.isSignerMode && field.type === 'sign_date' && (!fieldValue || fieldValue.trim() === '')) {
        fieldValue = this.getCurrentSignDate();
        this.fieldValues.set(field.id || '', fieldValue);
      }
      
      // Auto-populate initials fields with stored initials if empty and initials are available
      if (field.type === 'initial' && (!fieldValue || fieldValue.trim() === '') && this.storedInitials) {
        // Generate initials image from stored initials text
        const initialsImage = this.generateInitialsImage(this.storedInitials);
        if (initialsImage) {
          fieldValue = initialsImage;
          this.fieldValues.set(field.id || '', fieldValue);
        }
      }
      
      const isPrefilled = !field.recipientId;
      const hasValue = fieldValue && fieldValue.trim() !== '';
      const isReadOnly = isPrefilled && hasValue;
      const clickToFillText = this.getClickToFillText(field, fieldLabel);

      fieldElement.title = this.isSignerMode
        ? isReadOnly
          ? `${fieldLabel} (Prefilled - Read Only)`
          : clickToFillText
        : `${fieldLabel} field${recipientName ? ` - ${recipientName}` : ''} - Page ${field.pageNumber}`;

      if (field.type === 'checkbox' || field.type === 'radio' || field.type === 'attachment') {
        this.buildInteractiveFieldContent(field, fieldElement, fieldValue);
      } else if (this.isSignerMode) {
        const value = fieldValue; // Use the already auto-populated fieldValue
        const isEmpty = !value || value.trim() === '';
        const isPrefilled = !field.recipientId; // recipientId is null for prefilled fields
        const isReadOnly = isPrefilled && !isEmpty; // Prefilled fields with values are read-only

        if (field.type === 'signature' || field.type === 'initial') {
          if (value) {
            const img = document.createElement('img');
            img.src = this.getSignatureImageUrl(field.id || '');
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'contain';
            img.style.borderRadius = '4px';
            fieldElement.appendChild(img);

            // Make cursor default for read-only prefilled fields
            if (isReadOnly) {
              fieldElement.style.cursor = 'default';
            }
          } else {
            const placeholder = this.createFieldPlaceholder(field);
            fieldElement.appendChild(placeholder);
          }
        } else {
          // For text inputs, show placeholder when empty, input/text when filled
          if (isEmpty) {
            const placeholder = this.createFieldPlaceholder(field);
            fieldElement.appendChild(placeholder);
          } else {
            if (isReadOnly) {
              // Display as read-only text for prefilled fields
              const textDisplay = document.createElement('div');
              textDisplay.textContent = value || '';
              textDisplay.style.width = '100%';
              textDisplay.style.height = '100%';
              textDisplay.style.display = 'flex';
              textDisplay.style.alignItems = 'center';
              textDisplay.style.justifyContent = 'center';
              textDisplay.style.fontSize = '12px';
              textDisplay.style.fontWeight = '500';
              textDisplay.style.color = 'var(--main-text-color)';
              textDisplay.style.padding = '4px';
              textDisplay.style.textAlign = 'center';
              textDisplay.style.userSelect = 'none';
              fieldElement.appendChild(textDisplay);
              fieldElement.style.cursor = 'default';
            } else {
              // Editable input for recipient's own fields
              const input = this.createInlineInput(field, value || '');
              fieldElement.appendChild(input);
              fieldElement.style.cursor = 'text';
            }
          }
        }
      } else {
        // Sender mode - show values for prefilled fields, placeholders for recipient fields
        // Don't auto-populate sign_date in sender mode - only when actually signing
        const value = this.fieldValues.get(field.id || '');
        const isPrefilled = this.isPrefillField(field);
        const hasValue = value && value.trim() !== '';

        if (isPrefilled && hasValue) {
          // Show the actual value for prefilled fields
          if (field.type === 'signature' || field.type === 'initial') {
            // Display signature/initials image
            const img = document.createElement('img');
            img.src = this.getSignatureImageUrl(field.id || '');
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'contain';
            img.style.borderRadius = '4px';
            img.style.pointerEvents = 'none';
            fieldElement.appendChild(img);
          } else {
            // Display text value
            const textDisplay = document.createElement('div');
            textDisplay.textContent = value;
            textDisplay.style.width = '100%';
            textDisplay.style.height = '100%';
            textDisplay.style.display = 'flex';
            textDisplay.style.alignItems = 'center';
            textDisplay.style.justifyContent = 'center';
            textDisplay.style.fontSize = '12px';
            textDisplay.style.fontWeight = '500';
            textDisplay.style.color = 'var(--main-text-color)';
            textDisplay.style.padding = '4px';
            textDisplay.style.textAlign = 'center';
            textDisplay.style.pointerEvents = 'none';
            fieldElement.appendChild(textDisplay);
          }
        } else {
          // Show placeholder for empty fields or recipient fields
          const placeholder = this.createFieldPlaceholder(field);
          fieldElement.appendChild(placeholder);
        }
      }

      if (!this.isSignerMode) {
        const deleteBtn = document.createElement('button');
        deleteBtn.style.position = 'absolute';
        deleteBtn.style.top = '-26px';
        deleteBtn.style.right = '-10px';
        deleteBtn.style.width = '20px';
        deleteBtn.style.height = '20px';
        deleteBtn.style.backgroundColor = 'rgba(239, 68, 68, 1)';
        deleteBtn.style.borderRadius = '50%';
        deleteBtn.style.display = 'flex';
        deleteBtn.style.alignItems = 'center';
        deleteBtn.style.justifyContent = 'center';
        deleteBtn.style.border = 'none';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.zIndex = '30';
        deleteBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        deleteBtn.title = 'Delete field';

        const deleteIcon = document.createElement('i');
        deleteIcon.className = 'fas fa-xmark';
        deleteIcon.style.fontSize = '10px';
        deleteIcon.style.color = 'white';
        deleteBtn.appendChild(deleteIcon);

        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.removeField(field.id || '');
        });

        deleteBtn.addEventListener('mousedown', (e) => {
          e.stopPropagation();
        });

        fieldElement.appendChild(deleteBtn);

        // Add resize handles
        this.addResizeHandles(fieldElement, field);
      }

      fieldElement.addEventListener('mousedown', (e) => {
        if (!this.isSignerMode && !this.resizingField) {
          // Check if the click is on a resize handle
          const target = e.target as HTMLElement;
          if (target.style.cursor && target.style.cursor.includes('resize')) {
            return; // Let the resize handle handle it
          }
          e.preventDefault();
          e.stopPropagation();
          this.hasDragged = false;
          this.draggingField = { ...field };
          this.draggingFieldElement = fieldElement;
          fieldElement.style.transition = 'none';

          // Capture offset between cursor and field's top-left corner so the
          // field doesn't jump when the user starts moving it.
          const clickCoords = this.screenToPdfPoints(e.clientX, e.clientY);
          if (clickCoords) {
            this.dragOffsetX = clickCoords.x - field.x;
            this.dragOffsetY = clickCoords.y - field.y;
          } else {
            this.dragOffsetX = 0;
            this.dragOffsetY = 0;
          }

          this.cdr.markForCheck();
          this.cdr.detectChanges();
        }
      });

      fieldElement.addEventListener('click', (e) => {
        if (!this.isSignerMode) {
          e.stopPropagation();
          if (!this.hasDragged && field.id) {
            // Recipient fields: open settings panel in right sidebar
            if (this.isRecipientField(field)) {
              this.selectedField = { ...field };
              if (!this.selectedField.fieldName) {
                this.selectedField.fieldName = this.getFieldTypeLabel(field.type);
              }
              this.editingGroupName = field.groupName ?? null;
              if (field.type === 'checkbox' || field.type === 'radio') {
                this.openAddMorePopover(field);
              }
              this.renderFieldsIntoOverlays();
              this.cdr.detectChanges();
              return;
            }
            // Prefilled fields: Allow direct editing like signer mode
            if (this.isPrefillField(field)) {
              if (field.type === 'signature' || field.type === 'initial') {
                // Always open modal for signature/initials (to add or replace)
                this.openFieldInputModalForPrefill(field.id);
              } else {
                // checkbox/radio show add-more popover; attachment has no popover
                if (field.type === 'checkbox' || field.type === 'radio') {
                  this.openAddMorePopover(field);
                  return;
                }
                if (field.type === 'attachment') return;
                // For text fields, replace current content with editable input
                const existingInput = document.getElementById(`field-input-${field.id}`) as HTMLInputElement;
                if (existingInput) {
                  existingInput.focus();
                } else {
                  // Replace current content (placeholder or value) with input
                  const value = this.fieldValues.get(field.id || '') || '';
                  const input = this.createInlineInputForPrefill(field, value);

                  // Store delete button and resize handles temporarily
                  const deleteBtn = fieldElement.querySelector('button') as HTMLElement;
                  const resizeHandles = Array.from(fieldElement.querySelectorAll('div[style*="resize"]') as NodeListOf<HTMLElement>);

                  // Remove all children
                  fieldElement.innerHTML = '';

                  // Add input first
                  fieldElement.appendChild(input);

                  // Re-add delete button and resize handles
                  if (deleteBtn) fieldElement.appendChild(deleteBtn);
                  resizeHandles.forEach(handle => fieldElement.appendChild(handle));

                  fieldElement.style.cursor = 'text';
                  setTimeout(() => input.focus(), 0);
                }
              }
            }
          }
        } else {
          // Signer mode - check if field is read-only (prefilled with value)
          const value = this.fieldValues.get(field.id || '');
          const isPrefilled = !field.recipientId;
          const isReadOnly = isPrefilled && value && value.trim() !== '';

          if (isReadOnly) {
            // Prefilled attachment — open the file URL on click
            if (field.type === 'attachment' && value) {
              window.open(value, '_blank');
            }
            e.stopPropagation();
            return;
          }

          // checkbox/radio/attachment interact via their own rendered input elements
          if (field.type === 'checkbox' || field.type === 'radio' || field.type === 'attachment') {
            e.stopPropagation();
            return;
          }

          // Allow editing for recipient's own fields
          if (field.type === 'signature' || field.type === 'initial') {
            this.onFieldClick(e as any, field.id || '');
          } else {
            // For text fields, if placeholder is shown, create input; otherwise focus existing input
            const existingInput = document.getElementById(`field-input-${field.id}`) as HTMLInputElement;
            if (existingInput) {
              existingInput.focus();
            } else {
              // Replace placeholder with input (use prefilled value if available)
              const input = this.createInlineInput(field, value || '');
              fieldElement.innerHTML = '';
              fieldElement.appendChild(input);
              fieldElement.style.cursor = 'text';
              setTimeout(() => input.focus(), 0);
            }
          }
        }
      });

      // Right-click context menu (only in non-signer mode)
      fieldElement.addEventListener('contextmenu', (e) => {
        this.onFieldContextMenu(e, field);
      });

      page.overlay.appendChild(fieldElement);

      // Inject "+" button below checkbox/radio when it's the active addMoreTarget (editor mode only)
      if (!this.isSignerMode && this.addMoreTarget?.field.id === field.id &&
          (field.type === 'checkbox' || field.type === 'radio')) {
        const plusBtn = document.createElement('button');
        plusBtn.setAttribute('data-add-more-btn', 'true');
        plusBtn.style.position = 'absolute';
        plusBtn.style.left = `${screenCoords.x + screenCoords.width / 2 - 12}px`;
        plusBtn.style.top = `${screenCoords.y + screenCoords.height + 4}px`;
        plusBtn.style.width = '24px';
        plusBtn.style.height = '24px';
        plusBtn.style.borderRadius = '50%';
        plusBtn.style.backgroundColor = '#10B981';
        plusBtn.style.color = 'white';
        plusBtn.style.border = 'none';
        plusBtn.style.cursor = 'pointer';
        plusBtn.style.display = 'flex';
        plusBtn.style.alignItems = 'center';
        plusBtn.style.justifyContent = 'center';
        plusBtn.style.zIndex = '200';
        plusBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        plusBtn.style.pointerEvents = 'auto';
        plusBtn.innerHTML = '<span style="font-size:16px;line-height:1;pointer-events:none">+</span>';
        plusBtn.title = `Add another ${field.type}`;
        plusBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.addSignatureField(
            Number(field.x) + Number(field.width) / 2,
            Number(field.y) + Number(field.height) + 5,
            field.type,
            field.pageNumber,
            field.groupName
          );
          this.addMoreTarget = null;
          this.renderFieldsIntoOverlays();
        });
        page.overlay.appendChild(plusBtn);
      }
    });

    this.pdfPages.forEach((page) => {
      if (page.overlay) {
        page.overlay.style.pointerEvents =
          this.isSignerMode || this.isDragOver || this.draggingField !== null || this.resizingField !== null
            ? 'auto' : 'none';
      }
    });
  }

  /**
   * Convert screen coordinates to PDF points
   */
  screenToPdfPoints(
    clientX: number,
    clientY: number
  ): { x: number; y: number; pageNumber: number } | null {
    const container = this.pdfPagesContainer?.nativeElement;
    if (!container) return null;

    const rect = container.getBoundingClientRect();
    const absoluteY = clientY - rect.top;

    let targetPage: IPdfPage | null = null;
    for (let i = this.pdfPages.length - 1; i >= 0; i--) {
      const page = this.pdfPages[i];
      if (
        absoluteY >= page.offsetY &&
        absoluteY <= page.offsetY + page.height
      ) {
        targetPage = page;
        break;
      }
    }

    if (!targetPage || !targetPage.overlay) return null;

    const overlayRect = targetPage.overlay.getBoundingClientRect();

    // Get coordinates relative to overlay in pixels
    const pixelX = clientX - overlayRect.left;
    const pixelY = clientY - overlayRect.top;

    // Convert pixels to PDF points using viewport scale
    const pdfX = pixelX / targetPage.viewportScale;
    const pdfY = pixelY / targetPage.viewportScale;

    return {
      x: Math.max(0, Math.min(pdfX, targetPage.pdfWidth)),
      y: Math.max(0, Math.min(pdfY, targetPage.pdfHeight)),
      pageNumber: targetPage.pageNumber
    };
  }

  /**
   * Convert PDF points to screen pixels for a given page
   */
  pdfPointsToScreen(field: ISignatureField): { x: number; y: number; width: number; height: number } {
    const page = this.pdfPages.find((p) => p.pageNumber === field.pageNumber);
    if (!page) {
      // Fallback if page not found
      return {
        x: field.x * this.zoom,
        y: field.y * this.zoom,
        width: field.width * this.zoom,
        height: field.height * this.zoom
      };
    }

    // Convert PDF points to screen pixels using viewport scale
    return {
      x: field.x * page.viewportScale,
      y: field.y * page.viewportScale,
      width: field.width * page.viewportScale,
      height: field.height * page.viewportScale
    };
  }


  // ── Field settings panel ───────────────────────────────────────────────

  getSettingsPanelTitle(): string {
    if (!this.selectedField) return '';
    const titles: Record<FieldType, string> = {
      signature: 'Signature', initial: 'Initials', name: 'Full Name',
      sign_date: 'Sign Date', company: 'Company', title: 'Job Title',
      date: 'Date', text: 'Textfield', email: 'Email',
      checkbox: 'Checkbox', radio: 'Radio', attachment: 'Attachment'
    };
    return titles[this.selectedField.type] || 'Field Settings';
  }

  isTextTypeField(): boolean {
    if (!this.selectedField) return false;
    return ['text', 'name', 'email', 'company', 'title'].includes(this.selectedField.type);
  }

  /** Returns the number of checkboxes in the selected field's group. */
  getCheckboxGroupSize(): number {
    if (!this.selectedField?.groupName) return 1;
    return this.signatureFields.filter(
      f => f.type === 'checkbox' && f.groupName === this.selectedField!.groupName
    ).length;
  }

  getCheckboxGroupValidationError(): string {
    const groupSize = this.getCheckboxGroupSize();
    const min = this.selectedField?.minRequired;
    const max = this.selectedField?.maxRequired;
    if(min !== undefined && min > 0 && max !== undefined && max > 0 && max < min) {
      return `Max value must be greater than min value`;
    }
    if (min != null && min > 0 && min > groupSize) {
      return `Group has only ${groupSize} checkbox${groupSize !== 1 ? 'es' : ''}. Add more to set min ${min} validation.`;
    }
    if (max != null && max > 0 && max > groupSize) {
      return `Group has only ${groupSize} checkbox${groupSize !== 1 ? 'es' : ''}. Add more to set max ${max} validation.`;
    }
    return '';
  }

  onFieldSettingChange(): void {
    this.fieldSettingsChanged$.next();
    this.cdr.detectChanges();
  }

  onFieldSettingsAutoSave(): void {
    if (!this.selectedField?.id) return;
    // Don't persist invalid min/max values that exceed the group size
    if (this.getCheckboxGroupValidationError()) return;
    const updated = { ...this.selectedField };
    const idx = this.signatureFields.findIndex(f => f.id === updated.id);
    if (idx !== -1) { this.signatureFields[idx] = updated; }

    // When a checkbox group has min/max validation, `required` on individual fields
    // is contradictory — auto-clear it so there's only one source of truth.
    if (updated.type === 'checkbox' && updated.groupName && (updated.minRequired || updated.maxRequired) && updated.required) {
      updated.required = false;
      if (idx !== -1) { this.signatureFields[idx] = updated; }
    }

    const isGroupField = updated.type === 'checkbox' || updated.type === 'radio';
    const oldName = this.editingGroupName;
    const newName = updated.groupName?.trim() || null;

    // Propagate settings to all siblings in the same group in one pass.
    // Covers: group rename, required, recipientId, label, fieldName,
    // and min/maxRequired for checkbox groups.
    if (isGroupField && (oldName || newName)) {
      const siblingGroupName = (oldName && oldName !== newName) ? oldName : newName;
      this.signatureFields
        .filter(f => f.groupName === siblingGroupName && f.id !== updated.id)
        .forEach(f => {
          if (oldName && oldName !== newName) {
            f.groupName = newName ?? undefined;
          }
          // `required` is NOT propagated for checkboxes — each field owns it independently.
          // For radio groups, required is a group-level concept so propagation is kept.
          if (updated.type === 'radio') { f.required = updated.required; }
          f.recipientId = updated.recipientId;
          f.label       = updated.label;
          f.fieldName   = updated.fieldName;
          f.fixedWidth  = updated.fixedWidth;
          f.fixedHeight = updated.fixedHeight;
          if (updated.type === 'checkbox') {
            f.minRequired = updated.minRequired;
            f.maxRequired = updated.maxRequired;
            // Mirror the min/max → clear required rule on every sibling
            if (updated.minRequired || updated.maxRequired) { f.required = false; }
          }
          this.saveFieldPosition(f);
        });
    }
    this.editingGroupName = newName;

    // Sync defaultValue into fieldValues for text-type fields (signer pre-population)
    const textTypes: FieldType[] = ['text', 'name', 'company', 'title', 'email', 'date'];
    if (updated.id && textTypes.includes(updated.type) && updated.defaultValue) {
      this.fieldValues.set(updated.id, updated.defaultValue);
    }

    this.saveFieldPosition(updated, true);
    this.renderFieldsIntoOverlays();
  }

  getAssignableRecipients(): IRecipient[] {
    return this.recipients.filter(r => r.role !== 'receives_copy' && r.id > 0);
  }

  onFieldSettingsClose(): void {
    this.selectedField = null;
    this.editingGroupName = null;
    this.renderFieldsIntoOverlays();
    this.cdr.detectChanges();
  }

  onFieldSettingsDelete(): void {
    if (!this.selectedField?.id) return;
    this.removeField(this.selectedField.id);
    this.selectedField = null;
    this.editingGroupName = null;
    this.cdr.detectChanges();
  }

  onFieldClick(event: MouseEvent, fieldId: string): void {
    if (this.isSignerMode) {
      event.stopPropagation();
      const field = this.signatureFields.find(f => f.id === fieldId);
      if (field && (field.type === 'signature' || field.type === 'initial')) {
        this.openFieldInputModal(fieldId);
      }
    } else {
      if (!this.hasDragged) {
        this.removeField(fieldId);
      }
    }
  }

  getSignatureImageUrl(fieldId: string): string {
    const value = this.fieldValues.get(fieldId);
    if (!value) return '';

    if (value.startsWith('data:')) {
      return value;
    }

    return `data:image/png;base64,${value}`;
  }

  openFieldInputModal(fieldId: string): void {
    const field = this.signatureFields.find((f) => f.id === fieldId);
    if (!field) return;

    // Pass prefilled initials if opening an initials field and initials are stored
    const modalData: IFieldInputModalData = {
      field: field,
      fieldType: field.type,
      ...(field.type === 'initial' && this.storedInitials ? { prefilledInitials: this.storedInitials } : {})
    };

    const dialogRef = this.dialog.open(FieldInputModalComponent, {
      width: '700px',
      maxWidth: '90vw',
      data: modalData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(
      (
        result: {
          fieldId: string;
          value: string;
          type: FieldType;
          extractedInitials?: string;
          selectedSignatureStyle?: 'cursive' | 'standard' | 'bold';
        } | null
      ) => {
        if (result) {
          this.fieldValues.set(result.fieldId, result.value);
          
          // Store signature style when a signature field is saved
          if (result.type === 'signature' && result.selectedSignatureStyle) {
            this.storedSignatureStyle = result.selectedSignatureStyle;
          }
          
          // Store initials when a signature field is saved (extracted from signature text)
          if (result.type === 'signature' && result.extractedInitials) {
            this.storedInitials = result.extractedInitials;
            // Auto-populate any existing empty initials fields
            this.autoPopulateInitialsFields();
          }
          
          // Extract and store initials when a name field is saved
          if (result.type === 'name' && result.value.trim()) {
            const extractedInitials = this.extractInitials(result.value);
            if (extractedInitials) {
              this.storedInitials = extractedInitials;
              // Auto-populate any existing empty initials fields
              this.autoPopulateInitialsFields();
            }
          }
          
          this.cdr.detectChanges();
          this.renderFieldsIntoOverlays();
        }
      }
    );
  }

  openFieldInputModalForPrefill(fieldId: string): void {
    const field = this.signatureFields.find((f) => f.id === fieldId);
    if (!field) return;

    // Pass prefilled initials if opening an initials field and initials are stored
    const modalData: IFieldInputModalData = {
      field,
      fieldType: field.type,
      ...(field.type === 'initial' && this.storedInitials ? { prefilledInitials: this.storedInitials } : {})
    };

    const dialogRef = this.dialog.open(FieldInputModalComponent, {
      width: '700px',
      maxWidth: '90vw',
      data: modalData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(
      (
        result: {
          fieldId: string;
          value: string;
          type: FieldType;
          extractedInitials?: string;
          selectedSignatureStyle?: 'cursive' | 'standard' | 'bold';
        } | null
      ) => {
        if (result) {
          // Store signature style when a signature field is saved
          if (result.type === 'signature' && result.selectedSignatureStyle) {
            this.storedSignatureStyle = result.selectedSignatureStyle;
          }
          
          // Store initials when a signature field is saved (extracted from signature text)
          if (result.type === 'signature' && result.extractedInitials) {
            this.storedInitials = result.extractedInitials;
            // Auto-populate any existing empty initials fields
            this.autoPopulateInitialsFields();
          }
          
          // Extract and store initials when a name field is saved
          if (result.type === 'name' && result.value.trim()) {
            const extractedInitials = this.extractInitials(result.value);
            if (extractedInitials) {
              this.storedInitials = extractedInitials;
              // Auto-populate any existing empty initials fields
              this.autoPopulateInitialsFields();
            }
          }
          
          // Save the field value using the new method with recipient_id: 0
          this.saveFieldValue(result.fieldId, result.value);
        }
      }
    );
  }

  saveFieldValue(fieldId: string, value: string, filename?: string): void {
    const field = this.signatureFields.find((f) => f.id === fieldId);
    if (!field) return;

    // Save value locally
    this.fieldValues.set(fieldId, value);
    if (filename) {
      this.fieldValues.set(fieldId + '-filename', filename);
    }

    // Extract and store initials when a name field is saved
    if (field.type === 'name' && value.trim()) {
      const extractedInitials = this.extractInitials(value);
      if (extractedInitials) {
        this.storedInitials = extractedInitials;
        // Auto-populate any existing empty initials fields
        this.autoPopulateInitialsFields();
      }
    }

    // Save to backend using dedicated saveFieldValue API with recipient_id: null
    this.zilSignService
      .saveFieldValue(this.documentId, fieldId, field.type, value, null, filename)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Re-render fields to show the updated value (especially important in sender mode)
            this.renderFieldsIntoOverlays();
            this.cdr.detectChanges();
          }
        },
        error: () => {
          // Remove from local storage if API fails
          this.fieldValues.delete(fieldId);
          if (filename) {
            this.fieldValues.delete(fieldId + '-filename');
          }
        }
      });
  }

  submitAllFields(): void {
    if (!this.signerToken || !this.documentId) return;

    const recipientFields = this.signatureFields.filter(
      (f) => f.recipientId === this.currentRecipientId
    );

    if (recipientFields.length === 0) {
      this.alertService.failedAlert({
        content: 'No fields assigned to this recipient',
        title: 'Validation Error'
      });
      return;
    }

    // Auto-populate sign_date fields with current date if not already filled
    recipientFields.forEach((field) => {
      if (field.type === 'sign_date') {
        const existingValue = this.fieldValues.get(field.id || '');
        if (!existingValue || existingValue.trim() === '') {
          const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
          this.fieldValues.set(field.id || '', currentDate);
        }
      }
    });

    // Checkbox group validation — enforce minRequired per group
    const checkboxGroupErrors: string[] = [];
    const checkboxGroupMap = new Map<string, ISignatureField[]>();

    recipientFields
      .filter(f => f.type === 'checkbox' && !!f.groupName)
      .forEach(f => {
        const key = f.groupName!;
        if (!checkboxGroupMap.has(key)) checkboxGroupMap.set(key, []);
        checkboxGroupMap.get(key)!.push(f);
      });

    // Sort groups by page then Y position so ordinal numbers match visual order
    const sortedGroupEntries = [...checkboxGroupMap.entries()].sort(([, a], [, b]) => {
      const aFirst = [...a].sort((x, y) => x.pageNumber - y.pageNumber || x.y - y.y)[0];
      const bFirst = [...b].sort((x, y) => x.pageNumber - y.pageNumber || x.y - y.y)[0];
      return aFirst.pageNumber - bFirst.pageNumber || aFirst.y - bFirst.y;
    });

    this.failingGroupNames.clear();
    let firstFailingField: ISignatureField | null = null;

    sortedGroupEntries.forEach(([groupName, fields], index) => {
      // Find a representative that has any validation configured (min or max)
      const representative = fields.find(f => f.minRequired !== undefined || f.maxRequired !== undefined);
      if (!representative) return; // no validation configured for this group

      const min = representative.minRequired;
      const max = representative.maxRequired;

      // Skip if neither min nor max has a meaningful (>0) value
      const hasMin = min !== undefined && min > 0;
      const hasMax = max !== undefined && max > 0;
      if (!hasMin && !hasMax) return;

      const checkedCount = fields.filter(f => this.fieldValues.get(f.id || '') === 'true').length;
      const belowMin = hasMin && checkedCount < min!;
      const aboveMax = hasMax && checkedCount > max!;

      if (belowMin || aboveMax) {
        this.failingGroupNames.add(groupName);

        // Human-readable group label: prefer fieldName > label > ordinal
        const displayName =
          representative.fieldName?.trim() ||
          representative.label?.trim() ||
          `Checkbox group ${index + 1}`;

        // Page reference from the topmost field in the group
        const topField = [...fields].sort((a, b) =>
          a.pageNumber - b.pageNumber || a.y - b.y
        )[0];
        const pageRef = `Page ${topField.pageNumber}`;
        const total = fields.length;

        let requirementText: string;
        let pluralRef: number;
        if (hasMin && hasMax && min !== max) {
          requirementText = `between ${min} and ${max}`;
          pluralRef = min!;
        } else if (aboveMax) {
          requirementText = `at most ${max}`;
          pluralRef = max!;
        } else {
          requirementText = `at least ${min}`;
          pluralRef = min!;
        }

        checkboxGroupErrors.push(
          `• "${displayName}" (${pageRef}): Select ${requirementText} option${pluralRef > 1 ? 's' : ''} — ${checkedCount} of ${total} selected`
        );

        if (!firstFailingField) firstFailingField = topField;
      }
    });

    if (checkboxGroupErrors.length > 0) {
      const intro = checkboxGroupErrors.length === 1
        ? 'Please fix the following before submitting:'
        : `Please fix the following ${checkboxGroupErrors.length} groups before submitting:`;
      this.alertService.failedAlert({
        content: `${intro}\n\n${checkboxGroupErrors.join('\n')}`,
        title: 'Selection Required'
      });
      this.renderFieldsIntoOverlays(); // show orange outlines on failing groups
      if (firstFailingField) this.scrollToPage((firstFailingField as ISignatureField).pageNumber);
      return;
    }

    // ── Required radio-group validation ──────────────────────────────────────
    // For a grouped radio, the group is satisfied when ANY one member is selected.
    // Compute which required radio groups already have a selection so we can
    // exclude all their members from the individual unfilled-field check below.
    const satisfiedRadioGroups = new Set<string>();
    const requiredRadioGroups = new Map<string, ISignatureField[]>();

    recipientFields
      .filter(f => f.type === 'radio' && f.required && !!f.groupName)
      .forEach(f => {
        const key = f.groupName!;
        if (!requiredRadioGroups.has(key)) requiredRadioGroups.set(key, []);
        requiredRadioGroups.get(key)!.push(f);
      });

    requiredRadioGroups.forEach((fields, groupName) => {
      const hasSelection = fields.some(f => this.fieldValues.get(f.id || '') === 'true');
      if (hasSelection) satisfiedRadioGroups.add(groupName);
    });

    // ── Collect unfilled required fields ─────────────────────────────────────
    // For grouped radio buttons we include only ONE representative per unsatisfied
    // group so the error message lists the group once, not every individual button.
    const seenUnsatisfiedRadioGroups = new Set<string>();

    const unfilledFields = recipientFields.filter((field) => {
      if (field.type === 'sign_date') return false;
      if (!field.required) return false;

      if (field.type === 'radio' && field.groupName) {
        // Group already has a selection → whole group passes
        if (satisfiedRadioGroups.has(field.groupName)) return false;
        // Group has no selection → include only the first member as representative
        if (seenUnsatisfiedRadioGroups.has(field.groupName)) return false;
        seenUnsatisfiedRadioGroups.add(field.groupName);
        return true;
      }

      const value = this.fieldValues.get(field.id || '');
      if (field.type === 'checkbox' || field.type === 'radio') {
        return value !== 'true';
      }
      return !value || value.trim() === '';
    });

    if (unfilledFields.length > 0) {
      const fieldNames = unfilledFields
        .map((field) => {
          // For a grouped radio show a group-level label, not the raw field type
          if (field.type === 'radio' && field.groupName) {
            const displayName =
              field.fieldName?.trim() || field.label?.trim() || 'Radio group';
            return `"${displayName}" (Page ${field.pageNumber}): select one option`;
          }
          return `${this.getFieldTypeLabel(field.type)} (Page ${field.pageNumber})`;
        })
        .join(', ');

      this.alertService.failedAlert({
        content: `Please fill all required fields: ${fieldNames}`,
        title: 'Validation Error'
      });

      this.scrollToPage(unfilledFields[0].pageNumber);
      return;
    }

    const fields: IFieldValue[] = recipientFields.map((field) => {
      const value = this.fieldValues.get(field.id || '');
      const entry: IFieldValue = {
        fieldId: field.id || '',
        value: value || '',
        type: field.type
      };
      if (field.type === 'attachment') {
        const filename = this.fieldValues.get((field.id || '') + '-filename');
        if (filename) {
          entry.filename = filename;
        }
      }
      return entry;
    });

    // Submission-time attachment size guard (defense-in-depth)
    const oversizedAttachment = recipientFields.find(f => {
      if (f.type !== 'attachment' || !f.maxFileSizeMB) return false;
      const b64 = this.fieldValues.get(f.id || '') || '';
      const bytes = Math.ceil((b64.split(',')[1]?.length ?? b64.length) * 3 / 4);
      return bytes > f.maxFileSizeMB * 1024 * 1024;
    });
    if (oversizedAttachment) {
      const filename = this.fieldValues.get((oversizedAttachment.id || '') + '-filename') || 'attachment';
      this.alertService.failedAlert({ title: 'Attachment Too Large', content: `"${filename}" exceeds the ${oversizedAttachment.maxFileSizeMB} MB limit — please upload a smaller file` });
      return;
    }

    this.loadingSubmit = true;
    this.zilSignService
      .submitFieldValuesOutside(this.documentId, this.signerToken, fields)
      .pipe(
        take(1),
        finalize(() => {
          this.loadingSubmit = false;
        })
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.router.navigate(['/outside/zil-sign/success'], {
              queryParams: {
                token: this.signerToken,
                documentId: this.documentId
              }
            });
          } else {
            this.alertService.failedAlert({
              content: 'Failed to submit signature',
              title: 'Error'
            });
          }
        },
      });
  }

  selectField(field: ISignatureField): void {
    this.selectedField = field;
    if (!this.selectedField.fieldName) {
      this.selectedField.fieldName = this.getFieldTypeLabel(field.type);
    }
    this.editingGroupName = field.groupName ?? null;
    this.showFieldInspector = true;
    this.cdr.detectChanges();
  }

  closeFieldInspector(): void {
    this.showFieldInspector = false;
    this.selectedField = null;
    this.editingGroupName = null;
    this.cdr.detectChanges();
  }

  updateFieldFromInspector(updates: Partial<ISignatureField>): void {
    if (!this.selectedField?.id) return;

    const fieldIndex = this.signatureFields.findIndex(
      (f) => f.id === this.selectedField?.id
    );
    if (fieldIndex !== -1) {
      this.signatureFields[fieldIndex] = {
        ...this.signatureFields[fieldIndex],
        ...updates
      };
      this.selectedField = { ...this.selectedField, ...updates };

      this.saveFieldPosition(this.signatureFields[fieldIndex]);
      this.renderFieldsIntoOverlays();
      this.cdr.detectChanges();
    }
  }

  addSignatureField(pdfX: number, pdfY: number, type: FieldType, pageNumber: number, groupName?: string): void {
    // Auto-select recipient if none is selected
    if (!this.selectedRecipientId && !this.isSignerMode) {
      this.autoSelectRecipient();
    }

    // Default field size in PDF points
    let defaultWidthPdf = 105;
    let defaultHeightPdf = 25;
    if (type === 'checkbox' || type === 'radio') {
      defaultWidthPdf = 20;
      defaultHeightPdf = 20;
    }

    // If selectedRecipientId is -1 (Prefill by you), set recipientId to 0
    const recipientId = this.selectedRecipientId === -1 ? null : (this.selectedRecipientId || undefined);

    // When adding to an existing group via the "+" button, inherit group-level settings
    // from a sibling so the new field is consistent with the rest of the group.
    const sibling = groupName
      ? this.signatureFields.find(f => f.type === type && f.groupName === groupName)
      : undefined;
    const inheritedGroupSettings = sibling ? {
      required: sibling.required,
      minRequired: sibling.minRequired,
      maxRequired: sibling.maxRequired,
      fixedWidth: sibling.fixedWidth,
      fixedHeight: sibling.fixedHeight,
    } : {};

    const fieldData = {
      type,
      x: Math.max(0, pdfX - defaultWidthPdf / 2),
      y: Math.max(0, pdfY - defaultHeightPdf / 2),
      width: defaultWidthPdf,
      height: defaultHeightPdf,
      pageNumber: pageNumber,
      recipientId: recipientId,
      ...(groupName ? { groupName } : {}),
      ...inheritedGroupSettings
    };

    this.zilSignService
      .createField(this.documentId, {
        documentId: this.documentId,
        ...fieldData
      })
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const newField: ISignatureField = {
              id: response.data.id,
              ...fieldData
            };

            // Radio fields must always have an explicit groupName so that separate
            // radio groups on the same page/recipient don't share the same HTML
            // `name` attribute (which would cause the browser to treat them as one
            // group and deselect across groups when signing).
            // Checkbox fields also get an auto-generated groupName on drop so that
            // the "+" button can propagate the same group to subsequent additions,
            // and so min/max validation inputs become available once a second
            // checkbox is added to the group.
            // If no groupName was supplied (standalone drop, not via "+" button),
            // auto-generate one from the server-assigned id and persist it immediately.
            if (type === 'radio' && !newField.groupName && newField.id) {
              newField.groupName = `radio-group-${newField.id}`;
              this.saveFieldPosition(newField);
            } else if (type === 'checkbox' && !newField.groupName && newField.id) {
              newField.groupName = `checkbox-group-${newField.id}`;
              this.saveFieldPosition(newField);
            } else if (sibling && newField.id) {
              // Persist inherited group settings to backend (create endpoint may not store them)
              this.saveFieldPosition(newField);
            }

            this.signatureFields = [...this.signatureFields, newField];
            this.currentPage = pageNumber;

            if(type === 'initial' && this.storedInitials) {
              this.autoPopulateInitialsFields();
            }
            // Keep recipient selected for next field
            this.cdr.detectChanges();
            this.renderFieldsIntoOverlays();
          }
        }
      });
  }

  removeField(fieldId: string): void {
    if (!fieldId) return;

    this.signatureFields = this.signatureFields.filter((f) => f.id !== fieldId);
    if (this.selectedField?.id === fieldId) {
      this.selectedField = null;
      this.editingGroupName = null;
    }
    this.cdr.detectChanges();
    this.renderFieldsIntoOverlays();
    this.zilSignService
      .deleteField(this.documentId, fieldId)
      .pipe(take(1))
      .subscribe({
        next: () => {
        }
      });
  }

  // Context menu methods
  onFieldContextMenu(event: MouseEvent, field: ISignatureField): void {
    if (this.isSignerMode) return; // No context menu in signer mode

    event.preventDefault();
    event.stopPropagation();

    this.contextMenuX = event.clientX;
    this.contextMenuY = event.clientY;
    this.contextMenuFieldId = field.id || '';
    this.showContextMenu = true;
    this.cdr.detectChanges();
  }

  onCloseContextMenu(): void {
    this.showContextMenu = false;
    this.contextMenuFieldId = '';
    this.cdr.detectChanges();
  }

  openAddMorePopover(field: ISignatureField): void {
    let anchorField = field;

    // For grouped fields, anchor the "+" below the bottom-most field in the group on this page
    if (field.groupName) {
      const groupFields = this.signatureFields.filter(
        f => (f.type === 'checkbox' || f.type === 'radio') &&
             f.groupName === field.groupName &&
             f.pageNumber === field.pageNumber
      );
      if (groupFields.length > 0) {
        anchorField = groupFields.reduce((prev, curr) =>
          Number(curr.y) + Number(curr.height) > Number(prev.y) + Number(prev.height) ? curr : prev
        );
      }
    }

    this.addMoreTarget = { field: anchorField };
    this.renderFieldsIntoOverlays();
    this.cdr.detectChanges();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.addMoreTarget) return;
    const target = event.target as HTMLElement;
    if (!target.closest('[data-add-more-btn]')) {
      this.addMoreTarget = null;
      this.renderFieldsIntoOverlays();
      this.cdr.detectChanges();
    }
  }

  onContextMenuAction(action: ContextMenuAction): void {
    switch (action.action) {
      case 'delete':
        this.removeField(action.fieldId);
        break;
      case 'placeOnOtherPages':
        this.openPlaceFieldModal(action.fieldId);
        break;
      default:
        break;
    }
  }

  openPlaceFieldModal(fieldId: string): void {
    const field = this.signatureFields.find(f => f.id === fieldId);
    if (!field) return;

    const dialogRef = this.dialog.open(PlaceFieldModalComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: {
        fieldId: fieldId,
        currentPage: field.pageNumber,
        totalPages: this.totalPages
      } as IPlaceFieldModalData,
      disableClose: false
    });

    dialogRef.afterClosed().subscribe((result: IPlaceFieldModalResult | null) => {
      if (result) {
        this.placeFieldOnPages(field, result.fromPage, result.toPage);
      }
    });
  }

  placeFieldOnPages(sourceField: ISignatureField, fromPage: number, toPage: number): void {
    // Determine pages to create fields on (excluding the source page)
    const pagesToCreate: number[] = [];
    for (let pageNum = fromPage; pageNum <= toPage; pageNum++) {
      // Skip the page where the source field already exists
      if (pageNum === sourceField.pageNumber) continue;
      pagesToCreate.push(pageNum);
    }

    if (pagesToCreate.length === 0) {
      this.alertService.failedAlert({
        content: 'No additional pages to place the field on',
        title: 'Info'
      });
      return;
    }

    // Create fields individually for each page to avoid duplicates on source page
    // Use applyToAllPages: true only if we want to apply to ALL pages (including source)
    // But since we're excluding source page, we'll create individually
    const newFields: ISignatureField[] = [];
    let completed = 0;
    let hasError = false;

    pagesToCreate.forEach((pageNum) => {
      const fieldData: ICreateFieldRequest = {
        documentId: this.documentId,
        type: sourceField.type,
        x: sourceField.x,
        y: sourceField.y,
        width: sourceField.width,
        height: sourceField.height,
        pageNumber: pageNum,
        recipientId: sourceField.recipientId === -1 ? undefined : sourceField.recipientId,
        applyToAllPages: false
      };

      this.zilSignService
        .createField(this.documentId, fieldData)
        .pipe(take(1))
        .subscribe({
          next: (response) => {
            if (response.success && response.data) {
              const newField: ISignatureField = {
                id: response.data.id,
                ...fieldData
              };
              newFields.push(newField);
              completed++;

              // When all requests complete, update UI
              if (completed === pagesToCreate.length && !hasError) {
                this.signatureFields = [...this.signatureFields, ...newFields];
                this.cdr.detectChanges();
                this.renderFieldsIntoOverlays();

                this.alertService.successAlert({
                  content: `Field placed on ${newFields.length} page(s) successfully`,
                  title: 'Success'
                });
              }
            } else {
              hasError = true;
              this.alertService.failedAlert({
                content: 'Failed to place fields on other pages',
                title: 'Error'
              });
            }
          },
          error: () => {
            hasError = true;
          }
        });
    });
  }

  addResizeHandles(fieldElement: HTMLElement, field: ISignatureField): void {
    const fw = field.fixedWidth;
    const fh = field.fixedHeight;
    // Skip handles that resize a locked axis
    const handles = [
      { position: 'nw', cursor: 'nw-resize', top: '-4px', left: '-4px', needsW: true, needsH: true },
      { position: 'n',  cursor: 'n-resize',  top: '-4px', left: '50%', transform: 'translateX(-50%)', needsW: false, needsH: true },
      { position: 'ne', cursor: 'ne-resize', top: '-4px', right: '-4px', needsW: true, needsH: true },
      { position: 'e',  cursor: 'e-resize',  top: '50%', right: '-4px', transform: 'translateY(-50%)', needsW: true, needsH: false },
      { position: 'se', cursor: 'se-resize', bottom: '-4px', right: '-4px', needsW: true, needsH: true },
      { position: 's',  cursor: 's-resize',  bottom: '-4px', left: '50%', transform: 'translateX(-50%)', needsW: false, needsH: true },
      { position: 'sw', cursor: 'sw-resize', bottom: '-4px', left: '-4px', needsW: true, needsH: true },
      { position: 'w',  cursor: 'w-resize',  top: '50%', left: '-4px', transform: 'translateY(-50%)', needsW: true, needsH: false }
    ].filter(h => !(fw && h.needsW) && !(fh && h.needsH));

    handles.forEach(handle => {
      const handleElement = document.createElement('div');
      handleElement.style.position = 'absolute';
      handleElement.style.width = '8px';
      handleElement.style.height = '8px';
      handleElement.style.backgroundColor = 'rgba(59, 130, 246, 0.8)';
      handleElement.style.border = '1px solid white';
      handleElement.style.borderRadius = '2px';
      handleElement.style.cursor = handle.cursor;
      handleElement.style.zIndex = '25';
      handleElement.style.pointerEvents = 'auto';
      handleElement.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)';
      
      if (handle.top) handleElement.style.top = handle.top;
      if (handle.bottom) handleElement.style.bottom = handle.bottom;
      if (handle.left) handleElement.style.left = handle.left;
      if (handle.right) handleElement.style.right = handle.right;
      if (handle.transform) handleElement.style.transform = handle.transform;

      handleElement.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.onResizeStart(e, field, handle.position, fieldElement);
      });

      handleElement.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      fieldElement.appendChild(handleElement);
    });
  }

  onResizeStart(e: MouseEvent, field: ISignatureField, handle: string, fieldElement: HTMLElement): void {
    const fieldWidth = field.width != null && !(Number.isNaN(Number(field.width))) ? Number(field.width) : 150;
    const fieldHeight = field.height != null && !(Number.isNaN(Number(field.height))) ? Number(field.height) : 50;

    this.resizingField = {
      ...field,
      width: fieldWidth,
      height: fieldHeight
    };
    this.resizeHandle = handle;
    this.resizeStartX = e.clientX;
    this.resizeStartY = e.clientY;
    this.resizeStartWidth = fieldWidth;
    this.resizeStartHeight = fieldHeight;
    this.resizeStartLeft = Number(field.x) || 0;
    this.resizeStartTop = Number(field.y) || 0;

    const mouseMoveHandler = (moveEvent: MouseEvent) => {
      this.onResize(moveEvent, fieldElement);
    };

    const mouseUpHandler = () => {
      this.onResizeEnd();
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
    };

    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
  }

  onResize(e: MouseEvent, fieldElement: HTMLElement): void {
    if (!this.resizingField || !this.resizeHandle) return;

    // Get the page to convert pixel deltas to PDF points
    const page = this.pdfPages.find((p) => p.pageNumber === this.resizingField?.pageNumber);
    if (!page) return;

    // Convert pixel deltas to PDF points
    const deltaXPdf = (e.clientX - this.resizeStartX) / page.viewportScale;
    const deltaYPdf = (e.clientY - this.resizeStartY) / page.viewportScale;

    let newWidth = this.resizeStartWidth;
    let newHeight = this.resizeStartHeight;
    let newX = this.resizeStartLeft;
    let newY = this.resizeStartTop;

    // Minimum size in PDF points — checkbox/radio use a smaller minimum
    // so the user can resize them back to their original 20×20 default
    const isSmallField = this.resizingField?.type === 'checkbox' || this.resizingField?.type === 'radio';
    const minWidthPdf = isSmallField ? 10 : 30;
    const minHeightPdf = isSmallField ? 10 : 20;

    switch (this.resizeHandle) {
      case 'nw':
        newWidth = Math.max(minWidthPdf, this.resizeStartWidth - deltaXPdf);
        newHeight = Math.max(minHeightPdf, this.resizeStartHeight - deltaYPdf);
        newX = this.resizeStartLeft + (this.resizeStartWidth - newWidth);
        newY = this.resizeStartTop + (this.resizeStartHeight - newHeight);
        break;
      case 'n':
        newHeight = Math.max(minHeightPdf, this.resizeStartHeight - deltaYPdf);
        newY = this.resizeStartTop + (this.resizeStartHeight - newHeight);
        break;
      case 'ne':
        newWidth = Math.max(minWidthPdf, this.resizeStartWidth + deltaXPdf);
        newHeight = Math.max(minHeightPdf, this.resizeStartHeight - deltaYPdf);
        newY = this.resizeStartTop + (this.resizeStartHeight - newHeight);
        break;
      case 'e':
        newWidth = Math.max(minWidthPdf, this.resizeStartWidth + deltaXPdf);
        break;
      case 'se':
        newWidth = Math.max(minWidthPdf, this.resizeStartWidth + deltaXPdf);
        newHeight = Math.max(minHeightPdf, this.resizeStartHeight + deltaYPdf);
        break;
      case 's':
        newHeight = Math.max(minHeightPdf, this.resizeStartHeight + deltaYPdf);
        break;
      case 'sw':
        newWidth = Math.max(minWidthPdf, this.resizeStartWidth - deltaXPdf);
        newHeight = Math.max(minHeightPdf, this.resizeStartHeight + deltaYPdf);
        newX = this.resizeStartLeft + (this.resizeStartWidth - newWidth);
        break;
      case 'w':
        newWidth = Math.max(minWidthPdf, this.resizeStartWidth - deltaXPdf);
        newX = this.resizeStartLeft + (this.resizeStartWidth - newWidth);
        break;
    }

    if (this.resizingField) {
      // Honour fixedWidth / fixedHeight locks
      if (this.resizingField.fixedWidth) { newWidth = this.resizeStartWidth; newX = this.resizeStartLeft; }
      if (this.resizingField.fixedHeight) { newHeight = this.resizeStartHeight; newY = this.resizeStartTop; }

      this.resizingField.width = (newWidth != null && !isNaN(newWidth)) ? newWidth : this.resizeStartWidth;
      this.resizingField.height = (newHeight != null && !isNaN(newHeight)) ? newHeight : this.resizeStartHeight;
      this.resizingField.x = (newX != null && !isNaN(newX)) ? newX : this.resizeStartLeft;
      this.resizingField.y = (newY != null && !isNaN(newY)) ? newY : this.resizeStartTop;

      // Convert PDF points to screen pixels for display
      const screenCoords = this.pdfPointsToScreen(this.resizingField);
      
      fieldElement.style.width = `${screenCoords.width}px`;
      fieldElement.style.height = `${screenCoords.height}px`;
      fieldElement.style.left = `${screenCoords.x}px`;
      fieldElement.style.top = `${screenCoords.y}px`;
    }
  }

  onResizeEnd(): void {
    if (!this.resizingField || !this.resizeHandle) return;

    // Ensure width and height are valid numbers before saving (use fallback only if NaN/null/undefined)
    const finalWidth = (this.resizingField.width != null && !isNaN(this.resizingField.width)) ? this.resizingField.width : this.resizeStartWidth;
    const finalHeight = (this.resizingField.height != null && !isNaN(this.resizingField.height)) ? this.resizingField.height : this.resizeStartHeight;
    const finalX = (this.resizingField.x != null && !isNaN(this.resizingField.x)) ? this.resizingField.x : this.resizeStartLeft;
    const finalY = (this.resizingField.y != null && !isNaN(this.resizingField.y)) ? this.resizingField.y : this.resizeStartTop;

    const updatedField: ISignatureField = {
      ...this.resizingField,
      width: finalWidth,
      height: finalHeight,
      x: finalX,
      y: finalY
    };

    const fieldIndex = this.signatureFields.findIndex(
      (f) => f.id === updatedField.id
    );

    if (fieldIndex !== -1) {
      this.signatureFields[fieldIndex] = updatedField;
      this.saveFieldPosition(updatedField);
      
      if (this.selectedField?.id === updatedField.id) {
        this.selectedField = { ...updatedField };
      }
      
      this.renderFieldsIntoOverlays();
      this.cdr.detectChanges();
    }

    this.resizingField = null;
    this.resizeHandle = null;
  }

  saveFieldPosition(field: ISignatureField, isUpdate: boolean = false): void {
    if (!field.id) return;
    
    // Ensure all numeric values are properly set (values are already in PDF points)
    // Default sizes in PDF points (approximately 150px and 50px at 72 DPI)
    const updateData = {
      documentId: this.documentId,
      type: field.type,
      x: (field.x != null && !isNaN(field.x)) ? field.x : 0,
      y: (field.y != null && !isNaN(field.y)) ? field.y : 0,
      width: (field.width != null && !isNaN(field.width)) ? field.width : 150,
      height: (field.height != null && !isNaN(field.height)) ? field.height : 50,
      pageNumber: field.pageNumber,
      recipientId: field.recipientId,
      applyToAllPages: true,
      fieldName: field.fieldName,
      groupName: field.groupName,
      defaultValue: field.defaultValue,
      validation: field.validation,
      characterLimit: field.characterLimit,
      maxFileSizeMB: field.maxFileSizeMB,
      dataLabel: field.dataLabel,
      fixedWidth: field.fixedWidth,
      fixedHeight: field.fixedHeight,
      required: field.required,
      minRequired: field.minRequired,
      maxRequired: field.maxRequired,
    };
    
    // Values in updateData are already in PDF points, ready to send to backend
    this.zilSignService
      .updateField(this.documentId, field.id, updateData)
      .pipe(take(1))
      .subscribe({
        next: () => {
          if (isUpdate) {
            this.fieldSettingsSaved = true;
            setTimeout(() => { this.fieldSettingsSaved = false; this.cdr.detectChanges(); }, 2000);
            this.cdr.detectChanges();
          }
        }
      });
  }

  goBack(): void {
    if (this.isSignerMode) {
      return;
    }
    this.router.navigate(['manage/business-tools/zil-sign']);
  }

  preview(): void {}

  send(): void {
    // Filter out "Prefill by you" recipient (id: -1) and receives_copy recipients from validation
    const actualRecipients = this.recipients.filter(r => r.id !== -1 && this.canAssignFields(r));

    if (actualRecipients.length === 0) {
      this.alertService.failedAlert({
        content: 'Please add at least one signer recipient',
        title: 'Validation Error'
      });
      return;
    }

    // Filter fields assigned to actual recipients (not prefilled fields)
    const recipientFields = this.signatureFields.filter(field => field.recipientId && field.recipientId !== -1);

    if (recipientFields.length === 0 && this.signatureFields.length === 0) {
      this.alertService.failedAlert({
        content: 'Please add at least one signature field',
        title: 'Validation Error'
      });
      return;
    }

    // Calculate field counts per recipient (excluding prefilled fields and receives_copy recipients)
    const recipientFieldCounts: IRecipientFieldCount[] = actualRecipients.map(recipient => {
      const fieldCount = this.signatureFields.filter(field => field.recipientId === recipient.id).length;
      return {
        recipientName: recipient.name,
        recipientEmail: recipient.email,
        fieldCount: fieldCount
      };
    });

    // Check for recipients with no fields (only for recipients that need fields)
    const recipientsWithNoFields = recipientFieldCounts.filter(r => r.fieldCount === 0);
    if (recipientsWithNoFields.length > 0) {
      const recipientNames = recipientsWithNoFields.map(r => r.recipientEmail).join(', ');
      this.alertService.failedAlert({
        content: `The following recipients have no fields assigned: ${recipientNames}. Please add at least one field for each recipient.`,
        title: 'Error'
      });
      return;
    }

    // Show confirmation modal
    const dialogRef = this.dialog.open(ConfirmSignModalComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: {
        recipients: recipientFieldCounts
      } as IConfirmSignModalData,
      disableClose: false
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.sendDocument();
      }
    });
  }

  private sendDocument(): void {
    this.loadingSubmit = true;

    // Filter out "Prefill by you" recipient (id: -1) before sending
    const recipientsToSend = this.recipients.filter(r => r.id !== -1);

    this.zilSignService
      .sendDocument(this.documentId, recipientsToSend, this.signatureFields)
      .pipe(
        take(1),
        finalize(() => {
          this.loadingSubmit = false;
        })
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.alertService.successAlert({
              content: response.data?.message || 'Document sent successfully',
              title: 'Success'
            });
            this.goBack();
          } else {
            this.alertService.failedAlert({
              content: 'Failed to send document',
              title: 'Error'
            });
          }
        },
      });
  }

  getRecipientDisplayName(recipient: IRecipient): string {
    return recipient.name || '';
  }

  getRecipientIcon(recipient: IRecipient): string {
    if (recipient.id === -1) {
      return 'P';
    }
    return String(recipient.name[0] || '');
  }

  getRecipientColor(recipientId?: number): string {
    if (!recipientId) {
      return '#6B7280';
    }
    const recipientIndex = this.recipients.findIndex(
      (r) => r.id === recipientId
    );
    if (recipientIndex === -1) {
      return '#6B7280';
    }
    return this.recipientColors[recipientIndex % this.recipientColors.length];
  }

  getRecipientColorRgba(recipientId?: number, opacity: number = 0.3): string {
    const color = this.getRecipientColor(recipientId);
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  getRecipientBorderColorRgba(
    recipientId?: number,
    opacity: number = 0.5
  ): string {
    const color = this.getRecipientColor(recipientId);
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  getVisibleFields(): ISignatureField[] {
    if (this.isSignerMode && this.currentRecipientId) {
      // Show only fields assigned to current recipient.
      // Prefilled fields with values are baked into the PDF by the backend; hide them.
      return this.signatureFields.filter((f) => {
        const isPrefilled = !f.recipientId;
        const hasValue = f.value && f.value.trim() !== '';

        if (f.recipientId === this.currentRecipientId) return true;
        if (isPrefilled && hasValue) return f.type === 'attachment';
        return isPrefilled && !hasValue;
      });
    }

    return this.signatureFields;
  }

  getFieldsForRecipient(recipientId: number): ISignatureField[] {
    // If recipientId is -1 (Prefill by you), return all prefilled fields
    if (recipientId === -1) {
      return this.signatureFields.filter((f) => this.isPrefillField(f));
    }
    // Return fields assigned to this specific recipient
    return this.signatureFields.filter((f) => f.recipientId === recipientId);
  }

  onRecipientSelect(recipientId: number | null): void {
    // Don't allow selection of receives_copy recipients
    const recipient = this.recipients.find(r => r.id === recipientId);
    if (recipient && !this.canAssignFields(recipient)) {
      return;
    }

    if (this.selectedRecipientId === recipientId) {
      // Don't deselect - always keep a recipient selected if available
      return;
    } else {
      this.selectedRecipientId = recipientId;
    }
    this.renderFieldsIntoOverlays();
    this.cdr.detectChanges();
  }

  autoSelectRecipient(): void {
    if (this.isSignerMode) return; // Don't auto-select in signer mode
    
    // If no recipient is selected, select the first signer recipient
    if (!this.selectedRecipientId) {
      const signerRecipients = this.recipients.filter(r => r.role === 'signer');
      if (signerRecipients.length === 1) {
        // Auto-select if only one signer
        this.selectedRecipientId = signerRecipients[0].id;
      } else if (signerRecipients.length > 0) {
        // Select first signer if multiple exist
        this.selectedRecipientId = signerRecipients[0].id;
      }
    }
  }

  getSelectedRecipientName(): string {
    if (!this.selectedRecipientId) return '';
    const recipient = this.recipients.find(
      (r) => r.id === this.selectedRecipientId
    );
    return recipient?.name || '';
  }

  private async generateThumbnail(page: any): Promise<string> {
    try {
      const thumbnailViewport = page.getViewport({ scale: 0.15 });
      const thumbnailCanvas = document.createElement('canvas');
      const thumbnailContext = thumbnailCanvas.getContext('2d');

      if (!thumbnailContext) {
        return '';
      }

      thumbnailCanvas.width = thumbnailViewport.width;
      thumbnailCanvas.height = thumbnailViewport.height;

      await page.render({
        canvasContext: thumbnailContext,
        viewport: thumbnailViewport
      }).promise;

      return thumbnailCanvas.toDataURL('image/png');
    } catch (error) {
      return '';
    }
  }

  openSignAgreementModal(): void {
    const dialogRef = this.dialog.open(SignAgreementModalComponent, {
      width: '700px',
      maxWidth: '90vw',
      disableClose: true,
      data: {
        documentId: this.documentId,
        email: this.email(),
        username: this.username()
      }
    });
    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.canSubmit.set(true);
      }
    });
  }

  // ── Checkbox / Radio / Attachment interactive renderers ──────────────────

  private buildInteractiveFieldContent(
    field: ISignatureField,
    fieldElement: HTMLElement,
    value: string | undefined
  ): void {
    if (field.type === 'checkbox') {
      this.buildCheckboxContent(field, fieldElement, value);
    } else if (field.type === 'radio') {
      this.buildRadioContent(field, fieldElement, value);
    } else if (field.type === 'attachment') {
      this.buildAttachmentContent(field, fieldElement, value);
    }
  }

  private buildCheckboxContent(
    field: ISignatureField,
    fieldElement: HTMLElement,
    value: string | undefined
  ): void {
    const accentColor = field.recipientId
      ? this.getRecipientColor(field.recipientId)
      : '#10B981';

    const isInteractive = this.isSignerMode || this.isPrefillField(field);

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = value === 'true';
    checkbox.style.width = '55%';
    checkbox.style.height = '55%';
    checkbox.style.accentColor = accentColor;
    checkbox.style.cursor = isInteractive ? 'pointer' : 'move';

    if (isInteractive) {
      checkbox.addEventListener('change', (e) => {
        e.stopPropagation();
        const isChecked = (e.target as HTMLInputElement).checked;

        // Max-block: prevent checking if group max is already reached
        // Use truthiness (not !== undefined) so null/0 from cleared number inputs don't block all clicks
        if (isChecked && field.maxRequired && field.groupName) {
          const alreadyChecked = this.signatureFields.filter(f =>
            f.type === 'checkbox' &&
            f.groupName === field.groupName &&
            f.id !== field.id &&
            this.fieldValues.get(f.id || '') === 'true'
          ).length;
          if (alreadyChecked >= field.maxRequired) {
            (e.target as HTMLInputElement).checked = false;
            return;
          }
        }

        const newValue = isChecked ? 'true' : 'false';
        if (this.isPrefillField(field)) {
          // Prefill mode: persist value to backend immediately (also sets fieldValues + re-renders)
          this.saveFieldValue(field.id || '', newValue);
        } else {
          this.fieldValues.set(field.id || '', newValue);
          // Re-render to update group counter + clear any validation highlight (signer mode only)
          if (this.isSignerMode && field.groupName) {
            this.failingGroupNames.delete(field.groupName);
            setTimeout(() => this.renderFieldsIntoOverlays(), 0);
          }
        }
      });
      checkbox.addEventListener('mousedown', (e) => e.stopPropagation());
      checkbox.addEventListener('click', (e) => e.stopPropagation());
    } else {
      // Recipient field in editor — not interactive, drag/resize work on the wrapper
      checkbox.style.pointerEvents = 'none';
    }

    fieldElement.appendChild(checkbox);
  }

  private buildRadioContent(
    field: ISignatureField,
    fieldElement: HTMLElement,
    value: string | undefined
  ): void {
    const accentColor = field.recipientId
      ? this.getRecipientColor(field.recipientId)
      : '#10B981';

    // Group key: explicit groupName, or auto-group by page + recipient
    const groupKey = field.groupName
      || `page-${field.pageNumber}-recipient-${field.recipientId ?? 'none'}`;

    const isInteractive = this.isSignerMode || this.isPrefillField(field);

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = groupKey;
    radio.checked = value === 'true';
    radio.style.width = '55%';
    radio.style.height = '55%';
    radio.style.accentColor = accentColor;
    radio.style.cursor = isInteractive ? 'pointer' : 'move';

    if (isInteractive) {
      radio.addEventListener('change', (e) => {
        e.stopPropagation();
        if ((e.target as HTMLInputElement).checked) {
          const inPrefillMode = this.isPrefillField(field);
          // Deselect all other radio fields in the same group
          this.signatureFields.forEach(f => {
            if (f.type === 'radio' && f.id !== field.id) {
              const fKey = f.groupName
                || `page-${f.pageNumber}-recipient-${f.recipientId ?? 'none'}`;
              if (fKey === groupKey) {
                this.fieldValues.set(f.id || '', 'false');
                // Prefill mode: persist deselected sibling value to backend
                if (inPrefillMode && f.id) {
                  this.zilSignService.saveFieldValue(this.documentId, f.id, f.type, 'false', null)
                    .pipe(take(1)).subscribe();
                }
              }
            }
          });
          if (inPrefillMode) {
            // Prefill mode: persist selected value to backend immediately (also sets fieldValues + re-renders)
            this.saveFieldValue(field.id || '', 'true');
          } else {
            this.fieldValues.set(field.id || '', 'true');
          }
        }
      });
      radio.addEventListener('mousedown', (e) => e.stopPropagation());
      radio.addEventListener('click', (e) => e.stopPropagation());
    } else {
      // Recipient field in editor — not interactive, drag/resize work on the wrapper
      radio.style.pointerEvents = 'none';
    }

    fieldElement.appendChild(radio);
  }

  private buildAttachmentContent(
    field: ISignatureField,
    fieldElement: HTMLElement,
    value: string | undefined
  ): void {
    const recipientColor = field.recipientId
      ? this.getRecipientColor(field.recipientId)
      : '#6B7280';

    if (this.isSignerMode || this.isPrefillField(field)) {
      const hasFile = !!value;
      const filename = this.fieldValues.get((field.id || '') + '-filename') || 'Attachment';

      // Transparent click-target in signer mode — fieldElement's click handler opens the URL
      if (this.isSignerMode && this.isPrefillField(field) && hasFile) {
        return;
      }

      // Upload input — used in prefill mode (owner) and signer filling their own attachment field
      const label = document.createElement('label');
      label.htmlFor = `attachment-input-${field.id}`;
      label.style.display = 'flex';
      label.style.alignItems = 'center';
      label.style.justifyContent = 'center';
      label.style.cursor = 'pointer';
      label.style.width = '100%';
      label.style.height = '100%';
      label.style.gap = '2px';

      const icon = document.createElement('i');
      icon.className = 'far fa-paperclip';
      icon.style.fontSize ='12px';
      icon.style.color = hasFile ? '#10B981' : recipientColor;
      icon.style.flexShrink = '0';

      const text = document.createElement('span');
      text.style.fontSize = '10px';
      text.style.overflow = 'hidden';
      text.style.textOverflow = 'ellipsis';
      text.style.whiteSpace = 'nowrap';
      if (hasFile) {
        text.textContent = filename;
        text.style.color = 'var(--main-text-color)';
      } else {
        text.textContent = 'Upload file';
        text.style.color = 'var(--secondary-text-color)';
        label.style.flexDirection = 'row';
      }

      label.addEventListener('mousedown', (e) => {
        if (this.isSignerMode) {
          // In signer mode there is no drag; stop propagation as before
          e.stopPropagation();
        }
        // In prefill/editor mode let mousedown bubble to fieldElement so drag works
      });
      label.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.hasDragged) {
          e.preventDefault();
        }
      });

      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.id = `attachment-input-${field.id}`;
      fileInput.style.display = 'none';
      fileInput.addEventListener('change', (e) => {
        e.stopPropagation();
        const file = (e.target as HTMLInputElement).files?.[0];
        // If user cancels the picker, files[0] is undefined — keep previous selection
        if (file) {
          if (field.maxFileSizeMB && file.size > field.maxFileSizeMB * 1024 * 1024) {
            fileInput.value = '';  // reset picker so same file can be re-rejected
            const existing = fieldElement.querySelector('.attachment-size-error');
            if (!existing) {
              const err = document.createElement('span');
              err.className = 'attachment-size-error';
              err.style.cssText = 'position:absolute;bottom:2px;left:0;right:0;display:block;width:100%;padding:3px 6px 0;box-sizing:border-box;text-align:center;line-height:1.2;font-size:9px;color:var(--common-red-color);pointer-events:none;';
              err.textContent = `Max ${field.maxFileSizeMB} MB allowed`;
              fieldElement.appendChild(err);
            }
            return;
          }
          // ── existing FileReader logic (unchanged) ─────────────────
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result as string;
            if (this.isPrefillField(field)) {
              // Prefill mode: persist to backend immediately
              this.saveFieldValue(field.id || '', base64, file.name);
            } else {
              // Signer mode: store locally, submitted with final sign action
              this.fieldValues.set(field.id || '', base64);
              this.fieldValues.set((field.id || '') + '-filename', file.name);
            }
            this.renderFieldsIntoOverlays();
          };
          reader.readAsDataURL(file);
        }
      });

      label.appendChild(icon);
      label.appendChild(text);
      label.appendChild(fileInput);
      fieldElement.appendChild(label);
    } else {
      // Editor: generic placeholder (icon + label), consistent with other field types
      fieldElement.appendChild(this.createFieldPlaceholder(field));
    }
  }

  private getClickToFillText(field: ISignatureField, fieldLabel: string): string {
    if (field.type === 'checkbox' || field.type === 'radio') {
      return `Click to select ${fieldLabel}${field.recipientId ? ` (${field.recipientId})` : ''}`;
    }
    if (field.type === 'attachment') {
      return `Click to upload ${fieldLabel}${field.recipientId ? ` (${field.recipientId})` : ''}`;
    }
    return `Click to fill ${fieldLabel}${field.recipientId ? ` (${field.recipientId})` : ''}`;
  }

  // ──────────────────────────────────────────────────────────────────────────

  ngOnDestroy(): void {
    if (typeof window !== 'undefined' && this.windowResizeHandler) {
      window.removeEventListener('resize', this.windowResizeHandler);
    }
    this.fieldSettingsChanged$.complete();
  }
}
