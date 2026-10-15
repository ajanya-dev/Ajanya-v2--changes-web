import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { Subject, debounceTime, take } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import {
  V4SelectDropdownComponent,
  IV4SelectOption
} from 'src/app/shared/V4/v4-select-dropdown/v4-select-dropdown.component';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { IApiResSuccessOnly } from 'src/app/models/api';
import {
  FieldType,
  IDocumentDetails,
  IFieldValue,
  IPdfPage,
  IRecipient,
  ISignatureField,
  ValidationOption
} from '../../v4-models/v4-zil-sign.models';
import { ZilSignService } from 'src/app/modules/business-tools/zil-sign/service/zil-sign.service';
import {
  V4ConfirmSignModalComponent,
  IRecipientFieldCount
} from '../../v4-modals/v4-confirm-sign-modal/v4-confirm-sign-modal.component';
import {
  V4FieldInputModalComponent,
  IV4FieldInputModalData
} from '../../v4-modals/v4-field-input-modal/v4-field-input-modal.component';
import {
  V4FieldContextMenuComponent,
  IV4ContextMenuAction
} from '../../v4-modals/v4-field-context-menu/v4-field-context-menu.component';
import {
  V4PlaceFieldModalComponent,
  IV4PlaceFieldModalData,
  IV4PlaceFieldModalResult
} from '../../v4-modals/v4-place-field-modal/v4-place-field-modal.component';

declare const pdfjsLib: any;

interface IFieldTypeOption {
  type: FieldType;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-v4-sign-pdf-viewer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    MatTooltipModule,
    CommonButtonV4Component,
    V4FieldContextMenuComponent,
    V4SelectDropdownComponent
  ],
  templateUrl: './v4-sign-pdf-viewer.component.html',
  styleUrls: ['./v4-sign-pdf-viewer.component.scss']
})
export class V4SignPdfViewerComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('pdfContainer') pdfContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('pdfPagesContainer')
  pdfPagesContainer!: ElementRef<HTMLDivElement>;

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private zilSignService = inject(ZilSignService);
  private alert = inject(V4AlertService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  documentId = '';
  documentName = '';
  signerToken = '';
  isSignerMode = false;

  pdfUrl = '';
  pdfDoc: any = null;
  pdfPages: IPdfPage[] = [];
  pdfLoading = signal(true);
  pdfError = signal('');

  currentPage = signal(1);
  totalPages = signal(0);
  zoomLevel = signal(100);
  zoom = 1.5;

  recipients = signal<IRecipient[]>([]);
  currentRecipientId: number | null = null;
  selectedRecipientId = signal<number | null>(null);

  signatureFields: ISignatureField[] = [];
  private tempIdCounter = 0;
  fieldValues = new Map<string, string>();
  draggedFieldType: FieldType | null = null;
  loadingSubmit = signal(false);

  showContextMenu = signal(false);
  contextMenuX = 0;
  contextMenuY = 0;
  contextMenuFieldId = '';

  // Drag state for repositioning a placed field (mirrors v3 sign-pdf-viewer)
  private draggingField: ISignatureField | null = null;
  private draggingFieldElement: HTMLElement | null = null;
  private hasDragged = false;
  private dragOffsetX = 0;
  private dragOffsetY = 0;

  // Resize state for the 8 corner/edge handles (mirrors v3 sign-pdf-viewer)
  private resizingField: ISignatureField | null = null;
  private resizeHandle: string | null = null;
  private resizeStartX = 0;
  private resizeStartY = 0;
  private resizeStartWidth = 0;
  private resizeStartHeight = 0;
  private resizeStartLeft = 0;
  private resizeStartTop = 0;

  // Selected field for the right-side details/settings panel (sender mode only)
  selectedField = signal<ISignatureField | null>(null);

  // Briefly true after the auto-save API call for the details panel succeeds —
  // drives the "Saved ✓" indicator next to the panel title.
  fieldSettingsSaved = signal(false);
  private fieldSettingsSavedResetTimer: ReturnType<typeof setTimeout> | null = null;

  // Active "+" popover target for checkbox/radio group expansion (sender mode)
  private addMoreTarget: { field: ISignatureField } | null = null;

  // Stored initials harvested from the first signature/name fill — auto-populated
  // into empty `initial` fields so the user doesn't need to retype.
  private storedInitials: string | null = null;
  private storedSignatureStyle: 'cursive' | 'standard' | 'bold' = 'cursive';

  // Cached page thumbnails (data URLs), generated once on initial load
  pageThumbnails = signal<string[]>([]);

  fieldTypes: IFieldTypeOption[] = [
    { type: 'signature', label: 'Signature', icon: 'pen-tool' },
    { type: 'initial', label: 'Initial', icon: 'edit-3' },
    { type: 'name', label: 'Full Name', icon: 'user' },
    { type: 'date', label: 'Date', icon: 'calendar' },
    { type: 'sign_date', label: 'Sign Date', icon: 'calendar-check' },
    { type: 'email', label: 'Email', icon: 'mail' },
    { type: 'company', label: 'Company', icon: 'building-2' },
    { type: 'title', label: 'Job Title', icon: 'briefcase' },
    { type: 'text', label: 'Text', icon: 'type' },
    { type: 'checkbox', label: 'Checkbox', icon: 'check-square' },
    { type: 'radio', label: 'Radio', icon: 'circle-dot' },
    { type: 'attachment', label: 'Attachment', icon: 'paperclip' }
  ];

  recipientColors = [
    '#0595E5',
    '#08B160',
    '#F59E0B',
    '#EF4444',
    '#792AFF',
    '#EC4899',
    '#06B6D4',
    '#84CC16',
    '#F97316',
    '#6366F1'
  ];

  private fieldSettingsChanged$ = new Subject<void>();

  ngOnInit(): void {
    this.signerToken =
      this.route.snapshot.params['token'] ||
      this.route.snapshot.queryParams['token'] ||
      '';
    this.isSignerMode = !!this.signerToken;

    if (this.isSignerMode) {
      this.loadDocumentByToken();
    } else {
      this.documentId = this.route.snapshot.params['id'];
      if (!this.documentId) {
        this.pdfError.set('Document ID is required');
        this.pdfLoading.set(false);
        return;
      }
      this.loadDocumentDetails();
    }

    this.fieldSettingsChanged$
      .pipe(debounceTime(600), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.onFieldSettingsAutoSave());
  }

  ngAfterViewInit(): void {
    this.setupPdfDropZone();
    this.setupFieldDragging();
  }

  ngOnDestroy(): void {
    if (this.fieldSettingsSavedResetTimer) {
      clearTimeout(this.fieldSettingsSavedResetTimer);
    }
    /* destroyRef handles unsubscribe */
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
            const prefillRecipient: IRecipient = {
              id: -1,
              name: 'Prefill by you',
              email: '',
              role: 'owner'
            };
            this.recipients.set([
              prefillRecipient,
              ...(response.data.recipients || [])
            ]);
            this.signatureFields = response.data.fields || [];
            this.signatureFields.forEach((field) => {
              if (!field.id) return;
              if (field.value) {
                this.fieldValues.set(field.id, field.value);
                if (field.type === 'attachment' && field.filename) {
                  this.fieldValues.set(
                    field.id + '-filename',
                    field.filename
                  );
                }
              } else if (field.defaultValue) {
                this.fieldValues.set(field.id, field.defaultValue);
              }
            });
            this.autoSelectRecipient();
            setTimeout(() => this.renderPDF(), 0);
          } else {
            this.pdfError.set('Failed to load document details');
            this.pdfLoading.set(false);
            this.cdr.detectChanges();
          }
        },
        error: (error) => {
          this.pdfError.set(error?.error?.message || 'Failed to load document');
          this.pdfLoading.set(false);
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
          if (
            response.success &&
            (response.data as IDocumentDetails)?.status !== 'signed'
          ) {
            const data = response.data as IDocumentDetails;
            if (data.already_signed) {
              this.router.navigate(['/outside/v4-zil-sign/success'], {
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
            this.recipients.set(data.recipients || []);
            this.currentRecipientId =
              data.currentRecipientId ||
              (data.fields?.find((f) => f.recipientId != null)
                ?.recipientId ??
                null);
            this.signatureFields = data.fields || [];
            this.signatureFields.forEach((field) => {
              if (!field.id) return;
              if (field.value) {
                this.fieldValues.set(field.id, field.value);
                if (field.type === 'attachment' && field.filename) {
                  this.fieldValues.set(
                    field.id + '-filename',
                    field.filename
                  );
                }
              } else if (field.defaultValue) {
                this.fieldValues.set(field.id, field.defaultValue);
              }
            });
            setTimeout(() => this.renderPDF(), 0);
          } else {
            this.pdfError.set(
              (response.data as IApiResSuccessOnly)?.errorMsg ||
                'Failed to load document'
            );
            this.pdfLoading.set(false);
            this.cdr.detectChanges();
          }
        },
        error: (error) => {
          this.pdfError.set(
            error?.error?.message || 'Invalid or expired signing link'
          );
          this.pdfLoading.set(false);
          this.cdr.detectChanges();
        }
      });
  }

  autoSelectRecipient(): void {
    const signers = this.recipients().filter(
      (r) => r.id !== -1 && r.role !== 'receives_copy'
    );
    if (signers.length === 1) {
      this.selectedRecipientId.set(signers[0].id);
    } else if (signers.length === 0) {
      this.selectedRecipientId.set(-1);
    }
  }

  async renderPDF(): Promise<void> {
    try {
      // Only show the full-page loader on the very first render — re-renders
      // (zoom in/out) keep the existing canvas visible so the document
      // doesn't disappear and shift the layout.
      const isFirstRender = !this.pdfDoc;
      if (isFirstRender) this.pdfLoading.set(true);
      this.pdfError.set('');

      const container = this.pdfPagesContainer?.nativeElement;
      if (!container) {
        this.pdfLoading.set(false);
        return;
      }
      container.innerHTML = '';
      this.pdfPages = [];

      if (typeof pdfjsLib !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          'assets/pdfjs/pdf.worker.min.js';
      }

      const pdfData = await this.zilSignService.fetchPdfData(this.pdfUrl);
      const loadingTask = pdfjsLib.getDocument({ data: pdfData, isEvalSupported: false });
      const pdf = await loadingTask.promise;
      this.pdfDoc = pdf;
      this.totalPages.set(pdf.numPages);

      if (this.isSignerMode && this.currentRecipientId) {
        this.signatureFields = this.signatureFields.filter((f) => {
          const isPrefilled = !f.recipientId;
          const hasValue = f.value && f.value.trim() !== '';
          if (f.recipientId === this.currentRecipientId) return true;
          if (isPrefilled && hasValue) return f.type === 'attachment';
          return isPrefilled && !hasValue;
        });
      }

      let currentY = 0;
      const scale = this.zoom;
      const thumbs: string[] = isFirstRender
        ? []
        : [...this.pageThumbnails()];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        canvas.style.display = 'block';
        canvas.style.background = 'white';
        canvas.style.borderRadius = '6px';
        canvas.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';

        const pageWrapper = document.createElement('div');
        pageWrapper.style.position = 'relative';
        pageWrapper.style.display = 'block';
        pageWrapper.style.marginBottom = '16px';
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

        await page.render({ canvasContext: ctx, viewport }).promise;

        if (isFirstRender) {
          thumbs.push(await this.generateThumbnail(page));
        }

        const pdfPageWidth = viewport.width / scale;
        const pdfPageHeight = viewport.height / scale;

        this.pdfPages.push({
          pageNumber: pageNum,
          canvas,
          overlay,
          offsetY: currentY,
          width: viewport.width,
          height: viewport.height,
          pdfWidth: pdfPageWidth,
          pdfHeight: pdfPageHeight,
          viewportScale: scale
        });

        currentY += viewport.height + 16;
      }

      if (isFirstRender) this.pageThumbnails.set(thumbs);
      this.pdfLoading.set(false);
      this.cdr.detectChanges();
      setTimeout(() => this.renderFieldsIntoOverlays(), 100);
    } catch (error: any) {
      this.pdfError.set(error?.message || 'Failed to render PDF');
      this.pdfLoading.set(false);
      this.cdr.detectChanges();
    }
  }

  renderFieldsIntoOverlays(): void {
    this.pdfPages.forEach((p) => {
      if (p.overlay) p.overlay.innerHTML = '';
    });
    this.signatureFields.forEach((field) => this.renderFieldElement(field));
  }

  private renderFieldElement(field: ISignatureField): void {
    const page = this.pdfPages.find((p) => p.pageNumber === field.pageNumber);
    if (!page || !page.overlay) return;

    const left = field.x * page.viewportScale;
    const top = field.y * page.viewportScale;
    const width = field.width * page.viewportScale;
    const height = field.height * page.viewportScale;

    const wrapper = document.createElement('div');
    wrapper.dataset['fieldId'] = field.id || '';
    wrapper.style.position = 'absolute';
    wrapper.style.left = `${left}px`;
    wrapper.style.top = `${top}px`;
    wrapper.style.width = `${width}px`;
    wrapper.style.height = `${height}px`;
    wrapper.style.pointerEvents = 'auto';
    wrapper.style.cursor = this.isSignerMode ? 'pointer' : 'move';
    wrapper.style.borderRadius = '4px';
    wrapper.style.boxSizing = 'border-box';
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.justifyContent = 'center';
    wrapper.style.fontSize = '11px';
    wrapper.style.fontFamily = 'var(--font-peridot)';
    wrapper.style.userSelect = 'none';

    const recipientId = field.recipientId ?? -1;
    const color = this.getRecipientColor(recipientId);
    wrapper.style.border = `2px solid ${color}`;
    wrapper.style.background = `${color}1a`; // 10% opacity hex
    wrapper.style.color = color;

    // Optimistic field awaiting backend confirmation — fade slightly and lock
    // interactions so drag/resize/click can't fire follow-up API calls with the
    // temp id before the real id arrives.
    // `id` is typed as string but persisted fields can arrive as number at runtime,
    // so guard before calling string methods.
    if (typeof field.id === 'string' && field.id.startsWith('temp-')) {
      wrapper.style.opacity = '0.7';
      wrapper.style.pointerEvents = 'none';
    }

    const value = field.id ? this.fieldValues.get(field.id) : undefined;

    if (field.type === 'checkbox') {
      this.buildCheckboxContent(field, wrapper, value, color);
    } else if (field.type === 'radio') {
      this.buildRadioContent(field, wrapper, value, color);
    } else if (field.type === 'attachment') {
      this.buildAttachmentContent(field, wrapper, value, color);
    } else if (
      value &&
      (field.type === 'signature' || field.type === 'initial')
    ) {
      const img = document.createElement('img');
      img.src = `data:image/png;base64,${value}`;
      img.style.maxWidth = '100%';
      img.style.maxHeight = '100%';
      wrapper.appendChild(img);
    } else if (value) {
      const valueSpan = document.createElement('span');
      valueSpan.textContent = value;
      valueSpan.style.color = 'var(--v4-badge-neutral-text-color)';
      wrapper.appendChild(valueSpan);
    } else {
      const label = document.createElement('span');
      label.textContent = field.label || this.getFieldTypeLabel(field.type);
      label.style.color = 'var(--v4-badge-neutral-text-color)';
      wrapper.appendChild(label);
    }

    if (!this.isSignerMode) {
      wrapper.addEventListener('mousedown', (e) => {
        const target = e.target as HTMLElement;
        if (target?.style?.cursor && target.style.cursor.includes('resize')) {
          // The handle's own mousedown will take over.
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        this.hasDragged = false;
        this.draggingField = { ...field };
        this.draggingFieldElement = wrapper;
        const coords = this.screenToPdfPoints(e.clientX, e.clientY);
        if (coords) {
          this.dragOffsetX = coords.x - field.x;
          this.dragOffsetY = coords.y - field.y;
        } else {
          this.dragOffsetX = 0;
          this.dragOffsetY = 0;
        }
      });
    }

    wrapper.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.hasDragged) return;
      this.onFieldClick(field, wrapper);
    });

    if (!this.isSignerMode) {
      wrapper.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.openContextMenu(e, field);
      });

      // Direct red-X delete button on the field (top-right corner)
      const del = document.createElement('button');
      del.type = 'button';
      del.style.cssText =
        'position:absolute;top:-26px;right:-10px;width:20px;height:20px;' +
        'border-radius:50%;border:none;cursor:pointer;z-index:30;padding:0;' +
        'background:var(--v4-common-red-color);box-shadow:0 2px 4px rgba(0,0,0,0.2);' +
        'display:flex;align-items:center;justify-content:center;';
      del.innerHTML =
        '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
      del.addEventListener('mousedown', (ev) => ev.stopPropagation());
      del.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (field.id) this.deleteField(field.id);
      });
      wrapper.appendChild(del);

      // 8 resize handles
      this.addResizeHandles(wrapper, field);
    }

    page.overlay.appendChild(wrapper);

    // "+" button to add another field to a checkbox/radio group — only when
    // this field is the active addMoreTarget. Clicking it propagates the
    // existing groupName to the new field via addSignatureField.
    if (
      !this.isSignerMode &&
      this.addMoreTarget?.field.id === field.id &&
      (field.type === 'checkbox' || field.type === 'radio')
    ) {
      const plusBtn = document.createElement('button');
      plusBtn.type = 'button';
      plusBtn.setAttribute('data-add-more-btn', 'true');
      plusBtn.style.cssText =
        `position:absolute;left:${left + width / 2 - 12}px;top:${top + height + 4}px;` +
        'width:24px;height:24px;border-radius:50%;border:none;cursor:pointer;' +
        'background:var(--v4-success-light-color, #10B981);color:#fff;' +
        'display:flex;align-items:center;justify-content:center;' +
        'box-shadow:0 2px 4px rgba(0,0,0,0.3);z-index:200;pointer-events:auto;' +
        'font-size:16px;line-height:1;padding:0;';
      plusBtn.innerHTML = '<span style="pointer-events:none">+</span>';
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
  }

  private buildCheckboxContent(
    field: ISignatureField,
    wrapper: HTMLElement,
    value: string | undefined,
    color: string
  ): void {
    const isInteractive = this.isSignerMode || this.isPrefillField(field);
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = value === 'true';
    input.style.width = '60%';
    input.style.height = '60%';
    input.style.margin = '0';
    input.style.accentColor = 'var(--v4-primary-brand-color)';

    if (!isInteractive) {
      input.style.pointerEvents = 'none';
      wrapper.appendChild(input);
      return;
    }

    input.style.cursor = 'pointer';
    input.addEventListener('mousedown', (e) => e.stopPropagation());
    input.addEventListener('click', (e) => e.stopPropagation());
    input.addEventListener('change', (e) => {
      e.stopPropagation();
      const checked = (e.target as HTMLInputElement).checked;

      // Block check when the group's max is already reached.
      if (checked && field.maxRequired && field.groupName) {
        const alreadyChecked = this.signatureFields.filter(
          (f) =>
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

      const newValue = checked ? 'true' : 'false';
      if (this.isPrefillField(field) && !this.isSignerMode && field.id) {
        this.saveFieldValue(field.id, newValue);
      } else if (field.id) {
        this.fieldValues.set(field.id, newValue);
      }
    });
    wrapper.appendChild(input);
  }

  private buildRadioContent(
    field: ISignatureField,
    wrapper: HTMLElement,
    value: string | undefined,
    color: string
  ): void {
    const isInteractive = this.isSignerMode || this.isPrefillField(field);
    const groupKey =
      field.groupName ||
      `page-${field.pageNumber}-recipient-${field.recipientId ?? 'none'}`;

    const input = document.createElement('input');
    input.type = 'radio';
    input.name = groupKey;
    input.checked = value === 'true';
    input.style.width = '60%';
    input.style.height = '60%';
    input.style.margin = '0';
    input.style.accentColor = 'var(--v4-primary-brand-color)';

    if (!isInteractive) {
      input.style.pointerEvents = 'none';
      wrapper.appendChild(input);
      return;
    }

    input.style.cursor = 'pointer';
    input.addEventListener('mousedown', (e) => e.stopPropagation());
    input.addEventListener('click', (e) => e.stopPropagation());
    input.addEventListener('change', (e) => {
      e.stopPropagation();
      if (!(e.target as HTMLInputElement).checked) return;

      const inPrefillMode = this.isPrefillField(field) && !this.isSignerMode;

      // Mutual exclusion: deselect siblings sharing the same group key.
      this.signatureFields.forEach((f) => {
        if (f.type !== 'radio' || f.id === field.id || !f.id) return;
        const fKey =
          f.groupName ||
          `page-${f.pageNumber}-recipient-${f.recipientId ?? 'none'}`;
        if (fKey !== groupKey) return;
        this.fieldValues.set(f.id, 'false');
        if (inPrefillMode) {
          this.zilSignService
            .saveFieldValue(this.documentId, f.id, f.type, 'false', null)
            .pipe(take(1))
            .subscribe();
        }
      });

      if (inPrefillMode && field.id) {
        this.saveFieldValue(field.id, 'true');
      } else if (field.id) {
        this.fieldValues.set(field.id, 'true');
      }
    });
    wrapper.appendChild(input);
  }

  private buildAttachmentContent(
    field: ISignatureField,
    wrapper: HTMLElement,
    value: string | undefined,
    color: string
  ): void {
    const isInteractive = this.isSignerMode || this.isPrefillField(field);
    const hasFile = !!value;
    const filename =
      (field.id && this.fieldValues.get(field.id + '-filename')) || 'Attachment';

    if (!isInteractive) {
      const label = document.createElement('span');
      label.textContent = field.label || 'Attachment';
      label.style.fontSize = '11px';
      wrapper.appendChild(label);
      return;
    }

    const label = document.createElement('label');
    label.htmlFor = `v4-attachment-input-${field.id}`;
    label.style.cssText =
      'display:flex;align-items:center;justify-content:center;' +
      'cursor:pointer;width:100%;height:100%;gap:4px;padding:0 6px;' +
      'box-sizing:border-box;';

    const icon = document.createElement('span');
    icon.style.cssText =
      'display:inline-flex;align-items:center;flex-shrink:0;' +
      'color:var(--v4-badge-neutral-text-color);';
    icon.innerHTML =
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
      'stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49' +
      'l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>';

    const text = document.createElement('span');
    text.style.cssText =
      'font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
    text.textContent = hasFile ? filename : 'Upload file';
    text.style.color = hasFile ? 'var(--v4-badge-neutral-text-color)' : color;

    label.appendChild(icon);
    label.appendChild(text);

    label.addEventListener('mousedown', (e) => {
      if (this.isSignerMode) e.stopPropagation();
    });
    label.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.hasDragged) e.preventDefault();
    });

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = `v4-attachment-input-${field.id}`;
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', (e) => {
      e.stopPropagation();
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (
        field.maxFileSizeMB &&
        file.size > field.maxFileSizeMB * 1024 * 1024
      ) {
        fileInput.value = '';
        this.alert.failedAlert({
          content: `Max ${field.maxFileSizeMB} MB allowed`,
          title: 'Attachment Too Large'
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        if (!field.id) return;
        if (this.isPrefillField(field) && !this.isSignerMode) {
          this.saveFieldValue(field.id, base64, file.name);
        } else {
          this.fieldValues.set(field.id, base64);
          this.fieldValues.set(field.id + '-filename', file.name);
          this.renderFieldsIntoOverlays();
        }
      };
      reader.readAsDataURL(file);
    });

    wrapper.appendChild(label);
    wrapper.appendChild(fileInput);
  }


  getRecipientColor(recipientId: number): string {
    if (recipientId === -1) return 'var(--v4-secondary-text-color)';
    const recipients = this.recipients().filter((r) => r.id !== -1);
    const idx = recipients.findIndex((r) => r.id === recipientId);
    if (idx === -1) return this.recipientColors[0];
    return this.recipientColors[idx % this.recipientColors.length];
  }

  getRecipientName(recipientId: number | null | undefined): string {
    if (recipientId == null || recipientId === -1) return 'Prefill by you';
    const r = this.recipients().find((rr) => rr.id === recipientId);
    return r?.name || 'Unknown';
  }

  getRecipientInitial(name: string | undefined | null): string {
    const trimmed = (name || '').trim();
    return trimmed ? trimmed.charAt(0).toUpperCase() : '?';
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

  // ── Prefill / interactive helpers ─────────────────────────────────────

  private isPrefillField(field: ISignatureField): boolean {
    return field.recipientId == null || field.recipientId === -1;
  }

  private isRecipientField(field: ISignatureField): boolean {
    return !this.isPrefillField(field);
  }

  private getInputType(type: FieldType): string {
    if (type === 'email') return 'email';
    if (type === 'date' || type === 'sign_date') return 'date';
    return 'text';
  }

  private getFieldPlaceholder(type: FieldType): string {
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
      checkbox: '',
      radio: '',
      attachment: ''
    };
    return placeholders[type] || '';
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private extractInitials(fullName: string): string {
    if (!fullName?.trim()) return '';
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0).toUpperCase() +
      parts[parts.length - 1].charAt(0).toUpperCase()
    );
  }

  private getSignatureFontFamily(
    style: 'standard' | 'cursive' | 'bold'
  ): string {
    return style === 'cursive' ? 'Dancing Script, cursive' : 'Arial, sans-serif';
  }

  private getSignatureFontWeight(
    style: 'standard' | 'cursive' | 'bold'
  ): string {
    return style === 'bold' ? 'bold' : 'normal';
  }

  // Render initials text to a base64 PNG so it can be persisted and rendered
  // identically to a hand-typed signature. Mirrors v3 generateInitialsImage.
  private generateInitialsImage(
    initialsText: string,
    style?: 'cursive' | 'standard' | 'bold'
  ): string {
    if (!initialsText?.trim()) return '';
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
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
    const dataUrl = canvas.toDataURL('image/png');
    return dataUrl.split(',')[1] || dataUrl;
  }

  // Drag-drop from toolbar
  private dragGhostEl: HTMLElement | null = null;

  onDragStart(event: DragEvent, fieldType: FieldType): void {
    this.draggedFieldType = fieldType;
    if (!event.dataTransfer) return;
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('text/plain', fieldType);

    // Build a small custom drag image so the browser doesn't capture the
    // whole grid container as the ghost. Mounted off-screen, removed in
    // onDragEnd.
    const label = this.getFieldTypeLabel(fieldType);
    const ghost = document.createElement('div');
    ghost.textContent = label;
    ghost.style.cssText =
      'position:absolute;top:-1000px;left:-1000px;' +
      'padding:6px 12px;border-radius:6px;' +
      'background:var(--v4-primary-brand-bold-color);color:#fff;' +
      'font-size:12px;font-weight:600;font-family:var(--font-peridot);' +
      'box-shadow:0 4px 12px rgba(0,0,0,0.18);white-space:nowrap;' +
      'pointer-events:none;';
    document.body.appendChild(ghost);
    this.dragGhostEl = ghost;
    // Anchor the ghost so it sits centered under the cursor.
    event.dataTransfer.setDragImage(ghost, ghost.offsetWidth / 2, ghost.offsetHeight / 2);
  }

  onDragEnd(): void {
    this.draggedFieldType = null;
    if (this.dragGhostEl) {
      this.dragGhostEl.remove();
      this.dragGhostEl = null;
    }
  }

  setupPdfDropZone(): void {
    const container = this.pdfContainer?.nativeElement;
    if (!container) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.draggedFieldType && !this.isSignerMode) {
        const coords = this.screenToPdfPoints(e.clientX, e.clientY);
        if (coords) {
          this.addSignatureField(
            coords.x,
            coords.y,
            this.draggedFieldType,
            coords.pageNumber
          );
        }
        this.draggedFieldType = null;
        this.cdr.detectChanges();
      }
    };

    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('drop', handleDrop);
  }

  screenToPdfPoints(
    clientX: number,
    clientY: number
  ): { x: number; y: number; pageNumber: number } | null {
    for (const page of this.pdfPages) {
      const rect = page.canvas.getBoundingClientRect();
      if (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        const pixelX = clientX - rect.left;
        const pixelY = clientY - rect.top;
        return {
          x: pixelX / page.viewportScale,
          y: pixelY / page.viewportScale,
          pageNumber: page.pageNumber
        };
      }
    }
    return null;
  }

  pdfPointsToScreen(field: ISignatureField): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    const page = this.pdfPages.find((p) => p.pageNumber === field.pageNumber);
    if (!page) {
      return {
        x: field.x * this.zoom,
        y: field.y * this.zoom,
        width: field.width * this.zoom,
        height: field.height * this.zoom
      };
    }
    return {
      x: field.x * page.viewportScale,
      y: field.y * page.viewportScale,
      width: field.width * page.viewportScale,
      height: field.height * page.viewportScale
    };
  }

  // Drag a placed field — registers document-level mousemove/mouseup once.
  // The actual mousedown that starts the drag is attached per-field in renderFieldElement.
  setupFieldDragging(): void {
    const container = this.pdfContainer?.nativeElement;
    if (!container) return;

    const mouseMoveHandler = (e: MouseEvent) => {
      if (!this.draggingField || !this.draggingFieldElement) return;
      e.preventDefault();
      this.hasDragged = true;

      const coords = this.screenToPdfPoints(e.clientX, e.clientY);
      if (!coords) return;

      const oldPageNumber = this.draggingField.pageNumber;
      const pdfX = Math.max(0, coords.x - this.dragOffsetX);
      const pdfY = Math.max(0, coords.y - this.dragOffsetY);

      if (coords.pageNumber === this.draggingField.pageNumber) {
        this.draggingField.x = pdfX;
        this.draggingField.y = pdfY;
      } else {
        // Reparent the element to the new page's overlay
        this.draggingField.pageNumber = coords.pageNumber;
        this.draggingField.x = pdfX;
        this.draggingField.y = pdfY;

        const newPage = this.pdfPages.find(
          (p) => p.pageNumber === coords.pageNumber
        );
        const oldPage = this.pdfPages.find(
          (p) => p.pageNumber === oldPageNumber
        );
        if (newPage?.overlay && oldPage?.overlay && this.draggingFieldElement) {
          oldPage.overlay.removeChild(this.draggingFieldElement);
          newPage.overlay.appendChild(this.draggingFieldElement);
        }
      }

      const screenCoords = this.pdfPointsToScreen(this.draggingField);
      this.draggingFieldElement.style.left = `${screenCoords.x}px`;
      this.draggingFieldElement.style.top = `${screenCoords.y}px`;

      // Auto-scroll when dragging near the viewport edges
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
        } else if (fieldY + screenCoords.height > visibleBottom - 50) {
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
    };

    const mouseUpHandler = () => {
      if (!this.draggingField) return;
      if (this.hasDragged) {
        const idx = this.signatureFields.findIndex(
          (f) => f.id === this.draggingField?.id
        );
        if (idx !== -1 && this.draggingField) {
          this.signatureFields[idx] = { ...this.draggingField };
          // Keep the panel draft aligned with the new coords so a later edit
          // doesn't write stale x/y back to the server.
          if (this.selectedField()?.id === this.draggingField.id) {
            this.selectedField.set({ ...this.signatureFields[idx] });
          }
        }
        this.saveFieldPosition(this.draggingField);
        // Re-render after a short delay so the trailing click handler still
        // sees hasDragged === true and skips opening the input modal.
        setTimeout(() => {
          this.hasDragged = false;
          this.renderFieldsIntoOverlays();
        }, 100);
      } else {
        this.hasDragged = false;
      }
      this.draggingField = null;
      this.draggingFieldElement = null;
      this.cdr.detectChanges();
    };

    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
  }

  saveFieldPosition(field: ISignatureField, isUpdate: boolean = false): void {
    if (!field.id) return;
    const payload = {
      documentId: this.documentId,
      type: field.type,
      x: field.x != null && !isNaN(field.x) ? field.x : 0,
      y: field.y != null && !isNaN(field.y) ? field.y : 0,
      width: field.width != null && !isNaN(field.width) ? field.width : 150,
      height: field.height != null && !isNaN(field.height) ? field.height : 50,
      pageNumber: field.pageNumber,
      recipientId: field.recipientId,
      label: field.label,
      required: field.required,
      fixedWidth: field.fixedWidth,
      fixedHeight: field.fixedHeight,
      defaultValue: field.defaultValue,
      fieldName: field.fieldName,
      groupName: field.groupName,
      minRequired: field.minRequired,
      maxRequired: field.maxRequired,
      maxFileSizeMB: field.maxFileSizeMB,
      validation: field.validation,
      characterLimit: field.characterLimit
    };
    this.zilSignService
      .updateField(this.documentId, field.id, payload)
      .pipe(take(1))
      .subscribe({
        next: () => {
          if (isUpdate) {
            this.fieldSettingsSaved.set(true);
            if (this.fieldSettingsSavedResetTimer) {
              clearTimeout(this.fieldSettingsSavedResetTimer);
            }
            this.fieldSettingsSavedResetTimer = setTimeout(() => {
              this.fieldSettingsSaved.set(false);
              this.cdr.detectChanges();
            }, 2000);
          }
        }
      });
  }

  addResizeHandles(fieldElement: HTMLElement, field: ISignatureField): void {
    const fw = field.fixedWidth;
    const fh = field.fixedHeight;
    interface IHandleSpec {
      position: string;
      cursor: string;
      top?: string;
      bottom?: string;
      left?: string;
      right?: string;
      transform?: string;
      needsW: boolean;
      needsH: boolean;
    }
    const handles: IHandleSpec[] = [
      { position: 'nw', cursor: 'nw-resize', top: '-4px', left: '-4px', needsW: true, needsH: true },
      { position: 'n',  cursor: 'n-resize',  top: '-4px', left: '50%', transform: 'translateX(-50%)', needsW: false, needsH: true },
      { position: 'ne', cursor: 'ne-resize', top: '-4px', right: '-4px', needsW: true, needsH: true },
      { position: 'e',  cursor: 'e-resize',  top: '50%', right: '-4px', transform: 'translateY(-50%)', needsW: true, needsH: false },
      { position: 'se', cursor: 'se-resize', bottom: '-4px', right: '-4px', needsW: true, needsH: true },
      { position: 's',  cursor: 's-resize',  bottom: '-4px', left: '50%', transform: 'translateX(-50%)', needsW: false, needsH: true },
      { position: 'sw', cursor: 'sw-resize', bottom: '-4px', left: '-4px', needsW: true, needsH: true },
      { position: 'w',  cursor: 'w-resize',  top: '50%', left: '-4px', transform: 'translateY(-50%)', needsW: true, needsH: false }
    ].filter((h) => !(fw && h.needsW) && !(fh && h.needsH));

    handles.forEach((handle) => {
      const handleElement = document.createElement('div');
      handleElement.style.position = 'absolute';
      handleElement.style.width = '8px';
      handleElement.style.height = '8px';
      handleElement.style.backgroundColor = 'var(--v4-primary-brand-bold-color)';
      handleElement.style.border = '1px solid var(--v4-popup-background-color)';
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
      handleElement.addEventListener('click', (e) => e.stopPropagation());

      fieldElement.appendChild(handleElement);
    });
  }

  onResizeStart(
    e: MouseEvent,
    field: ISignatureField,
    handle: string,
    fieldElement: HTMLElement
  ): void {
    const fieldWidth =
      field.width != null && !Number.isNaN(Number(field.width))
        ? Number(field.width)
        : 150;
    const fieldHeight =
      field.height != null && !Number.isNaN(Number(field.height))
        ? Number(field.height)
        : 50;

    this.resizingField = { ...field, width: fieldWidth, height: fieldHeight };
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
    const page = this.pdfPages.find(
      (p) => p.pageNumber === this.resizingField?.pageNumber
    );
    if (!page) return;

    const deltaXPdf = (e.clientX - this.resizeStartX) / page.viewportScale;
    const deltaYPdf = (e.clientY - this.resizeStartY) / page.viewportScale;

    let newWidth = this.resizeStartWidth;
    let newHeight = this.resizeStartHeight;
    let newX = this.resizeStartLeft;
    let newY = this.resizeStartTop;

    const isSmall =
      this.resizingField.type === 'checkbox' ||
      this.resizingField.type === 'radio';
    const minW = isSmall ? 10 : 30;
    const minH = isSmall ? 10 : 20;

    switch (this.resizeHandle) {
      case 'nw':
        newWidth = Math.max(minW, this.resizeStartWidth - deltaXPdf);
        newHeight = Math.max(minH, this.resizeStartHeight - deltaYPdf);
        newX = this.resizeStartLeft + (this.resizeStartWidth - newWidth);
        newY = this.resizeStartTop + (this.resizeStartHeight - newHeight);
        break;
      case 'n':
        newHeight = Math.max(minH, this.resizeStartHeight - deltaYPdf);
        newY = this.resizeStartTop + (this.resizeStartHeight - newHeight);
        break;
      case 'ne':
        newWidth = Math.max(minW, this.resizeStartWidth + deltaXPdf);
        newHeight = Math.max(minH, this.resizeStartHeight - deltaYPdf);
        newY = this.resizeStartTop + (this.resizeStartHeight - newHeight);
        break;
      case 'e':
        newWidth = Math.max(minW, this.resizeStartWidth + deltaXPdf);
        break;
      case 'se':
        newWidth = Math.max(minW, this.resizeStartWidth + deltaXPdf);
        newHeight = Math.max(minH, this.resizeStartHeight + deltaYPdf);
        break;
      case 's':
        newHeight = Math.max(minH, this.resizeStartHeight + deltaYPdf);
        break;
      case 'sw':
        newWidth = Math.max(minW, this.resizeStartWidth - deltaXPdf);
        newHeight = Math.max(minH, this.resizeStartHeight + deltaYPdf);
        newX = this.resizeStartLeft + (this.resizeStartWidth - newWidth);
        break;
      case 'w':
        newWidth = Math.max(minW, this.resizeStartWidth - deltaXPdf);
        newX = this.resizeStartLeft + (this.resizeStartWidth - newWidth);
        break;
    }

    if (this.resizingField.fixedWidth) {
      newWidth = this.resizeStartWidth;
      newX = this.resizeStartLeft;
    }
    if (this.resizingField.fixedHeight) {
      newHeight = this.resizeStartHeight;
      newY = this.resizeStartTop;
    }

    this.resizingField.width =
      newWidth != null && !isNaN(newWidth) ? newWidth : this.resizeStartWidth;
    this.resizingField.height =
      newHeight != null && !isNaN(newHeight)
        ? newHeight
        : this.resizeStartHeight;
    this.resizingField.x =
      newX != null && !isNaN(newX) ? newX : this.resizeStartLeft;
    this.resizingField.y =
      newY != null && !isNaN(newY) ? newY : this.resizeStartTop;

    const screen = this.pdfPointsToScreen(this.resizingField);
    fieldElement.style.width = `${screen.width}px`;
    fieldElement.style.height = `${screen.height}px`;
    fieldElement.style.left = `${screen.x}px`;
    fieldElement.style.top = `${screen.y}px`;
  }

  onResizeEnd(): void {
    if (!this.resizingField || !this.resizeHandle) return;
    const finalWidth =
      this.resizingField.width != null && !isNaN(this.resizingField.width)
        ? this.resizingField.width
        : this.resizeStartWidth;
    const finalHeight =
      this.resizingField.height != null && !isNaN(this.resizingField.height)
        ? this.resizingField.height
        : this.resizeStartHeight;
    const finalX =
      this.resizingField.x != null && !isNaN(this.resizingField.x)
        ? this.resizingField.x
        : this.resizeStartLeft;
    const finalY =
      this.resizingField.y != null && !isNaN(this.resizingField.y)
        ? this.resizingField.y
        : this.resizeStartTop;

    const updated: ISignatureField = {
      ...this.resizingField,
      width: finalWidth,
      height: finalHeight,
      x: finalX,
      y: finalY
    };

    const idx = this.signatureFields.findIndex((f) => f.id === updated.id);
    if (idx !== -1) {
      this.signatureFields[idx] = updated;
      if (this.selectedField()?.id === updated.id) {
        this.selectedField.set({ ...updated });
      }
      this.saveFieldPosition(updated);
      this.renderFieldsIntoOverlays();
      this.cdr.detectChanges();
    }

    this.resizingField = null;
    this.resizeHandle = null;
  }

  getContextMenuFieldType(): FieldType | null {
    const f = this.signatureFields.find(
      (sf) => sf.id === this.contextMenuFieldId
    );
    return f?.type ?? null;
  }

  addSignatureField(
    x: number,
    y: number,
    type: FieldType,
    pageNumber: number,
    groupName?: string
  ): void {
    const recipientId = this.selectedRecipientId();
    if (recipientId === null) {
      this.alert.failedAlert({
        content: 'Please select a recipient first',
        title: 'No Recipient Selected'
      });
      return;
    }

    const defaultSizes: Record<FieldType, { width: number; height: number }> = {
      signature: { width: 160, height: 50 },
      initial: { width: 60, height: 40 },
      name: { width: 160, height: 30 },
      sign_date: { width: 120, height: 30 },
      company: { width: 160, height: 30 },
      title: { width: 140, height: 30 },
      date: { width: 120, height: 30 },
      text: { width: 140, height: 30 },
      email: { width: 180, height: 30 },
      checkbox: { width: 24, height: 24 },
      radio: { width: 24, height: 24 },
      attachment: { width: 140, height: 30 }
    };

    const size = defaultSizes[type];

    // When adding via the "+" button, copy group-level settings from a sibling
    // so the new field is consistent with the rest of the group.
    const sibling = groupName
      ? this.signatureFields.find(
          (f) => f.type === type && f.groupName === groupName
        )
      : undefined;
    const inheritedGroupSettings = sibling
      ? {
          required: sibling.required,
          minRequired: sibling.minRequired,
          maxRequired: sibling.maxRequired,
          fixedWidth: sibling.fixedWidth,
          fixedHeight: sibling.fixedHeight
        }
      : {};

    // `temp-` prefix flags the field as "saving" — renderFieldElement() fades it,
    // and the success/error handlers use it to locate the same row for
    // id-patching or rollback even if other drops land in the meantime.
    const tempId = `temp-${Date.now()}-${++this.tempIdCounter}`;

    const optimisticField: ISignatureField = {
      id: tempId,
      type,
      x: Math.max(0, x - size.width / 2),
      y: Math.max(0, y - size.height / 2),
      width: size.width,
      height: size.height,
      pageNumber,
      recipientId: recipientId === -1 ? null : recipientId,
      label: this.getFieldTypeLabel(type),
      required: type === 'signature' || type === 'initial',
      ...(groupName ? { groupName } : {}),
      ...inheritedGroupSettings
    };

    this.signatureFields.push(optimisticField);
    this.renderFieldsIntoOverlays();
    this.cdr.detectChanges();

    // Backend assigns the real id, so drop the temp id from the request body.
    const { id: _tempId, ...createBody } = optimisticField;
    void _tempId;

    this.zilSignService
      .createField(this.documentId, {
        documentId: this.documentId,
        ...createBody
      })
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          if (!res.success || !res.data) {
            this.removeOptimisticField(tempId);
            return;
          }

          const field = this.signatureFields.find((f) => f.id === tempId);
          if (!field) return;
          field.id = res.data.id;

          // Radio fields must always have an explicit groupName so separate
          // radio groups on the same page don't share an HTML `name`.
          // Checkbox auto-grouping enables the "+" button to inherit the same
          // group on later additions and surfaces min/max validation once a
          // second checkbox is added.
          if (type === 'radio' && !field.groupName) {
            field.groupName = `radio-group-${field.id}`;
            this.saveFieldPosition(field);
          } else if (type === 'checkbox' && !field.groupName) {
            field.groupName = `checkbox-group-${field.id}`;
            this.saveFieldPosition(field);
          } else if (sibling) {
            this.saveFieldPosition(field);
          }

          if (type === 'initial' && this.storedInitials) {
            this.autoPopulateInitialsFields();
          }

          this.renderFieldsIntoOverlays();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.removeOptimisticField(tempId);
          this.alert.failedAlert({
            content: err?.error?.message || 'Failed to add field',
            title: 'Error'
          });
        }
      });
  }

  private removeOptimisticField(tempId: string): void {
    const idx = this.signatureFields.findIndex((f) => f.id === tempId);
    if (idx < 0) return;
    this.signatureFields.splice(idx, 1);
    this.renderFieldsIntoOverlays();
    this.cdr.detectChanges();
  }

  onFieldClick(field: ISignatureField, fieldElement?: HTMLElement): void {
    if (this.isSignerMode) {
      this.openFieldInputModal(field);
      return;
    }

    const live = this.signatureFields.find((f) => f.id === field.id) ?? field;

    // Recipient-assigned field: open the details panel. For checkbox/radio,
    // also surface the "+" popover so the user can grow the group.
    if (this.isRecipientField(live)) {
      const draft: ISignatureField = {
        ...live,
        fieldName: live.fieldName || this.getFieldTypeLabel(live.type)
      };
      this.selectedField.set(draft);
      if (live.type === 'checkbox' || live.type === 'radio') {
        this.openAddMorePopover(live);
      } else if (this.addMoreTarget) {
        this.addMoreTarget = null;
        this.renderFieldsIntoOverlays();
      }
      return;
    }

    // Switching focus to any non-grouped prefill field hides the lingering "+".
    if (live.type !== 'checkbox' && live.type !== 'radio' && this.addMoreTarget) {
      this.addMoreTarget = null;
      this.renderFieldsIntoOverlays();
    }

    // Prefill-by-you field: route by type.
    if (live.type === 'signature' || live.type === 'initial') {
      this.openFieldInputModalForPrefill(live);
      return;
    }
    if (live.type === 'checkbox' || live.type === 'radio') {
      this.openAddMorePopover(live);
      return;
    }
    if (live.type === 'attachment') {
      // The label inside the wrapper handles the file picker click — no-op here.
      return;
    }

    // Plain text-style and date fields: swap the wrapper content with a typed
    // input. Date types use input.type='date' which opens the native picker on
    // focus / click — no modal needed.
    if (!fieldElement || !live.id) return;
    const existingInput = document.getElementById(
      `v4-field-input-${live.id}`
    ) as HTMLInputElement | null;
    if (existingInput) {
      existingInput.focus();
      return;
    }
    const value = this.fieldValues.get(live.id) || '';
    const input = this.createInlineInputForPrefill(live, value);
    const deleteBtn = fieldElement.querySelector('button');
    const resizeHandles = Array.from(
      fieldElement.querySelectorAll('div[style*="resize"]')
    ) as HTMLElement[];
    fieldElement.innerHTML = '';
    fieldElement.appendChild(input);
    if (deleteBtn) fieldElement.appendChild(deleteBtn);
    resizeHandles.forEach((h) => fieldElement.appendChild(h));
    fieldElement.style.cursor = 'text';
    setTimeout(() => input.focus(), 0);
  }

  // Open the V4 field-input modal for prefill mode (signature/initial only —
  // date/sign_date now use a native inline picker, no modal needed).
  // On close, persist the selected value and update stored initials/style so
  // future signature/initial fields auto-populate.
  openFieldInputModalForPrefill(field: ISignatureField): void {
    if (!field.id) return;
    const data: IV4FieldInputModalData = {
      field,
      fieldType: field.type,
      ...(field.type === 'initial' && this.storedInitials
        ? { prefilledInitials: this.storedInitials }
        : {})
    };
    const dialogRef = this.dialog.open(V4FieldInputModalComponent, {
      maxWidth: '640px',
      width: '95%',
      panelClass: 'paddingless-modal-rounded',
      data
    });
    dialogRef.afterClosed().subscribe((result: any) => {
      if (!result || !field.id) return;

      if (
        result.type === 'signature' &&
        result.selectedSignatureStyle
      ) {
        this.storedSignatureStyle = result.selectedSignatureStyle;
      }
      if (result.type === 'signature' && result.extractedInitials) {
        this.storedInitials = result.extractedInitials;
      }
      if (
        result.type === 'name' &&
        typeof result.value === 'string' &&
        result.value.trim()
      ) {
        const extracted = this.extractInitials(result.value);
        if (extracted) this.storedInitials = extracted;
      }

      this.saveFieldValue(result.fieldId, result.value, result.filename);

      if (
        (result.type === 'signature' || result.type === 'name') &&
        this.storedInitials
      ) {
        this.autoPopulateInitialsFields();
      }
    });
  }

  // Build an inline <input> that swaps in for a prefill text field's content.
  // On blur, validates email and persists via saveFieldValue.
  createInlineInputForPrefill(
    field: ISignatureField,
    value: string
  ): HTMLInputElement {
    const input = document.createElement('input');
    input.type = this.getInputType(field.type);
    input.value = value;
    input.placeholder = this.getFieldPlaceholder(field.type);
    input.id = `v4-field-input-${field.id}`;
    input.style.cssText =
      'width:100%;height:100%;box-sizing:border-box;border:none;outline:none;' +
      'background:transparent;font-size:12px;padding:4px;text-align:center;' +
      'color:var(--v4-badge-neutral-text-color);font-family:var(--font-peridot);';

    if (field.characterLimit) input.maxLength = field.characterLimit;

    const originalValue = value;

    input.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      if (field.id) this.fieldValues.set(field.id, target.value);
    });

    input.addEventListener('blur', (e) => {
      const target = e.target as HTMLInputElement;
      const trimmed = target.value.trim();

      if (field.type === 'email' && trimmed && !this.isValidEmail(trimmed)) {
        this.alert.failedAlert({
          content: 'Please enter a valid email address',
          title: 'Invalid Email'
        });
        return;
      }

      if (trimmed === originalValue) return;

      if (trimmed) {
        if (field.type === 'name') {
          const extracted = this.extractInitials(trimmed);
          if (extracted) {
            this.storedInitials = extracted;
            this.autoPopulateInitialsFields();
          }
        }
        if (field.id) this.saveFieldValue(field.id, trimmed);
      } else if (field.id) {
        this.fieldValues.delete(field.id);
        this.renderFieldsIntoOverlays();
        this.cdr.detectChanges();
      }
    });

    input.addEventListener('mousedown', (e) => e.stopPropagation());
    input.addEventListener('click', (e) => e.stopPropagation());

    // For native date inputs, open the picker programmatically when the input
    // mounts so the user doesn't need a second click on the calendar icon.
    if (field.type === 'date' || field.type === 'sign_date') {
      setTimeout(() => {
        const anyInput = input as HTMLInputElement & {
          showPicker?: () => void;
        };
        anyInput.showPicker?.();
      }, 50);
    }

    return input;
  }

  // Anchor the "+" popover directly below the clicked field. New fields still
  // inherit the clicked field's groupName via addSignatureField, but the "+"
  // visually tracks the user's selection rather than always pointing to the
  // bottom of the group.
  openAddMorePopover(field: ISignatureField): void {
    this.addMoreTarget = { field };
    this.renderFieldsIntoOverlays();
    this.cdr.detectChanges();
  }

  // ── Group settings helpers (used by the right-side details panel) ────

  getCheckboxGroupSize(): number {
    const sel = this.selectedField();
    if (!sel?.groupName) return 1;
    return this.signatureFields.filter(
      (f) => f.type === sel.type && f.groupName === sel.groupName
    ).length;
  }

  getCheckboxGroupValidationError(): string {
    const sel = this.selectedField();
    if (!sel) return '';
    const groupSize = this.getCheckboxGroupSize();
    const min = sel.minRequired;
    const max = sel.maxRequired;
    if (
      min !== undefined &&
      min !== null &&
      min > 0 &&
      max !== undefined &&
      max !== null &&
      max > 0 &&
      max < min
    ) {
      return 'Max value must be greater than min value';
    }
    if (min != null && min > 0 && min > groupSize) {
      return `Group has only ${groupSize} checkbox${
        groupSize !== 1 ? 'es' : ''
      }. Add more to set min ${min} validation.`;
    }
    if (max != null && max > 0 && max > groupSize) {
      return `Group has only ${groupSize} checkbox${
        groupSize !== 1 ? 'es' : ''
      }. Add more to set max ${max} validation.`;
    }
    return '';
  }

  closeFieldSettings(): void {
    this.selectedField.set(null);
    this.fieldSettingsSaved.set(false);
    if (this.fieldSettingsSavedResetTimer) {
      clearTimeout(this.fieldSettingsSavedResetTimer);
      this.fieldSettingsSavedResetTimer = null;
    }
  }

  /** Text-style field types that support character limit + validation rules. */
  isTextTypeField(): boolean {
    const f = this.selectedField();
    if (!f) return false;
    return ['text', 'name', 'email', 'company', 'title'].includes(f.type);
  }

  readonly validationOptions: IV4SelectOption[] = [
    { id: 'none', name: 'None', value: 'none' },
    { id: 'numeric', name: 'Numeric', value: 'numeric' },
    { id: 'alphabet', name: 'Alphabet', value: 'alphabet' }
  ];

  onValidationChange(value: string, field: ISignatureField): void {
    field.validation = value as ValidationOption;
    this.onFieldSettingChange();
  }

  /** Field types that should NOT expose a "Default value" input. */
  private static readonly DEFAULT_VALUE_EXCLUDED: FieldType[] = [
    'signature',
    'initial',
    'sign_date',
    'checkbox',
    'radio',
    'attachment'
  ];

  hasDefaultValueSupport(): boolean {
    const f = this.selectedField();
    if (!f) return false;
    return !V4SignPdfViewerComponent.DEFAULT_VALUE_EXCLUDED.includes(f.type);
  }

  getAssignableRecipients(): IRecipient[] {
    return this.recipients().filter(
      (r) => r.role !== 'receives_copy' && r.id > 0
    );
  }

  recipientOptions = computed<IV4SelectOption[]>(() =>
    this.recipients()
      .filter((r) => r.role !== 'receives_copy' && r.id > 0)
      .map((r) => ({
        id: String(r.id),
        name: r.email || r.name,
        value: String(r.id)
      }))
  );

  onFieldRecipientChange(value: string, field: ISignatureField): void {
    field.recipientId = value ? Number(value) : null;
    this.onFieldSettingChange();
  }

  getSettingsPanelTitle(): string {
    const f = this.selectedField();
    if (!f) return '';
    return this.getFieldTypeLabel(f.type);
  }

  // Called from the panel inputs (ngModelChange) — debounce + persist.
  onFieldSettingChange(): void {
    this.fieldSettingsChanged$.next();
  }

  deleteSelectedField(): void {
    const f = this.selectedField();
    if (!f?.id) return;
    this.deleteField(f.id);
  }

  openFieldInputModal(field: ISignatureField): void {
    if (!field.id) return;

    if (field.type === 'checkbox') {
      const current = this.fieldValues.get(field.id);
      const next = current === 'true' ? 'false' : 'true';
      this.fieldValues.set(field.id, next);
      this.renderFieldsIntoOverlays();
      return;
    }

    const data: IV4FieldInputModalData = {
      field,
      fieldType: field.type
    };
    const dialogRef = this.dialog.open(V4FieldInputModalComponent, {
      maxWidth: '640px',
      width: '95%',
      panelClass: 'paddingless-modal-rounded',
      data
    });
    dialogRef.afterClosed().subscribe((result: any) => {
      if (result && field.id) {
        this.fieldValues.set(field.id, result.value);
        this.renderFieldsIntoOverlays();
      }
    });
  }

  openContextMenu(event: MouseEvent, field: ISignatureField): void {
    if (this.isSignerMode || !field.id) return;
    this.contextMenuFieldId = field.id;
    this.contextMenuX = event.clientX;
    this.contextMenuY = event.clientY;
    this.showContextMenu.set(true);
  }

  onContextMenuAction(action: IV4ContextMenuAction): void {
    if (action.action === 'delete') {
      this.deleteField(action.fieldId);
    } else if (action.action === 'placeOnOtherPages') {
      this.openPlaceFieldModal(action.fieldId);
    } else if (action.action === 'edit') {
      const field = this.signatureFields.find((f) => f.id === action.fieldId);
      if (field) this.openFieldInputModal(field);
    }
  }

  closeContextMenu(): void {
    this.showContextMenu.set(false);
  }

  deleteField(fieldId: string): void {
    // Optimistic UI: remove immediately, then persist. Restore on failure.
    const removed = this.signatureFields.find((f) => f.id === fieldId);
    const removedValue = this.fieldValues.get(fieldId);
    this.signatureFields = this.signatureFields.filter(
      (f) => f.id !== fieldId
    );
    this.fieldValues.delete(fieldId);
    if (this.selectedField()?.id === fieldId) {
      this.selectedField.set(null);
    }
    this.renderFieldsIntoOverlays();
    this.cdr.detectChanges();

    this.zilSignService
      .deleteField(this.documentId, fieldId)
      .pipe(take(1))
      .subscribe({
        error: (err) => {
          // Roll back the optimistic removal
          if (removed) {
            this.signatureFields.push(removed);
            if (removedValue !== undefined) {
              this.fieldValues.set(fieldId, removedValue);
            }
            this.renderFieldsIntoOverlays();
            this.cdr.detectChanges();
          }
          this.alert.failedAlert({
            content: err?.error?.message || 'Failed to delete field',
            title: 'Error'
          });
        }
      });
  }

  // Persist a prefill field value to the server (recipientId: null) and update
  // local state so the PDF re-renders with the value. On error, roll back the
  // optimistic local update.
  saveFieldValue(fieldId: string, value: string, filename?: string): void {
    const field = this.signatureFields.find((f) => f.id === fieldId);
    if (!field) return;

    this.fieldValues.set(fieldId, value);
    if (filename) {
      this.fieldValues.set(fieldId + '-filename', filename);
    }

    if (field.type === 'name' && value.trim()) {
      const extracted = this.extractInitials(value);
      if (extracted) {
        this.storedInitials = extracted;
        this.autoPopulateInitialsFields();
      }
    }

    this.zilSignService
      .saveFieldValue(this.documentId, fieldId, field.type, value, null, filename)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          if (res.success) {
            field.value = value;
            if (filename) field.filename = filename;
            this.renderFieldsIntoOverlays();
            this.cdr.detectChanges();
          }
        },
        error: () => {
          this.fieldValues.delete(fieldId);
          if (filename) this.fieldValues.delete(fieldId + '-filename');
          this.alert.failedAlert({
            content: 'Failed to save field value',
            title: 'Error'
          });
        }
      });
  }

  private autoPopulateInitialsFields(): void {
    if (!this.storedInitials) return;
    let hasUpdates = false;
    this.signatureFields.forEach((field) => {
      if (field.type !== 'initial' || !field.id) return;
      if (!this.isPrefillField(field)) return;
      const current = this.fieldValues.get(field.id);
      if (current && current.trim()) return;

      const image = this.generateInitialsImage(this.storedInitials || '');
      if (!image) return;
      this.fieldValues.set(field.id, image);
      hasUpdates = true;

      if (this.isSignerMode) return;
      this.zilSignService
        .saveFieldValue(this.documentId, field.id, field.type, image, null)
        .pipe(take(1))
        .subscribe({
          next: (res) => {
            if (res.success) field.value = image;
          },
          error: () => {
            this.fieldValues.delete(field.id || '');
          }
        });
    });
    if (hasUpdates) {
      this.renderFieldsIntoOverlays();
      this.cdr.detectChanges();
    }
  }

  openPlaceFieldModal(fieldId: string): void {
    const field = this.signatureFields.find((f) => f.id === fieldId);
    if (!field) return;
    const data: IV4PlaceFieldModalData = {
      fieldId,
      currentPage: field.pageNumber,
      totalPages: this.totalPages()
    };
    const dialogRef = this.dialog.open(V4PlaceFieldModalComponent, {
      maxWidth: '520px',
      width: '95%',
      panelClass: 'paddingless-modal-rounded',
      data
    });
    dialogRef.afterClosed().subscribe((result: IV4PlaceFieldModalResult) => {
      if (!result) return;
      this.applyFieldToPages(field, result);
    });
  }

  private applyFieldToPages(
    field: ISignatureField,
    result: IV4PlaceFieldModalResult
  ): void {
    for (let p = result.fromPage; p <= result.toPage; p++) {
      if (p === field.pageNumber) continue;
      const newField: Omit<ISignatureField, 'id'> & { documentId: string } = {
        documentId: this.documentId,
        type: field.type,
        x: field.x,
        y: field.y,
        width: field.width,
        height: field.height,
        pageNumber: p,
        recipientId: field.recipientId,
        label: field.label,
        required: field.required
      };
      this.zilSignService
        .createField(this.documentId, newField)
        .pipe(take(1))
        .subscribe((res) => {
          if (res.success && res.data) {
            const created: ISignatureField = {
              ...newField,
              id: res.data.id
            };
            this.signatureFields.push(created);
            this.renderFieldElement(created);
          }
        });
    }
  }

  // Page nav / zoom
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    const pageInfo = this.pdfPages.find((p) => p.pageNumber === page);
    if (!pageInfo) return;
    const container = this.pdfContainer?.nativeElement;
    if (!container) return;
    container.scrollTo({ top: pageInfo.offsetY - 16, behavior: 'smooth' });
  }

  previousPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }

  zoomIn(): void {
    this.zoomLevel.update((v) => Math.min(v + 10, 200));
    this.zoom = this.zoomLevel() / 100;
    this.renderPDF();
  }

  zoomOut(): void {
    this.zoomLevel.update((v) => Math.max(v - 10, 50));
    this.zoom = this.zoomLevel() / 100;
    this.renderPDF();
  }

  // Recipient selection — receives_copy recipients can't have fields, so
  // selecting them would be a no-op trap.
  onRecipientChange(id: number): void {
    const r = this.recipients().find((rr) => rr.id === id);
    if (r && !this.canAssignFields(r)) return;
    this.selectedRecipientId.set(id);
  }

  canAssignFields(recipient: IRecipient): boolean {
    return recipient.role !== 'receives_copy';
  }

  getFieldsForRecipient(recipientId: number): number {
    // "Prefill by you" pseudo-recipient (id: -1) maps to fields with no
    // recipientId on the backend.
    if (recipientId === -1) {
      return this.signatureFields.filter((f) => f.recipientId == null).length;
    }
    return this.signatureFields.filter((f) => f.recipientId === recipientId)
      .length;
  }

  // Debounced auto-save for the field details panel
  onFieldSettingsAutoSave(): void {
    const draft = this.selectedField();
    if (!draft?.id) return;
    // Don't persist invalid min/max values that exceed the group size — the
    // panel surfaces the error inline; let the user fix it before we save.
    if (this.getCheckboxGroupValidationError()) return;
    const idx = this.signatureFields.findIndex((f) => f.id === draft.id);
    if (idx === -1) return;
    const updated: ISignatureField = { ...draft };

    // For checkbox groups with min/max, individual `required` is contradictory.
    if (
      updated.type === 'checkbox' &&
      updated.groupName &&
      (updated.minRequired || updated.maxRequired) &&
      updated.required
    ) {
      updated.required = false;
      this.selectedField.set({ ...updated });
    }

    this.signatureFields[idx] = updated;
    this.saveFieldPosition(updated, true);
    this.renderFieldsIntoOverlays();
  }

  // Send (sender mode)
  send(): void {
    if (this.isSignerMode) return;

    // Recipients that need fields = real signers (not "Prefill by you", not
    // receives_copy). Mirrors v3's send() validation order.
    const actualRecipients = this.recipients().filter(
      (r) => r.id !== -1 && r.role !== 'receives_copy'
    );

    if (actualRecipients.length === 0) {
      this.alert.failedAlert({
        content: 'Please add at least one signer recipient',
        title: 'Validation Error'
      });
      return;
    }

    if (this.signatureFields.length === 0) {
      this.alert.failedAlert({
        content: 'Please add at least one signature field',
        title: 'Validation Error'
      });
      return;
    }

    const counts: IRecipientFieldCount[] = actualRecipients.map((r) => ({
      recipientName: r.name,
      recipientEmail: r.email,
      fieldCount: this.signatureFields.filter((f) => f.recipientId === r.id)
        .length
    }));

    const recipientsWithNoFields = counts.filter((c) => c.fieldCount === 0);
    if (recipientsWithNoFields.length > 0) {
      const names = recipientsWithNoFields
        .map((r) => r.recipientEmail || r.recipientName)
        .join(', ');
      this.alert.failedAlert({
        content: `The following recipients have no fields assigned: ${names}. Please add at least one field for each recipient.`,
        title: 'Error'
      });
      return;
    }

    const dialogRef = this.dialog.open(V4ConfirmSignModalComponent, {
      maxWidth: '520px',
      width: '95%',
      panelClass: ['v4_alert_wrapper', 'v4-zil-sign-confirm-modal'],
      data: { recipients: counts }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      const realRecipients = this.recipients().filter((r) => r.id !== -1);
      this.zilSignService
        .sendDocument(this.documentId, realRecipients, this.signatureFields)
        .pipe(take(1))
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.alert.successAlert({
                content: 'Document sent successfully',
                title: 'Success'
              });
              this.router.navigate([
                '/v4/manage/v4-business-tools/zil-sign'
              ]);
            } else {
              this.alert.failedAlert({
                content: 'Failed to send document',
                title: 'Error'
              });
            }
          }
        });
    });
  }

  // Submit (signer mode)
  submitSignerFields(): void {
    if (!this.isSignerMode || !this.documentId || !this.signerToken) return;

    const requiredMissing = this.signatureFields.find(
      (f) =>
        f.required &&
        f.recipientId === this.currentRecipientId &&
        !this.fieldValues.get(f.id || '')
    );
    if (requiredMissing) {
      this.alert.failedAlert({
        content: 'Please complete all required fields',
        title: 'Incomplete'
      });
      return;
    }

    const fieldValuesPayload: IFieldValue[] = this.signatureFields
      .filter((f) => f.id && this.fieldValues.has(f.id))
      .map((f) => ({
        fieldId: f.id!,
        value: this.fieldValues.get(f.id!) || '',
        type: f.type,
        ...(f.type === 'attachment' && this.fieldValues.has(f.id! + '-filename')
          ? { filename: this.fieldValues.get(f.id! + '-filename') }
          : {})
      }));

    this.loadingSubmit.set(true);
    this.zilSignService
      .submitFieldValuesOutside(
        this.documentId,
        this.signerToken,
        fieldValuesPayload
      )
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          this.loadingSubmit.set(false);
          if (res.success) {
            this.router.navigate(['/outside/v4-zil-sign/success'], {
              queryParams: {
                token: this.signerToken,
                documentId: this.documentId
              }
            });
          } else {
            this.alert.failedAlert({
              content: 'Failed to submit signed fields',
              title: 'Error'
            });
          }
        }
      });
  }

  goBack(): void {
    if (this.isSignerMode) return;
    this.router.navigate(['/v4/manage/v4-business-tools/zil-sign']);
  }

  trackByRecipient(_index: number, recipient: IRecipient): number {
    return recipient.id;
  }

  trackByFieldType(_index: number, item: IFieldTypeOption): string {
    return item.type;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.addMoreTarget) {
      const target = event.target as HTMLElement;
      // Keep popover open when clicking the "+" button itself or anywhere
      // on a placed field wrapper (the click handlers there manage state).
      if (
        !target.closest('[data-add-more-btn]') &&
        !target.closest('[data-field-id]')
      ) {
        this.addMoreTarget = null;
        this.renderFieldsIntoOverlays();
        this.cdr.detectChanges();
      }
    }
  }

  private async generateThumbnail(page: any): Promise<string> {
    try {
      const viewport = page.getViewport({ scale: 0.2 });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: ctx, viewport }).promise;
      return canvas.toDataURL('image/png');
    } catch {
      return '';
    }
  }
}
