import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatTooltip } from '@angular/material/tooltip';
import {
  faArrowUpRightFromSquare,
  faCircleInfo,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import { IFormationDocumentExample } from '../../model/persona-v4';
import {
  accessCopy,
  documentNamesFromPages,
  limitationCopy,
  pageCaption
} from './formation-document-copy.util';

export interface IFormationDocumentExampleModalData {
  /** The state resolved from the customer's own application. */
  state: IFormationDocumentExample;
}

/**
 * State-specific formation document guidance (OCW-23337).
 *
 * Opened as a modal over the Persona verification dialog rather than as a
 * route: the customer is mid-inquiry and navigating away risks abandoning a
 * partly-completed inquiry.
 *
 * There is no state picker — the business's registered state is already known
 * from the application and arrives with `inquiry-details`, so the guidance is
 * fully seeded and the dialog needs no fetch of its own.
 *
 * The layout answers three questions in order: what to upload, what it looks
 * like, where to get it. None of the backend's raw config strings reach the
 * screen — see `formation-document-copy.util.ts`.
 */
@Component({
  selector: 'app-formation-document-example-modal',
  standalone: true,
  imports: [CommonModule, FaIconComponent, MatTooltip],
  templateUrl: './formation-document-example-modal.component.html',
  styleUrls: ['./formation-document-example-modal.component.scss']
})
export class FormationDocumentExampleModalComponent {
  private dialogRef =
    inject<MatDialogRef<FormationDocumentExampleModalComponent>>(MatDialogRef);

  private data = inject<IFormationDocumentExampleModalData>(MAT_DIALOG_DATA);

  /** Guidance for the state the business is registered in. */
  readonly state = this.data.state;

  /** Distinct documents the example pages describe, most relevant first. */
  readonly documentNames = documentNamesFromPages(this.state.pages);

  /** The document to lead with. */
  readonly primaryDocument = this.documentNames[0] ?? '';

  /** Equally acceptable alternatives, if the state issues more than one. */
  readonly alternateDocuments = this.documentNames.slice(1);

  /** What the customer can do on the state's own site. */
  readonly accessLine = accessCopy(this.state.document_access, this.state.name);

  /** The operational note in plain words, or null when it wasn't worth saying. */
  readonly limitationLine = limitationCopy(this.state.limitation);

  /** Host shown beside the link, so the destination isn't a mystery. */
  readonly websiteHost = this.hostOf(this.state.website_url);

  /** One row of thumbnails. A state can return up to five pages; showing them
   *  all would wrap to a second row and push "Don't have a copy?" — the part
   *  that actually unblocks the customer — below the fold. */
  private static readonly COLLAPSED_PAGE_COUNT = 3;

  pagesExpanded = signal<boolean>(false);

  visiblePages = computed(() =>
    this.pagesExpanded()
      ? this.state.pages
      : this.state.pages.slice(
          0,
          FormationDocumentExampleModalComponent.COLLAPSED_PAGE_COUNT
        )
  );

  readonly hasHiddenPages =
    this.state.pages.length >
    FormationDocumentExampleModalComponent.COLLAPSED_PAGE_COUNT;

  toggleAllPages(): void {
    this.pagesExpanded.update((open) => !open);
  }

  /** Page images that have finished downloading, so their shimmer can retire. */
  private loadedPages = signal<Set<string>>(new Set<string>());

  private failedPages = signal<Set<string>>(new Set<string>());

  isPageLoaded(url: string): boolean {
    return this.loadedPages().has(url);
  }

  isPageFailed(url: string): boolean {
    return this.failedPages().has(url);
  }

  onPageLoad(url: string): void {
    this.loadedPages.update((set) => new Set(set).add(url));
  }

  onPageError(url: string): void {
    this.failedPages.update((set) => new Set(set).add(url));
    // Retire the shimmer too — the slot now shows its own failure message.
    this.loadedPages.update((set) => new Set(set).add(url));
  }

  /** Short caption under a thumbnail; the full label is the tooltip. */
  captionFor(page: { label: string; url: string }): string {
    return pageCaption(page);
  }

  /** Open a page image full size — the thumbnail is deliberately small. */
  openPage(url: string): void {
    if (!url || this.isPageFailed(url)) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  close(): void {
    this.dialogRef.close();
  }

  private hostOf(url: string): string {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  }

  trackByPageUrl = (_: number, p: { url: string }) => p.url;

  readonly faArrowUpRightFromSquare = faArrowUpRightFromSquare;

  readonly faCircleInfo = faCircleInfo;

  readonly faXmark = faXmark;
}
