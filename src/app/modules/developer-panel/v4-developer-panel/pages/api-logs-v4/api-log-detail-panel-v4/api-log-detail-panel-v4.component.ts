import {
  Component,
  computed,
  effect,
  input,
  output,
  signal
} from '@angular/core';
import { NgClass } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { IApiSettingsDetails } from 'src/app/models/developer';
import {
  DetailSidePanelComponent,
  IDetailPanelStatusBadge
} from 'src/app/shared/V4/detail-side-panel/detail-side-panel.component';
import { PdSkeletonComponent } from 'src/app/shared/V4/pd-skeleton/pd-skeleton.component';
import { PdDateTimeComponent } from 'src/app/shared/V4/pd-date-time/pd-date-time.component';
import { LogCodeBlockV4Component } from '../../../components/log-code-block-v4/log-code-block-v4.component';

type BodyTab = 'request' | 'response';

export const httpStatusTone = (
  status: string
): 'success' | 'warning' | 'error' | 'neutral' => {
  switch (status.trim().charAt(0)) {
    case '2':
      return 'success';
    case '3':
      return 'warning';
    case '4':
    case '5':
      return 'error';
    default:
      return 'neutral';
  }
};

const prettyJson = (raw?: string | null): string => {
  if (!raw) return '';
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
};

@Component({
  selector: 'app-api-log-detail-panel-v4',
  standalone: true,
  imports: [
    NgClass,
    LucideAngularModule,
    DetailSidePanelComponent,
    PdSkeletonComponent,
    PdDateTimeComponent,
    LogCodeBlockV4Component
  ],
  templateUrl: './api-log-detail-panel-v4.component.html'
})
export class ApiLogDetailPanelV4Component {
  isOpen = input(false);
  loading = input(false);
  log = input<IApiSettingsDetails | null>(null);
  closed = output<void>();

  isPanelExpanded = signal(false);
  collapsedCards = signal<Record<string, boolean>>({});
  activeTab = signal<BodyTab>('request');

  readonly tabs: { key: BodyTab; label: string }[] = [
    { key: 'request', label: 'Request' },
    { key: 'response', label: 'Response' }
  ];

  responseStatus = computed(() =>
    String(this.log()?.responseStatus ?? '').trim()
  );

  panelTitle = computed(() => {
    const l = this.log();
    const text = [l?.method, l?.endPoint]
      .map((p) => String(p ?? '').trim())
      .filter(Boolean)
      .join(' ');
    return text || 'API request';
  });

  panelSubtitle = computed(() => {
    const l = this.log();
    return [l?.eventId, l?.CreatedAt]
      .map((p) => String(p ?? '').trim())
      .filter(Boolean)
      .join(' · ');
  });

  panelStatusBadge = computed<IDetailPanelStatusBadge | undefined>(() => {
    const status = this.responseStatus();
    if (!status) return undefined;
    const tone = httpStatusTone(status);
    return {
      text: status,
      color: `var(--v4-badge-${tone}-text-color)`,
      bgColor: `var(--v4-badge-${tone}-bg-color)`,
      preserveText: true
    };
  });

  activeJson = computed(() =>
    prettyJson(
      this.activeTab() === 'request'
        ? this.log()?.requestBody
        : this.log()?.responseBody
    )
  );

  constructor() {
    effect(
      () => {
        this.log();
        this.collapsedCards.set({});
        this.activeTab.set('request');
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
