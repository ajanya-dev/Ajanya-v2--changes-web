import {
  Component,
  computed,
  effect,
  input,
  output,
  signal
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import {
  DetailSidePanelComponent,
  IDetailPanelStatusBadge
} from 'src/app/shared/V4/detail-side-panel/detail-side-panel.component';
import { PdDateTimeComponent } from 'src/app/shared/V4/pd-date-time/pd-date-time.component';
import { LogCodeBlockV4Component } from '../../../components/log-code-block-v4/log-code-block-v4.component';

type BadgeTone = 'success' | 'warning' | 'error' | 'neutral';

const STATUS_TONE: Record<string, BadgeTone> = {
  completed: 'success',
  pending: 'warning',
  failed: 'error'
};

@Component({
  selector: 'app-webhook-log-drawer-v4',
  standalone: true,
  imports: [
    LucideAngularModule,
    DetailSidePanelComponent,
    PdDateTimeComponent,
    LogCodeBlockV4Component
  ],
  templateUrl: './webhook-log-drawer-v4.component.html'
})
export class WebhookLogDrawerV4Component {
  isOpen = input(false);
  row = input<Record<string, unknown> | null>(null);
  payload = input<unknown>(null);
  closed = output<void>();

  isPanelExpanded = signal(false);
  collapsedCards = signal<Record<string, boolean>>({});

  status = computed(() => String(this.row()?.status ?? '').trim());
  eventId = computed(() => String(this.row()?.uu_id ?? '').trim());
  eventType = computed(() => String(this.row()?.event_type ?? '').trim());
  createdAt = computed(() =>
    String(
      this.row()?.formated_created_at ?? this.row()?.created_at ?? ''
    ).trim()
  );

  panelTitle = computed(() => this.eventType() || 'Webhook event');

  panelSubtitle = computed(() => this.createdAt());

  panelStatusBadge = computed<IDetailPanelStatusBadge | undefined>(() => {
    const status = this.status();
    if (!status) return undefined;
    const tone = STATUS_TONE[status.toLowerCase()] ?? 'neutral';
    return {
      text: status,
      color: `var(--v4-badge-${tone}-text-color)`,
      bgColor: `var(--v4-badge-${tone}-bg-color)`
    };
  });

  payloadJson = computed(() => {
    const p = this.payload();
    if (p === null || p === undefined) return '';
    if (typeof p === 'string') return p;
    try {
      return JSON.stringify(p, null, 2);
    } catch {
      return String(p);
    }
  });

  constructor() {
    effect(
      () => {
        this.row();
        this.collapsedCards.set({});
      },
      { allowSignalWrites: true }
    );
  }

  isCardCollapsed(key: string): boolean {
    return !!this.collapsedCards()[key];
  }

  toggleCard(key: string): void {
    this.collapsedCards.update((s) => ({ ...s, [key]: !s[key] }));
  }
}
