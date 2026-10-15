import {
  Component,
  DestroyRef,
  OnDestroy,
  ViewEncapsulation,
  inject,
  input,
  output
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import { IGoogleAddress } from 'src/app/modules/more/model/google-autocomplete';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';

@Component({
  selector: 'app-address-autocomplete-v4',
  standalone: true,
  imports: [ReactiveFormsModule, CommonInputFieldV4Component],
  templateUrl: './address-autocomplete-v4.component.html',
  styles: [
    `
      .pac-container {
        position: fixed !important;
        z-index: 10002 !important;
        margin-top: 4px !important;
        padding: 4px !important;
        border: 1px solid var(--v4-border-color) !important;
        border-radius: 12px !important;
        background-color: var(--v4-secondary-background-color) !important;
        box-shadow: 0 8px 24px rgb(0 0 0 / 18%) !important;
        font-family: var(--font-peridot), sans-serif !important;
      }

      .pac-container .pac-item {
        padding: 8px 10px !important;
        border-top: none !important;
        border-radius: 8px !important;
        color: var(--v4-secondary-text-color) !important;
        font-size: 13px !important;
        line-height: 1.35 !important;
        cursor: pointer;
      }

      .pac-container .pac-item:hover,
      .pac-container .pac-item-selected {
        background-color: var(--v4-input-background-color) !important;
      }

      .pac-container .pac-item-query,
      .pac-container .pac-matched {
        color: var(--v4-main-text-color) !important;
        font-size: 13px !important;
        font-weight: 500 !important;
      }

      .pac-container .pac-icon {
        margin-top: 2px !important;
        opacity: 0.6;
      }
    `
  ],
  encapsulation: ViewEncapsulation.None
})
export class AddressAutocompleteV4Component implements OnDestroy {
  private googleAddressService = inject(GoogleAddressService);
  private destroyRef = inject(DestroyRef);

  label = input('');
  placeholder = input('Address Line 1');
  control = input<FormControl>();
  allowedCountries = input<string[]>(['us', 'ca']);
  /**
   * Emit the ISO2 country code (`US`) instead of the full name (`United States`).
   * Set this when the country is bound to a select that stores codes, so the
   * value doesn't have to be reconciled from a name after patching.
   */
  displayShortName = input(false);
  /** @deprecated Binding is per input element now; kept so existing templates still compile. */
  addressInstance = input<number | undefined>(undefined);
  maxLength = input(150);
  isFieldRequired = input(true);
  inputId = input<string>();
  readOnly = input(false);
  isInvalid = input(false);

  addressSelected = output<IGoogleAddress>();

  private subscribed = false;
  private rafId: number | null = null;
  private inputEl: HTMLInputElement | null = null;

  ngOnDestroy(): void {
    this.stopPacTracking();
    this.googleAddressService.resetGoogleAutocompleteAPI();
  }

  onFocus(inputEl: HTMLInputElement): void {
    if (this.readOnly()) return;
    this.inputEl = inputEl;
    // Bound per input element, so several of these components on one screen - one per row
    // of the payee table, for example - each get their own dropdown, whichever the user
    // touches first. Re-binding the same element is a no-op.
    this.googleAddressService.attachAutocomplete({
      addressElement: inputEl,
      allowedCountries: this.allowedCountries(),
      displayShortName: this.displayShortName()
    });

    this.startPacTracking(inputEl);

    if (!this.subscribed) {
      this.subscribed = true;
      this.googleAddressService.googleAddress$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((res: IGoogleAddress) => {
          if (res.sourceElement && res.sourceElement !== this.inputEl) {
            return;
          }
          this.addressSelected.emit(res);
        });
    }
  }

  onBlur(): void {
    this.stopPacTracking();
  }

  private startPacTracking(inputEl: HTMLInputElement): void {
    this.stopPacTracking();

    const update = () => {
      const rect = inputEl.getBoundingClientRect();
      document.querySelectorAll<HTMLElement>('.pac-container').forEach(pac => {
        pac.style.top = `${rect.bottom}px`;
        pac.style.left = `${rect.left}px`;
        pac.style.width = `${rect.width}px`;
      });
      this.rafId = requestAnimationFrame(update);
    };

    this.rafId = requestAnimationFrame(update);
  }

  private stopPacTracking(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}
