import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faArrowUpRightFromSquare,
  faCheck,
  faChevronDown,
  faChevronLeft,
  faDownload,
  faEye,
  faEyeSlash,
  faFileLines,
  faLock,
  faMagnifyingGlassPlus
} from '@fortawesome/pro-solid-svg-icons';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import {
  IFormationDocumentExample,
  IInquiryDetails,
  IKybMissingField
} from '../../../../model/persona-v4';
import {
  FormationDocumentExampleModalComponent,
  IFormationDocumentExampleModalData
} from '../../../formation-document-example-modal/formation-document-example-modal.component';
import { IPusherResponse } from '../../../../model/persona-kyc-kyb-pusher';
import { categorizeField, TimelineCategory } from './field-map.util';
import {
  PreviewSection,
  buildPreviewSections,
  mapActiveCategoryToBucket
} from './right-panel-sections.util';

@Component({
  selector: 'app-persona-page-right-panel',
  standalone: true,
  imports: [CommonModule, FaIconComponent, MatTooltip],
  templateUrl: './right-panel.component.html',
  styleUrl: './right-panel.component.scss'
})
export class RightPanelComponent {
  inquiryId = input<string | undefined>(undefined);
  activeCategory = input<string | null>(null);
  inquiryDetails = input<IInquiryDetails | undefined>(undefined);
  /** True while inquiry details are being fetched — empty sections shimmer
   *  instead of asserting "Not started yet." before the data has landed. */
  detailsLoading = input<boolean>(false);
  /** Migration re-verify: outstanding fields (with live `filled` state) to badge per section. */
  missingFields = input<IKybMissingField[]>([]);
  attemptNumber = input<number | undefined>(undefined);
  maximumAllowedAttempt = input<number | undefined>(undefined);
  currentStep = input<string>('start-kyb');
  pusherResponse = input<{ data: IPusherResponse } | undefined>(undefined);
  pollStatus = input<'idle' | 'live' | 'completed'>('idle');
  sampleFormationDocument = input<string | undefined>(undefined);
  /** State-specific formation document guidance for the business's own state,
   *  or null when the backend couldn't resolve a US state (OCW-23337). */
  formationDocumentExample = input<IFormationDocumentExample | null>(null);
  /** Show the "Back" control (compact layout: returns to the form). */
  showBackButton = input<boolean>(false);

  /** Emitted when the user taps "Back" to return to the form panel. */
  back = output<void>();

  /** True once verification is finalized — drives the Review section status. */
  isFinalized = computed(
    () =>
      this.pollStatus() === 'completed' || !!this.pusherResponse()?.data.kyb_id
  );

  /** The fixed preview sections with status + summaries. */
  previewSections = computed<PreviewSection[]>(() =>
    buildPreviewSections(
      this.inquiryDetails(),
      this.activeCategory(),
      this.isFinalized()
    )
  );

  /** Field-map category → preview bucket id, for deriving a field's section
   *  when the backend didn't tag it explicitly. */
  private static readonly CATEGORY_TO_BUCKET: Partial<
    Record<TimelineCategory, PreviewSection['id']>
  > = {
    'Business Details': 'business',
    'Business Details (continued)': 'business-info',
    'Business Addresses': 'address',
    'Associated People': 'owners',
    'Associated People (continued)': 'owners',
    'KYC Details': 'identity',
    'Business Document Details': 'documents'
  };

  private resolveSection(field: IKybMissingField): PreviewSection['id'] | null {
    if (field.section) return field.section;
    return (
      RightPanelComponent.CATEGORY_TO_BUCKET[categorizeField(field.key)] ?? null
    );
  }

  /** Outstanding (not-yet-filled) required fields for a given preview section. */
  outstandingForSection(id: PreviewSection['id']): IKybMissingField[] {
    return this.missingFields().filter(
      (f) => !f.filled && this.resolveSection(f) === id
    );
  }

  /** Comma-joined labels of the outstanding fields for a section (for the badge). */
  outstandingLabels(id: PreviewSection['id']): string {
    return this.outstandingForSection(id)
      .map((f) => f.label)
      .join(', ');
  }

  /** Natural-language join of the outstanding labels: "A", "A and B", "A, B, and C". */
  outstandingPhrase(id: PreviewSection['id']): string {
    const labels = this.outstandingForSection(id).map((f) =>
      f.label.toLowerCase()
    );
    if (labels.length <= 1) return labels[0] ?? '';
    if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
    return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`;
  }

  pollStatusLabel = computed(() => {
    switch (this.pollStatus()) {
      case 'live':
        return 'Updating';
      case 'completed':
        return 'Completed';
      default:
        return 'Idle';
    }
  });

  /** The section matching the Persona page the user is on right now, if any. */
  private activeSectionId = computed<PreviewSection['id'] | null>(() =>
    mapActiveCategoryToBucket(this.activeCategory())
  );

  // Accordion open-state. Default: the 'current' section is open; explicit
  // user toggles override that default per section.
  private openOverrides = signal<Map<string, boolean>>(new Map());

  constructor() {
    // Follow the SDK's page-change events: when the user moves to a new Persona
    // page, expand that page's section and collapse the rest, so the panel
    // always previews what's on screen. An already-completed section is 'done'
    // rather than 'current', so the default open-state can't do this on its own
    // — the override map is rewritten instead, which also drops the previous
    // page's stale toggles.
    effect(
      () => {
        const activeId = this.activeSectionId();
        if (!activeId) return;
        untracked(() => {
          const next = new Map<string, boolean>();
          for (const s of this.previewSections()) {
            next.set(s.id, s.id === activeId);
          }
          this.openOverrides.set(next);
        });
        // After the view re-renders with the new open state, bring that section
        // into view — on a long list the expanded one can otherwise sit below
        // the fold, leaving the panel looking unchanged.
        setTimeout(() => this.scrollSectionIntoView(activeId));
      },
      { allowSignalWrites: true }
    );
  }

  private sectionsScroll =
    viewChild<ElementRef<HTMLElement>>('sectionsScroll');

  /** Scrolls the sections list so `id` sits at the top of the visible area. */
  private scrollSectionIntoView(id: PreviewSection['id']): void {
    const host = this.sectionsScroll()?.nativeElement;
    const el = host?.querySelector<HTMLElement>(`[data-section="${id}"]`);
    if (!host || !el) return;
    // Measured rather than offsetTop: the card's offsetParent isn't guaranteed
    // to be the scroll container. The 8px keeps it clear of the top edge.
    const top =
      el.getBoundingClientRect().top -
      host.getBoundingClientRect().top +
      host.scrollTop -
      8;
    host.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
  }

  isOpen(section: PreviewSection): boolean {
    const override = this.openOverrides().get(section.id);
    if (override !== undefined) return override;
    return section.status === 'current';
  }

  toggle(section: PreviewSection): void {
    const next = !this.isOpen(section);
    this.openOverrides.update((m) => {
      const copy = new Map(m);
      copy.set(section.id, next);
      return copy;
    });
  }

  private revealedFields = signal<Set<string>>(new Set());

  isFieldRevealed(key: string): boolean {
    return this.revealedFields().has(key);
  }

  toggleFieldVisibility(key: string): void {
    this.revealedFields.update((set) => {
      const next = new Set(set);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  private dialog = inject(MatDialog);
  private localStorageService = inject(LocalStorageService);

  /**
   * Opens the state-specific guidance over this dialog. A modal rather than a
   * route: the customer is mid-inquiry and navigating away risks abandoning a
   * partly-completed inquiry.
   */
  openFormationDocumentExamples(): void {
    const state = this.formationDocumentExample();
    if (!state) return;

    const isV4Flow =
      this.localStorageService.getItem('isV4LayoutEnabled') === 1;

    this.dialog.open<
      FormationDocumentExampleModalComponent,
      IFormationDocumentExampleModalData
    >(FormationDocumentExampleModalComponent, {
      width: '480px',
      maxWidth: '94vw',
      autoFocus: false,
      // `persona-modal-v4` carries the v4 colour tokens; this dialog is a
      // sibling panel of the verification modal so it can't inherit them.
      panelClass: isV4Flow
        ? ['formation-doc-modal', 'persona-modal-v4']
        : ['formation-doc-modal'],
      data: { state }
    });
  }

  openSampleFormationDocument(): void {
    const url = this.sampleFormationDocument();
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /** Open an uploaded ID/selfie photo in a new window (full-screen view). */
  openPhoto(url: string): void {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  readonly faArrowUpRightFromSquare = faArrowUpRightFromSquare;
  readonly faCheck = faCheck;
  readonly faChevronDown = faChevronDown;
  readonly faChevronLeft = faChevronLeft;
  readonly faDownload = faDownload;
  readonly faFileLines = faFileLines;
  readonly faEye = faEye;
  readonly faEyeSlash = faEyeSlash;
  readonly faLock = faLock;
  readonly faMagnifyingGlassPlus = faMagnifyingGlassPlus;

  /** Varied widths so the loading placeholder reads as text, not a block. */
  readonly skeletonRowWidths = [
    { label: '38%', value: '26%' },
    { label: '30%', value: '34%' },
    { label: '44%', value: '22%' }
  ];

  trackBySection = (_: number, s: PreviewSection) => s.id;
  trackByField = (_: number, f: { key: string }) => f.key;
}
