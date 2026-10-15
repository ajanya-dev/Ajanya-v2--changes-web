import { Component, inject, signal, Signal } from '@angular/core';
import {
  LucideAngularModule,
  HelpCircle,
  ShieldQuestion,
  ChevronDown,
  ChevronUp
} from 'lucide-angular';
import { DOUBLE_SIDE_PANEL_DATA } from 'src/app/shared/modal/custom-double-side-modal/custom-double-side-modal.tokens';

interface IInstructionsPanelData {
  country: Signal<'USA' | 'CANADA'>;
}

@Component({
  selector: 'app-add-bank-instructions-panel',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './add-bank-instructions-panel.component.html'
})
export class AddBankInstructionsPanelComponent {
  private panelData = inject<IInstructionsPanelData | null>(
    DOUBLE_SIDE_PANEL_DATA
  );

  readonly HelpCircleIcon = HelpCircle;
  readonly ShieldQuestionIcon = ShieldQuestion;
  readonly ChevronDownIcon = ChevronDown;
  readonly ChevronUpIcon = ChevronUp;

  readonly instructionUrl =
    'https://support.onlinecheckwriter.com/portal/kb/articles/how-can-i-add-canadian-bank-account';

  expandedFaq = signal<number | null>(null);

  readonly faqItems = [
    {
      question: 'Why do I need to put information for pre-printed checks?',
      answer:
        'The information you provide is used to print on your checks. This includes your company name, address, bank details, and routing/account numbers. Accurate information ensures your checks are valid and processed correctly.'
    },
    {
      question: "Don't want to share my information",
      answer:
        'Your information is securely encrypted and stored. We only use it to facilitate your banking operations such as printing checks and processing payments. We never share your information with third parties without your consent.'
    }
  ];

  get isCanada(): boolean {
    return this.panelData?.country() === 'CANADA';
  }

  toggleFaq(index: number): void {
    this.expandedFaq.update((current) => (current === index ? null : index));
  }
}
