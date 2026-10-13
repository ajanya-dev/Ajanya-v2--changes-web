import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output
} from '@angular/core';
import { LucideAngularModule, ArrowRight, Clock } from 'lucide-angular';
import { ActionCaseKind } from '../../constants/verification-v4.constants';
import { VerificationActionCase } from '../../models/verification-v4.model';

/**
 * Lists every open compliance case (EDD, re-verification, missing details)
 * with why it is needed, what to have ready and one button that opens the
 * same flow the header badge opens. Neutral by default; amber only while a
 * deadline-bound case is open.
 */
@Component({
  selector: 'app-verification-action-required',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  templateUrl: './verification-action-required.component.html'
})
export class VerificationActionRequiredComponent {
  cases = input.required<VerificationActionCase[]>();
  actionClicked = output<ActionCaseKind>();

  readonly ArrowRight = ArrowRight;
  readonly Clock = Clock;

  urgent = computed(() => this.cases().some((c) => c.severity === 'warning'));

  deadlineLabel(c: VerificationActionCase): string {
    const days = c.daysRemaining;
    if (days == null) return '';
    if (days <= 0) return 'Deadline passed';
    return `${days} ${days === 1 ? 'day' : 'days'} left`;
  }
}
