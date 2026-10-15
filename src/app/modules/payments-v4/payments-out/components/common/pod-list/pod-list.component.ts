import { PdShowMoreComponent } from 'src/app/shared/V4/pd-show-more/pd-show-more.component';
import { Component, computed, input, output, signal } from '@angular/core';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  LucideAngularModule
} from 'lucide-angular';
import { PdDateTimeComponent } from 'src/app/shared/V4/pd-date-time/pd-date-time.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { NgTemplateOutlet } from '@angular/common';
import { PdEmptyStateComponent } from 'src/app/shared/V4/pd-empty-state/pd-empty-state.component';

export interface IPodEntry {
  date: string;
  user: string;
  file: string;
  note?: string;
  publicUrl?: string;
}

@Component({
  standalone: true,
  selector: 'app-po-pod-list',
  templateUrl: './pod-list.component.html',
  styleUrls: ['./pod-list.component.scss'],
  imports: [
    PdEmptyStateComponent,
    PdShowMoreComponent,
    LucideAngularModule,
    PdDateTimeComponent,
    CommonButtonV4Component,
    NgTemplateOutlet
  ]
})
export class PoPodListComponent {
  readonly externalLinkIcon = ExternalLink;
  readonly ChevronDownIcon = ChevronDown;
  readonly ChevronUpIcon = ChevronUp;
  collapsed = signal(false);

  podList = input<IPodEntry[] | null>(null);
  /** Opt-in: renders the icon + title + hint empty state instead of the plain sentence. */
  emptyHint = input('');
  maxHeight = input<string | null>('400px');
  /** Embedded flush in a host card: drop our own frame and title header. */
  bare = input(false);
  /** Rows shown before the "Show N more" link. 0 = uncapped (the default). */
  collapsedCount = input<number>(0);
  /** Show every row and drop the link — the expanded panel scrolls instead. */
  forceExpand = input<boolean>(false);
  /** Whether this payment still accepts a proof-of-delivery send or request. */
  canSend = input(false);

  showAll = signal(false);

  visiblePod = computed(() => {
    const list = this.podList() ?? [];
    const cap = this.collapsedCount();
    return this.showAll() || this.forceExpand() || !cap
      ? list
      : list.slice(0, cap);
  });

  canShowMore = computed(
    () =>
      !this.forceExpand() &&
      !!this.collapsedCount() &&
      (this.podList()?.length ?? 0) > this.collapsedCount()
  );

  hiddenCount = computed(
    () => (this.podList()?.length ?? 0) - this.collapsedCount()
  );

  sendProof = output<void>();
  closed = output<void>();

  toggleFold(): void {
    this.collapsed.update((v) => !v);
  }
}
