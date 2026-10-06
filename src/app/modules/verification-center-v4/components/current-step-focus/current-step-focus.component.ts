import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal
} from '@angular/core';
import { NgClass } from '@angular/common';
import {
  LucideAngularModule,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Lock,
  LockOpen
} from 'lucide-angular';
import { StepConfig, StepChecklistItem } from '../../models/verification-v4.model';
import { StepStatus } from '../../constants/verification-v4.constants';
import { EMAIL_PLACEHOLDER } from '../../data/verification-v4.data';

interface StepView {
  config: StepConfig;
  status: StepStatus;
  isDone: boolean;
  isLocked: boolean;
  isUnderReview: boolean;
  isActive: boolean;
  badge: string;
  cardClasses: string;
  itemsLabel: string;
  items: StepChecklistItem[];
  description: string;
  lockNote: string;
}

@Component({
  selector: 'app-current-step-focus',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, LucideAngularModule],
  templateUrl: './current-step-focus.component.html',
  styleUrl: './current-step-focus.component.scss'
})
export class CurrentStepFocusComponent {
  stepConfigs = input.required<StepConfig[]>();
  stepStatuses = input.required<StepStatus[]>();
  completedCount = input<number>(0);
  emailAddress = input<string>('');
  emailVerified = input<boolean>(false);
  phoneVerified = input<boolean>(false);

  actionClicked = output<string>();

  readonly ArrowRight = ArrowRight;
  readonly Check = Check;
  readonly CheckCircle2 = CheckCircle2;
  readonly ChevronDown = ChevronDown;
  readonly Clock = Clock;
  readonly Lock = Lock;
  readonly LockOpen = LockOpen;

  readonly personaTooltip =
    'Persona is a secure, industry-standard identity verification partner used by leading financial platforms. Your information is encrypted and never shared.';

  private expandedKeys = signal<ReadonlySet<string>>(new Set<string>());

  steps = computed<StepView[]>(() => {
    const statuses = this.stepStatuses();
    const email = this.emailAddress();
    const verified: Record<string, boolean> = {
      email: this.emailVerified(),
      phone: this.phoneVerified()
    };

    return this.stepConfigs().map((config, i) => {
      const status = statuses[i] ?? 'locked';
      const isDone = status === 'completed';
      const isUnderReview = status === 'under-review';
      const isLocked = status === 'locked';

      return {
        config,
        status,
        isDone,
        isLocked,
        isUnderReview,
        isActive: !isDone && !isLocked && !isUnderReview,
        badge: this.badgeFor(status, config.id),
        cardClasses: this.cardClassesFor(status),
        itemsLabel: isDone ? config.doneItemsLabel : config.itemsLabel,
        items: (isDone ? config.doneItems : config.items).map((item) => {
          const itemVerified =
            !isDone && !!item.verifyKey && !!verified[item.verifyKey];
          const text =
            itemVerified && item.verifiedText ? item.verifiedText : item.text;

          return {
            ...item,
            text: text.replace(EMAIL_PLACEHOLDER, email),
            preVerified: itemVerified
          };
        }),
        description: isDone
          ? config.completedText
          : isUnderReview
            ? 'Review in progress.'
            : this.resolveDescription(config, verified),
        lockNote: config.lockNote ?? ''
      };
    });
  });

  private resolveDescription(
    config: StepConfig,
    verified: Record<string, boolean>
  ): string {
    const variants = config.descriptionVariants;
    if (!variants) return config.description;
    if (verified['email']) return variants.emailVerified;
    if (verified['phone']) return variants.phoneVerified;
    return variants.neither;
  }

  /**
   * Resolved as one string rather than an NgClass object: the per-state class
   * lists share `border` and the background token, and NgClass adds/removes
   * each class individually, so a false key strips classes a true key set.
   * Identical strings for two states would also collapse as duplicate keys.
   */
  private cardClassesFor(status: StepStatus): string {
    // Reference: every card carries min-height 380px except the completed one,
    // which collapses to its own content (0px). Returned as one resolved string
    // because NgClass objects with shared/identical keys clobber each other.
    const NEUTRAL =
      'bg-v4-tertiary-background-color border border-v4-border-color';

    switch (status) {
      case 'completed':
        return NEUTRAL;
      case 'under-review':
        return `min-h-[380px] bg-v4-tertiary-background-color border border-v4-border-warning`;
      case 'locked':
        return `min-h-[380px] ${NEUTRAL}`;
      default:
        return 'min-h-[380px] bg-v4-secondary-background-color border border-v4-primary-brand-color shadow-md';
    }
  }

  private badgeFor(status: StepStatus, id: number): string {
    if (status === 'completed') return 'Done';
    if (status === 'under-review') return 'Under Review';
    if (status === 'locked') return `Step ${id}`;
    return id === 1 ? 'Ready now' : 'Next up';
  }

  isExpanded(key: string): boolean {
    return this.expandedKeys().has(key);
  }

  toggleExpanded(key: string): void {
    const next = new Set(this.expandedKeys());
    if (!next.delete(key)) next.add(key);
    this.expandedKeys.set(next);
  }

  moreLabel(step: StepView): string {
    if (this.isExpanded(step.config.key)) return 'Hide';
    if (step.config.moreLabel) return step.config.moreLabel;
    const count = step.config.moreFeatures.length;
    return count > 3 ? `+${count} more` : `${count} ways`;
  }





  onAction(stepKey: string): void {
    this.actionClicked.emit(stepKey);
  }
}
