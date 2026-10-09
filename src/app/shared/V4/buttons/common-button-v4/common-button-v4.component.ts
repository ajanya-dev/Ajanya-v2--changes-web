import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faCaretDown } from '@fortawesome/pro-solid-svg-icons';
import { LucideAngularModule, LoaderCircle } from 'lucide-angular';
import { AngularMaterialModule } from 'src/app/modules/angular-material/angular-material.module';

export type TCButtonType =
  | {
      style:
        | 'primary'
        | 'secondary'
        | 'outline'
        | 'destructive'
        | 'neon'
        | 'warning';
      name: 'main';
    }
  | 'list'
  | 'round'
  | 'borderless'
  | {
      style:
        | 'green'
        | 'blue'
        | 'violet'
        | 'general'
        | 'red'
        | 'filled-red'
        | 'filled-green'
        | 'filled-blue';
      name: 'action' | 'list' | 'money-action';
    }
  | 'small'
  | { style: 'active' | 'inactive'; name: 'v4-tab' }
  | { style: 'active' | 'inactive'; name: 'v4-toggle' }
  | { style: 'primary' | 'outline'; name: 'compact' }
  | {
      style:
        | 'primary'
        | 'navy'
        | 'danger'
        | 'danger-strong'
        | 'muted'
        | 'success';
      name: 'v2-1';
      size?: 'md' | 'sm';
    };

/**
 * CommonButtonV4Component - A reusable button component with multiple style variants.
 *
 * @example
 * <!-- Primary main button -->
 * <app-common-button-v4
 *   [type]="{ style: 'primary', name: 'main' }"
 *   [text]="'Save Changes'"
 *   (clickEvent)="onSave()"
 * />
 *
 * @example
 * <!-- Secondary main button with loading state -->
 * <app-common-button-v4
 *   [type]="{ style: 'secondary', name: 'main' }"
 *   [text]="'Submit'"
 *   [loading]="isSubmitting"
 *   [disabled]="!form.valid"
 *   (clickEvent)="onSubmit()"
 * />
 *
 * @example
 * <!-- Outline main button with custom width -->
 * <app-common-button-v4
 *   [type]="{ style: 'outline', name: 'main' }"
 *   [text]="'Cancel'"
 *   [width]="'200px'"
 *   (clickEvent)="onCancel()"
 * />
 *
 * @example
 * <!-- Destructive main button -->
 * <app-common-button-v4
 *   [type]="{ style: 'destructive', name: 'main' }"
 *   [text]="'Delete'"
 *   (clickEvent)="onDelete()"
 * />
 *
 * @example
 * <!-- Neon main button -->
 * <app-common-button-v4
 *   [type]="{ style: 'neon', name: 'main' }"
 *   [text]="'Highlight Action'"
 *   (clickEvent)="onHighlight()"
 * />
 *
 * @example
 * <!-- Green action button with prefix icon -->
 * <app-common-button-v4
 *   [type]="{ style: 'green', name: 'action' }"
 *   [text]="'Approve'"
 *   [isAddIcon]="true"
 *   [icon]="['fas', 'check']"
 *   (clickEvent)="onApprove()"
 * />
 *
 * @example
 * <!-- Blue action button with suffix dropdown icon -->
 * <app-common-button-v4
 *   [type]="{ style: 'blue', name: 'action' }"
 *   [text]="'Options'"
 *   [suffix]="true"
 *   (clickEvent)="openOptions()"
 * />
 *
 * @example
 * <!-- Filled-red action button -->
 * <app-common-button-v4
 *   [type]="{ style: 'filled-red', name: 'action' }"
 *   [text]="'Reject'"
 *   (clickEvent)="onReject()"
 * />
 *
 * @example
 * <!-- Money action button (violet) -->
 * <app-common-button-v4
 *   [type]="{ style: 'violet', name: 'money-action' }"
 *   [text]="'Send Payment'"
 *   (clickEvent)="onSendPayment()"
 * />
 *
 * @example
 * <!-- List button -->
 * <app-common-button-v4
 *   [type]="'list'"
 *   [text]="'View All'"
 *   (clickEvent)="onViewAll()"
 * />
 *
 * @example
 * <!-- Round button -->
 * <app-common-button-v4
 *   [type]="'round'"
 *   [width]="'40px'"
 *   [isAddIcon]="true"
 *   [icon]="['fas', 'plus']"
 *   (clickEvent)="onAdd()"
 * />
 *
 * @example
 * <!-- Borderless button -->
 * <app-common-button-v4
 *   [type]="'borderless'"
 *   [text]="'Learn More'"
 *   (clickEvent)="onLearnMore()"
 * />
 *
 * @example
 * <!-- Small button with tooltip and custom classes -->
 * <app-common-button-v4
 *   [type]="'small'"
 *   [text]="'Info'"
 *   [toolTip]="'Click for more details'"
 *   [customClasses]="'my-custom-class'"
 *   [disableHoverEffect]="false"
 *   (clickEvent)="onInfo()"
 * />
 *
 * @example
 * <!-- Submit button inside a form -->
 * <app-common-button-v4
 *   [type]="{ style: 'primary', name: 'main' }"
 *   [text]="'Submit Form'"
 *   [btnType]="'submit'"
 *   [buttonId]="'form-submit-btn'"
 *   (clickEvent)="onFormSubmit()"
 * />
 */
@Component({
  selector: 'app-common-button-v4',
  templateUrl: './common-button-v4.component.html',
  styleUrls: ['./common-button-v4.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FontAwesomeModule,
    LucideAngularModule,
    AngularMaterialModule
  ]
})
export class CommonButtonV4Component {
  // Lucide icons
  readonly LoaderCircleIcon = LoaderCircle;

  /** Output event emitter for click events. */
  clickEvent = output<void>();
  /** Text to be displayed on the button. */
  text = input('Click Me!');
  /**
   * Type of the button, including specific style and name.
   * @required
   */
  type = input.required<TCButtonType>();
  /** Optional width of the button. Eg:- ```'10px'``` */
  width = input('');
  /** Optional min width of the button. Eg:- ```'10px'``` */
  minWidth = input('fit-content');
  /** Optional text class of the button text. Eg:- ```'leading-4'``` */
  textClasses = input('');
  /** Optional height of the button. Eg:- ```'10px'``` */
  customHeight = input('');
  /** Optional padding of the button. Eg:- ```'10px 20px'``` */
  customPadding = input('');
  /** Optional text color for the button. */
  textColorInput = input<string | undefined>(undefined);
  /** Optional flag indicating whether the button is in a loading state. */
  loading = input(false);
  /** Optional flag indicating whether the button is in a disabled state. */
  disabled = input(false);
  /** Boolean value to determine whether to display the icon on the button.
   * @default false
   */
  suffix = input(false);
  customClasses = input('');
  disableHoverEffect = input(true);
  /**
   * Icon Prop.
   * @default - faCaretDown
   */
  suffixIcon = input<IconProp>(faCaretDown);
  /** Optional background color for the button. */
  backGroundInput = input<string | undefined>(undefined);
  /** Boolean value to determine whether to display the icon on the button.
   * @default false
   */
  isAddIcon = input(false);
  /** Array representing the icon, typically in the format ['library', 'icon-name'].
   * @default['fas', 'plus']
   */
  icon = input<IconProp>(['fas', 'plus']);
  /** Optional Lucide icon name (e.g. 'copy', 'share-2'). When set, shows Lucide icon instead of FontAwesome. */
  lucideIcon = input<string | undefined>(undefined);
  /** Size for Lucide icon in pixels. @default 15 */
  lucideIconSize = input(15);
  /** Position of the icon (Lucide or FontAwesome) relative to the text. @default 'start' */
  iconPosition = input<'start' | 'end'>('start');
  /** When true, `lucideIcon` spins while `loading` is true instead of appending the separate loader spinner. */
  spinIconOnLoading = input(false);
  /** Optional tooltip for the button. */
  toolTip = input('');
  /** Accessible name for icon-only buttons; falls back to the tooltip when the button has no text. */
  ariaLabel = input<string | undefined>(undefined);

  accessibleName = computed(
    () => this.ariaLabel() || (this.text() ? undefined : this.toolTip() || undefined)
  );

  /** Optional tooltip for the button. */
  buttonId = input('');

  boxshadow = input('');

  // To style the tooltip
  toolTipClass = input('');

  btnType = input<'button' | 'submit' | 'reset'>('button');

  /** Custom hover styles. When provided, overrides the default hover effect with the given colors/font-size. */
  hoverStyle = input<
    { bgColor: string; textColor: string; fontSize?: string } | undefined
  >(undefined);

  /** Computed CSS class for compact variant hover overrides. */
  compactClass = computed(() => {
    const type = this.type();
    if (typeof type === 'object' && type.name === 'compact') {
      return ` compact-btn compact-${type.style}`;
    }
    return '';
  });

  /** CSS classes for the `v2-1` family, styled entirely in SCSS. */
  v21Class = computed(() => {
    const type = this.type();
    if (typeof type === 'object' && type.name === 'v2-1') {
      return ` v21-btn v21-${type.style} v21-${type.size ?? 'md'}`;
    }
    return '';
  });

  /** Computed CSS class for outline `main` variant hover overrides. */
  outlineMainClass = computed(() => {
    const type = this.type();
    if (
      typeof type === 'object' &&
      type.name === 'main' &&
      type.style === 'outline'
    ) {
      return ' outline-main-btn';
    }
    return '';
  });

  /** Styles to be applied to the button. */
  styles = computed(() => {
    const type = this.type();
    const isV4Tab = typeof type === 'object' && type.name === 'v4-tab';
    const isV4Toggle = typeof type === 'object' && type.name === 'v4-toggle';
    const isCompact = typeof type === 'object' && type.name === 'compact';
    const isV21 = typeof type === 'object' && type.name === 'v2-1';
    const isV4Active =
      (isV4Tab || isV4Toggle) &&
      (type as { style?: string }).style === 'active';

    return {
      backgroundColor: this.backGround,
      width: isCompact ? this.width() || '100%' : this.width(),
      borderRadius: this.borderRadius,
      height: isV21 ? undefined : this.height,
      padding: isV21
        ? undefined
        : this.customPadding() ||
          (isV4Tab || isV4Toggle ? '0px 16px' : '0px 10px 0px 10px'),
      color: this.textColor,
      fontSize: this.hoverStyle()?.fontSize ?? this.fontSize,
      fontFamily: 'var(--font-peridot)',
      border: this.border,
      fontWeight: this.fontWeight,
      minWidth: this.minWidth(),
      maxWidth: '100%',
      letterSpacing: isV21 ? 'normal' : '.5px',
      boxShadow: isV4Active
        ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        : this.boxshadow()
    } as Partial<CSSStyleDeclaration>;
  });

  /**
   * Retrieves the height of the button based on its type.
   * @returns The height in pixels as a string.
   */
  get height(): string {
    const type = this.type();
    const customHeight = this.customHeight();
    if (customHeight) return customHeight;
    if (typeof type === 'object' && type.name === 'main') return '44px';
    if (
      typeof type === 'object' &&
      (type.name === 'v4-tab' || type.name === 'v4-toggle')
    )
      return type.name === 'v4-tab' ? '44px' : '38px';
    if (
      typeof type === 'object' &&
      (type.name === 'action' ||
        type.name === 'list' ||
        type.name === 'money-action')
    )
      return '32px'; // ZM in-table tier
    if (type === 'list') return '28px';
    if (type === 'round') return this.width() ?? '25px';
    if (typeof type === 'object' && type.name === 'compact') return '32px';
    return '44px';
  }

  /**
   * Retrieves the border radius of the button based on its type.
   * @returns The border radius in pixels as a string.
   */
  get borderRadius() {
    const type = this.type();
    if (typeof type === 'object' && type.name === 'v2-1') return undefined;
    if (type === 'round') return '50%';
    if (typeof type === 'object' && type.name === 'main') return 'var(--radius-lg)'; // ZM 8px
    if (
      typeof type === 'object' &&
      (type.name === 'v4-tab' || type.name === 'v4-toggle')
    )
      return 'var(--radius-md)';
    if (typeof type === 'object' && type.name === 'compact')
      return 'var(--radius-sm)';
    return 'var(--radius-lg)';
  }

  /**
   * Retrieves the text color of the button based on its type.
   * @returns The text color as a CSS color value or undefined if not determined.
   */
  get textColor() {
    const type = this.type();
    if (typeof type === 'object' && type.name === 'v2-1') return undefined;
    const textColorInput = this.textColorInput();
    if (textColorInput) return textColorInput;
    if (type === 'list') return 'white';
    if (type === 'small') return 'white';
    if (typeof type === 'object' && type.name === 'main') {
      if (type.style === 'primary') return 'white'; // ZM: white on Cerulean (4.6:1)
      if (type.style === 'secondary') return 'var(--v4-main-text-color)';
      if (type.style === 'outline') return 'var(--v4-primary-brand-bold-color)';
      if (type.style === 'destructive') return 'white';
      if (type.style === 'neon') return 'white'; // ZM: neon retired, renders as primary
      if (type.style === 'warning') return 'var(--v4-badge-warning-text-color)';
    }
    if (typeof type === 'object' && type.name === 'v4-tab') {
      return type.style === 'active'
        ? 'white'
        : 'var(--v4-main-text-color)';
    }
    if (typeof type === 'object' && type.name === 'v4-toggle') {
      return type.style === 'active' ? 'white' : 'var(--v4-main-text-color)';
    }
    if (
      typeof type === 'object' &&
      (type.name === 'action' || type.name === 'list')
    ) {
      if (type.style === 'violet') return 'var(--v4-common-violet-color)';
      if (type.style === 'green') return 'var(--v4-common-green-color)';
      if (type.style === 'blue') return 'var(--v4-common-blue-color)';
      if (type.style === 'red') return 'var(--v4-common-red-color)';
      if (type.style === 'filled-green') return '#FFFFFF';
      if (type.style === 'filled-red') return '#FFFFFF';
      if (type.style === 'filled-blue') return '#FFFFFF';
      if (type.style === 'general') return textColorInput;
    }
    if (typeof type === 'object' && type.name === 'money-action') {
      if (type.style === 'violet') return '#FFFFFF';
      if (type.style === 'green') return '#FFFFFF';
      if (type.style === 'blue') return '#FFFFFF';
      if (type.style === 'general') return textColorInput;
    }
    if (typeof type === 'object' && type.name === 'compact') {
      if (type.style === 'primary') return 'white';
      if (type.style === 'outline') return 'var(--v4-secondary-text-color)';
    }
    return undefined;
  }

  /**
   * Retrieves the background color of the button based on its type.
   * @returns The background color as a CSS color value or undefined if not determined.
   */
  get backGround() {
    const type = this.type();
    if (typeof type === 'object' && type.name === 'v2-1') return undefined;
    const backGroundInput = this.backGroundInput();
    if (type === 'borderless') return 'transparent';
    if (backGroundInput) return backGroundInput;
    if (type === 'list') return 'var(--v4-common-blue-color)';
    if (type === 'small') return 'var(--v4-common-blue-color)';
    if (typeof type === 'object' && type.name === 'main') {
      if (type.style === 'primary') return 'var(--v4-primary-brand-color)';
      if (type.style === 'secondary')
        return 'var(--v4-secondary-background-color)';
      if (type.style === 'outline')
        return 'var(--v4-secondary-background-color)';
      if (type.style === 'destructive') return 'var(--v4-common-red-color)';
      if (type.style === 'neon') return 'var(--v4-primary-brand-color)';
      if (type.style === 'warning')
        return 'var(--v4-secondary-background-color)';
    }
    if (typeof type === 'object' && type.name === 'v4-tab') {
      return type.style === 'active'
        ? 'var(--v4-primary-brand-color)'
        : 'var(--v4-popup-background-color)';
    }
    if (typeof type === 'object' && type.name === 'v4-toggle') {
      return type.style === 'active'
        ? 'var(--v4-primary-brand-color)'
        : 'transparent';
    }
    if (
      typeof type === 'object' &&
      (type.name === 'action' || type.name === 'list')
    ) {
      if (type.style === 'violet') return 'var(--v4-badge-accent-bg-color)';
      if (type.style === 'green') return 'var(--v4-badge-success-bg-color)';
      if (type.style === 'blue') return 'var(--v4-badge-info-bg-color)';
      if (type.style === 'red') return 'var(--v4-badge-error-bg-color)';
      if (type.style === 'filled-red') return 'var(--v4-common-red-color)';
      if (type.style === 'filled-green') return 'var(--v4-common-green-color)';
      if (type.style === 'filled-blue') return 'var(--v4-common-blue-color)';
      if (type.style === 'general') return backGroundInput;
    }
    if (typeof type === 'object' && type.name === 'money-action') {
      if (type.style === 'violet') return 'var(--v4-common-violet-color)';
      if (type.style === 'green') return 'var(--v4-common-green-color)';
      if (type.style === 'blue') return 'var(--v4-common-blue-color)';
      if (type.style === 'general') return backGroundInput;
    }
    if (typeof type === 'object' && type.name === 'compact') {
      if (type.style === 'primary') return 'var(--v4-primary-brand-color)';
      if (type.style === 'outline') return 'var(--v4-input-background-color)';
    }
    return undefined;
  }

  /**
   * Retrieves the font size of the button based on its type.
   * @returns The font size in pixels as a string.
   */
  get fontSize() {
    const type = this.type();
    if (typeof type === 'object' && type.name === 'v2-1') return undefined;
    if (typeof type === 'object' && type.name === 'compact') return '13px';
    const customHeight = this.customHeight();
    if (customHeight === '32px') return '13px';
    if (customHeight === '24px') return '11px';
    if (typeof type === 'object' && type.name === 'main') return '14px';
    if (typeof type === 'object' && type.name === 'v4-tab') return '13px';
    if (typeof type === 'object' && type.name === 'v4-toggle') return '14px';
    if (typeof type === 'object' && type.name === 'action') return '14px';
    if (typeof type === 'object' && type.name === 'list') return '13px';
    if (type === 'list') return '13px';
    return '14px';
  }

  /**
   * Retrieves the border style of the button based on its type.
   * @returns The border style as a CSS border value or undefined if not determined.
   */
  get border() {
    const type = this.type();
    const textColorInput = this.textColorInput();
    if (type === 'borderless') return 'none';
    if (
      typeof type === 'object' &&
      type.name === 'main' &&
      type.style === 'outline'
    ) {
      if (textColorInput) return `2px solid ${textColorInput}`;
      return '2px solid var(--v4-primary-brand-color)';
    }
    if (
      typeof type === 'object' &&
      type.name === 'main' &&
      type.style === 'warning'
    ) {
      return '2px solid var(--v4-badge-warning-text-color)';
    }
    if (typeof type === 'object' && type.name === 'v4-tab') {
      return type.style === 'active'
        ? '2px solid var(--v4-primary-brand-color)'
        : '2px solid var(--v4-input-border-color)';
    }
    if (typeof type === 'object' && type.name === 'v4-toggle') {
      return 'none';
    }
    if (typeof type === 'object' && type.name === 'compact') {
      if (type.style === 'outline')
        return '1px solid var(--v4-input-border-color)';
      return 'none';
    }
    return undefined;
  }

  /**
   * Retrieves the font weight of the button based on its type.
   * @returns The font weight as a CSS font weight value.
   */
  get fontWeight() {
    const type = this.type();
    if (typeof type === 'object' && type.name === 'main') return '600';
    if (
      typeof type === 'object' &&
      (type.name === 'action' || type.name === 'list')
    )
      return '600';
    if (type === 'list') return '500';
    if (typeof type === 'object' && type.name === 'compact') return '500';
    return '600';
  }

  /**
   * Event handler for button click events.
   */
  onClick() {
    this.clickEvent.emit();
  }
}
