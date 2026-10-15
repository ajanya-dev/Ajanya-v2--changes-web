import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  effect,
  InputSignal,
  input
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faCaretDown } from '@fortawesome/pro-solid-svg-icons';
import { AngularMaterialModule } from 'src/app/modules/angular-material/angular-material.module';

export type TCButtonType =
  | { style: 'filled' | 'bordered' | 'modal'; name: 'main' }
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
  | 'small';

/**
 * CommonButtonV35Component represents a common button component for v3.5.
 */
@Component({
  selector: 'app-common-button-v35',
  templateUrl: './common-button-v35.component.html',
  styleUrls: ['./common-button-v35.component.scss'],
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, AngularMaterialModule]
})
export class CommonButtonV35Component implements OnInit {
  /** Output event emitter for click events. */
  @Output() clickEvent = new EventEmitter<never>();
  /** Text to be displayed on the button. */
  @Input() text = 'Click Me!';
  /**
   * Type of the button, including specific style and name.
   * @required
   */
  @Input({ required: true }) type: TCButtonType;
  /** Optional width of the button. Eg:- ```'10px'``` */
  width: InputSignal<string> = input<string>('');
  /** Optional min width of the button. Eg:- ```'10px'``` */
  minWidth: InputSignal<string> = input<string>('fit-content');
  /** Optional text class of the button text. Eg:- ```'leading-4'``` */
  textClasses: InputSignal<string> = input<string>('');
  /** Optional height of the button. Eg:- ```'10px'``` */
  @Input() customHeight = '';
  /** Optional text color for the button. */
  @Input() textColorInput?: string;
  /** Optional flag indicating whether the button is in a loading state. */
  @Input() loading = false;
  /** Optional flag indicating whether the button is in a disabled state. */
  @Input() disabled = false;
  /** Boolean value to determine whether to display the icon on the button.
   * @default false
   */
  @Input() suffix = false;
  @Input() customClasses: string = '';
  @Input() disableHoverEffect: boolean = false;
  /**
   * Icon Prop.
   * @default - faCaretDown
   */
  @Input() suffixIcon: IconProp = faCaretDown;
  /** Optional background color for the button. */
  @Input() backGroundInput?: string;
  /** Boolean value to determine whether to display the icon on the button.
   * @default false
   */
  @Input() isAddIcon = false;
  /** Array representing the icon, typically in the format ['library', 'icon-name'].
   * @default['fas', 'plus']
   */
  @Input() icon: IconProp = ['fas', 'plus'];
  /** Optional tooltip for the button. */
  @Input() toolTip = '';
  /** Optional tooltip for the button. */
  buttonId: InputSignal<string> = input<string>('');

  @Input() boxshadow = '';

  // To style the tooltip
  @Input() toolTipClass = '';

  btnType = input<'button' | 'submit' | 'reset'>('button');

  /** Styles to be applied to the button. */
  styles: Partial<CSSStyleDeclaration>;

  constructor() {
    effect(() => {
      this.setStyles();
    });
  }

  ngOnInit(): void {
    this.setStyles();
  }

  /** Method for styles when input changes */
  setStyles() {
    this.styles = {
      backgroundColor: this.backGround,
      width: this.width(),
      borderRadius: this.borderRadius,
      height: this.height,
      padding: '0px 10px 0px 10px',
      color: this.textColor,
      fontSize: this.fontSize,
      fontFamily: 'var(--roboto)',
      border: this.border,
      fontWeight: this.fontWeight,
      minWidth: this.minWidth(),
      maxWidth: '100%',
      letterSpacing: '.5px',
      boxShadow: this.boxshadow
    };
  }

  /**
   * Retrieves the height of the button based on its type.
   * @returns The height in pixels as a string.
   */
  get height(): string {
    if (typeof this.type === 'object' && this.type.name === 'main')
      return '38px';
    if (
      typeof this.type === 'object' &&
      (this.type.name === 'action' ||
        this.type.name === 'list' ||
        this.type.name === 'money-action')
    )
      return '30px';
    if (this.type === 'list') return '28px';
    if (this.type === 'round') return this.width() ?? '25px';
    return this.customHeight ? this.customHeight : '25px';
  }

  /**
   * Retrieves the border radius of the button based on its type.
   * @returns The border radius in pixels as a string.
   */
  get borderRadius() {
    if (this.type === 'round') return '50%';
    if (typeof this.type === 'object' && this.type.name === 'main')
      return '5px';
    return '3px';
  }

  /**
   * Retrieves the text color of the button based on its type.
   * @returns The text color as a CSS color value or undefined if not determined.
   */
  get textColor() {
    if (this.textColorInput) return this.textColorInput;
    if (this.type === 'list') return 'white';
    if (this.type === 'small') return 'white';
    if (typeof this.type === 'object' && this.type.name === 'main') {
      if (this.type.style === 'filled') return 'white';
      if (this.type.style === 'modal') return 'white';
      if (this.type.style === 'bordered') return 'var(--common-blue-color)';
    }
    if (
      typeof this.type === 'object' &&
      (this.type.name === 'action' || this.type.name === 'list')
    ) {
      if (this.type.style === 'violet') return 'var(--common-violet-color)';
      if (this.type.style === 'green') return 'var(--common-green-color)';
      if (this.type.style === 'blue') return 'var(--common-blue-color)';
      if (this.type.style === 'red') return 'var(--common-red-color)';
      if (this.type.style === 'filled-green') return '#FFFFFF';
      if (this.type.style === 'filled-red') return '#FFFFFF';
      if (this.type.style === 'filled-blue') return '#FFFFFF';
      if (this.type.style === 'general') return this.textColorInput;
    }
    if (typeof this.type === 'object' && this.type.name === 'money-action') {
      if (this.type.style === 'violet') return '#FFFFFF';
      if (this.type.style === 'green') return '#FFFFFF';
      if (this.type.style === 'blue') return '#FFFFFF';
      if (this.type.style === 'general') return this.textColorInput;
    }
    return undefined;
  }

  /**
   * Retrieves the background color of the button based on its type.
   * @returns The background color as a CSS color value or undefined if not determined.
   */
  get backGround() {
    if (this.type === 'borderless') return 'transparent';
    if (this.backGroundInput) return this.backGroundInput;
    if (this.type === 'list') return 'var(--common-blue-color)';
    if (this.type === 'small') return 'var(--common-blue-color)';
    if (typeof this.type === 'object' && this.type.name === 'main') {
      if (this.type.style === 'filled') return 'var(--common-blue-color)';
      if (this.type.style === 'modal') return 'var(--common-dark-blue-color)';
      if (this.type.style === 'bordered') return 'var(--main-background-color)';
    }
    if (
      typeof this.type === 'object' &&
      (this.type.name === 'action' || this.type.name === 'list')
    ) {
      if (this.type.style === 'violet')
        return 'var(--common-secondary-violet-color)';
      if (this.type.style === 'green')
        return 'var(--common-secondary-green-color)';
      if (this.type.style === 'blue')
        return 'var(--common-secondary-blue-color)';
      if (this.type.style === 'red') return 'var(--common-secondary-red-color)';
      if (this.type.style === 'filled-red') return 'var(--common-red-color)';
      if (this.type.style === 'filled-green')
        return 'var(--common-green-color)';
      if (this.type.style === 'filled-blue') return 'var(--common-blue-color)';
      if (this.type.style === 'general') return this.backGroundInput;
    }
    if (typeof this.type === 'object' && this.type.name === 'money-action') {
      if (this.type.style === 'violet') return 'var(--common-violet-color)';
      if (this.type.style === 'green') return 'var(--common-green-color)';
      if (this.type.style === 'blue') return 'var(--common-blue-color)';
      if (this.type.style === 'general') return this.backGroundInput;
    }
    return undefined;
  }

  /**
   * Retrieves the font size of the button based on its type.
   * @returns The font size in pixels as a string.
   */
  get fontSize() {
    if (typeof this.type === 'object' && this.type.name === 'main')
      return '14px';
    if (typeof this.type === 'object' && this.type.name === 'action')
      return '14px';
    if (typeof this.type === 'object' && this.type.name === 'list')
      return '13px';
    if (this.type === 'list') return '12px';
    return '13px';
  }

  /**
   * Retrieves the border style of the button based on its type.
   * @returns The border style as a CSS border value or undefined if not determined.
   */
  get border() {
    if (this.type === 'borderless') return 'none';
    if (
      typeof this.type === 'object' &&
      this.type.name === 'main' &&
      this.type.style === 'bordered'
    ) {
      if (this.textColorInput) return `1px solid ${this.textColorInput}`;
      return '1px solid var(--common-blue-color)';
    }
    return undefined;
  }

  /**
   * Retrieves the font weight of the button based on its type.
   * @returns The font weight as a CSS font weight value.
   */
  get fontWeight() {
    if (typeof this.type === 'object' && this.type.name === 'main')
      return '600';
    if (
      typeof this.type === 'object' &&
      (this.type.name === 'action' || this.type.name === 'list')
    )
      return '600';
    if (this.type === 'list') return '500';
    return '600';
  }

  /**
   * @description Getter method to set classes for loading spinner in button.
   */
  get loadingSpinnerClass() {
    switch (this.textColor) {
      case 'white':
        return 'after:border-y-white';
      case '#FFFFFF':
        return 'after:border-y-white';
      case 'var(--main-text-color)':
        return 'after:border-y-main-text-color';
      case 'var(--common-green-color)':
        return 'after:border-y-common-green-color';
      case 'var(--common-blue-color)':
        return 'after:border-y-common-blue-color';
      case 'var(--common-red-color)':
        return 'after:border-y-common-red-color';
      default:
        return 'after:border-y-main-text-color';
    }
  }

  /**
   * Event handler for button click events.
   */
  onClick() {
    this.clickEvent.emit();
  }
}
