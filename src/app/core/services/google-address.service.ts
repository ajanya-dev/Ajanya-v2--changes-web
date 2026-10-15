import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import {
  IGoogleAddress,
  IGoogleAddressParams
} from '../../modules/more/model/google-autocomplete';

/**
 * @description Service for interacting with the Google Autocomplete API.
 */
@Injectable({
  providedIn: 'root'
})
export class GoogleAddressService {
  emptyAutoCompleteData = {
    address: '',
    city: '',
    state: '',
    zip: '',
    country: ''
  };

  private googleAutcompleteData: IGoogleAddress = this.emptyAutoCompleteData;
  private googleAutocompleteDataSubject = new Subject<IGoogleAddress>();
  private googleAutocompleteTimeout: ReturnType<typeof setTimeout>;

  private isAutocompleteAPILoaded = false;
  private addressInstanceCounter = 0;
  private instanceList: number[] = [];
  private multiCount: boolean;
  private boundElements = new WeakSet<HTMLInputElement>();
  private autocompletes: google.maps.places.Autocomplete[] = [];

  /**
   * @description Setter for the googleAddress property. Emits the provided data to subscribers.
   * @param data - The Google address data to emit.
   */
  set googleAddress(data: IGoogleAddress) {
    this.googleAutocompleteDataSubject.next(data);
  }

  /**
   * @description Getter for the googleAddress property. Returns an observable of the Google address data.
   */
  get googleAddress$() {
    return this.googleAutocompleteDataSubject.asObservable();
  }

  /**
   * Initiates the Google Autocomplete API logic.
   * @param googleAddressFunctionParams - Parameters for the Google Autocomplete API.
   */
  googleAutocomplete(googleAddressFunctionParams: IGoogleAddressParams) {
    clearTimeout(this.googleAutocompleteTimeout);

    this.googleAutocompleteTimeout = setTimeout(() => {
      if (googleAddressFunctionParams.addressInstance === undefined) {
        if (!this.isAutocompleteAPILoaded) {
          this.googleAutocompleteLogic(googleAddressFunctionParams);
          this.isAutocompleteAPILoaded = true;
        }
      } else {
        this.multipleGoogleAddressApiLogic(googleAddressFunctionParams);
      }
    }, 500);
  }

  /**
   * @description Binds Google Autocomplete to one specific input element, once per element.
   *
   * Use this when a view holds several address inputs at once - one per row of a table,
   * for example. Unlike `googleAutocomplete` there is no shared "already loaded" guard and
   * no instance counter, so every input binds regardless of focus order, and no
   * `.pac-container` cleanup, so binding one input does not kill a sibling's dropdown.
   *
   * Selections still arrive on `googleAddress$`, tagged with `sourceElement`; subscribers
   * match that against their own input to pick out the ones that belong to them.
   *
   * @param options Options for the Google Autocomplete API.
   */
  attachAutocomplete(options: IGoogleAddressParams, retry = true): void {
    const element = options.addressElement;
    if (!element || !element.isConnected || this.boundElements.has(element)) {
      return;
    }
    if (typeof google === 'undefined' || !google.maps?.places) {
      // Maps script is still loading - try once more, then wait for the next focus.
      if (retry) {
        setTimeout(() => this.attachAutocomplete(options, false), 500);
      }
      return;
    }
    this.boundElements.add(element);
    this.bindAutocomplete(options);
  }

  /**
   * Initializes the Google Autocomplete API and listens for address changes.
   * @param options - Options for the Google Autocomplete API.
   */
  googleAutocompleteLogic(options: IGoogleAddressParams) {
    this.removeOrphanedPacContainers();
    this.bindAutocomplete(options);
  }

  private bindAutocomplete(options: IGoogleAddressParams) {
    const autocomplete = new google.maps.places.Autocomplete(
      options.addressElement
    );
    this.autocompletes.push(autocomplete);
    let allowedCountries: string | string[] = '';

    if (options?.allowedCountries) {
      allowedCountries = options.allowedCountries;
    } else {
      allowedCountries = ['us', 'ca'];
    }

    if (options?.dropdownMinWidth && options.dropdownMinWidth > 0) {
      this.applyPacContainerMinWidth(options.dropdownMinWidth);
    }

    /**
     * Loads the Maps API and initializes the Autocomplete instance.
     */
    autocomplete.setComponentRestrictions({
      country: allowedCountries
    });

    /**
     * Listens for the "place_changed" event, which is triggered when the user selects an address from the Autocomplete dropdown.
     */
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();

      this.googleAutcompleteData.address = '';
      this.googleAutcompleteData = { ...this.emptyAutoCompleteData };

      const addressArray = place.address_components;
      let street = '';

      /**
       * Extracts the address components from the selected place and updates the googleAutcompleteData object.
       */

      addressArray?.forEach((element) => {
        const {types} = element;

        // Priority 1: Check for specific landmarks/premises first
        if (
          !this.googleAutcompleteData.address ||
          this.googleAutcompleteData.address.trim() === ''
        ) {
          if (types.includes('premise')) {
            this.googleAutcompleteData.address = element.long_name;
          } else if (
            types.includes('town_square') ||
            types.includes('establishment')
          ) {
            // Use landmark/business/square as address
            this.googleAutcompleteData.address = element.long_name;
          } else if (
            types.includes('sublocality_level_1') ||
            types.includes('sublocality')
          ) {
            this.googleAutcompleteData.address = element.long_name;
          } else if (types.includes('neighborhood')) {
            this.googleAutcompleteData.address = element.long_name;
          }
        }

        // Collect street_number (don't set address yet)
        if (types.includes('street_number')) {
          street = element.long_name;
        }
        
        // Priority 2: Standard street_number + route (only if no address set yet)
        if (
          !this.googleAutcompleteData.address ||
          this.googleAutcompleteData.address.trim() === ''
        ) {
          if (types.includes('route')) {
            const route = element.long_name;
            if (street) {
              // Use the format from Google's formatted_address if available
              const formattedAddress = place.formatted_address;
              if (formattedAddress && formattedAddress.includes(`${route} ${street}`)) {
                // European/International format (street name first)
                this.googleAutcompleteData.address = `${route} ${street}`;
              } else {
                // US/CA format (number first)
                this.googleAutcompleteData.address = `${street} ${route}`;
              }
            }
          }
        }

        // Priority 3: Fallback to route (without street number) or locality
        if (
          !this.googleAutcompleteData.address ||
          this.googleAutcompleteData.address.trim() === ''
        ) {
          if (types.includes('route')) {
            // Use route as address when no street number exists
            this.googleAutcompleteData.address = element.long_name;
          } else if (types.includes('locality')) {
            // Use locality as address when no street-level info exists
            this.googleAutcompleteData.address = element.long_name;
          }
        }

        if (types.includes('subpremise')) {
          // Add apartment/suite info
          this.googleAutcompleteData.address += ` #${element.long_name}`;
        }
        if (types.includes('locality') || types.includes('postal_town')) {
          this.googleAutcompleteData.city = element.long_name;
        }
        if (types.includes('administrative_area_level_1')) {
          this.googleAutcompleteData.state = element.short_name;
        }
        if (types.includes('postal_code')) {
          this.googleAutcompleteData.zip = element.short_name;
        }
        if (types.includes('postal_code_suffix')) {
          this.googleAutcompleteData.zip += `-${element.short_name}`;
        }
        if (types.includes('country')) {
          if (!options?.displayShortName) {
            this.googleAutcompleteData.country = element.long_name;
          } else {
            this.googleAutcompleteData.country = element.short_name;
          }
        }
      });

      /**
       * Emits the updated googleAutcompleteData to subscribers, tagged with the
       * input it came from so subscribers bound to a different field can skip it.
       */
      this.googleAddress = {
        ...this.googleAutcompleteData,
        sourceElement: options.addressElement
      };
    });
  }

  /**
   * @description
   * Function for multiple instances of Google API in a single component
   * The `addressInstance` parameter is passed from the component to make sure each component is calling the function
   * and Google Autocomplete API is not triggered multiple times.
   * `addressInstance` is the parameter being compared with a
   * local counter variable to ensure that the function is called only once.
   *
   *
   * @usageNotes
   * Pass the `addressInstance` parameter like below for HTML,
   *
   * ```
   * <input type="text" formControlName="bankAddress" class="input_style" id="bankAddress" placeholder=" "
   *  #search2 (focus)="loadBankGoogleAddress(search2, 0)">
   * ```
   *
   * Pass the `addressInstance` parameter like below for TS,
   *
   * ```
   * this._googleAddressService.googleAutocomplete({ addressElement: address, allowedCountries: ["us", "ca"], addressInstance: addressInstance });
   * ```
   *
   * @param googleAddressFunctionParams Object of parameters needed to pass to the `googleAutcompleteLogic` function.
   *
   * For multiple address API cases we used this condition
   * ```
   * (this.multiCount === true && googleAddressFunctionParams?.addressInstance != null)
   * ```
   * `this.instanceList` First time It will come like an empty array
   * and then It will have the every instance value inside this array.
   *
   * So, we are restrict the already included values in instanceList array by using this `!this.instanceList.includes`
   * because of It triggered many times.
   */
  multipleGoogleAddressApiLogic(
    googleAddressFunctionParams: IGoogleAddressParams
  ) {
    if (
      this.multiCount === true &&
      googleAddressFunctionParams?.addressInstance != null
    ) {
      if (
        googleAddressFunctionParams?.addressInstance <=
        this.addressInstanceCounter
      ) {
        if (
          !this.instanceList.includes(
            googleAddressFunctionParams?.addressInstance
          )
        ) {
          this.googleAutocompleteLogic(googleAddressFunctionParams);
          this.isAutocompleteAPILoaded = false;
          this.instanceList.push(googleAddressFunctionParams?.addressInstance);
        }
      }
    } else {
      if (
        googleAddressFunctionParams?.addressInstance ===
        this.addressInstanceCounter
      ) {
        this.googleAutocompleteLogic(googleAddressFunctionParams);
        this.isAutocompleteAPILoaded = false;
        this.addressInstanceCounter = this.addressInstanceCounter + 1;
      }
    }
  }

  /**
   * @description Forces a minimum width on the next `.pac-container` Google appends to the DOM
   * so the suggestion text is not truncated when the source input is narrow.
   *
   * Google appends its suggestion container as a direct child of `document.body`, outside the
   * Angular component view, so it cannot be targeted with component-scoped SCSS. A short-lived
   * `MutationObserver` waits for the container to appear, applies `min-width`, and disconnects.
   * A 10s safety timeout disconnects the observer even if the user never triggers the dropdown.
   *
   * @param minWidthPx Minimum dropdown width in pixels.
   */
  private applyPacContainerMinWidth(minWidthPx: number): void {
    if (typeof MutationObserver === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (
            node instanceof HTMLElement &&
            node.classList.contains('pac-container')
          ) {
            node.style.minWidth = `${minWidthPx}px`;
            observer.disconnect();
            return;
          }
        }
      }
    });

    observer.observe(document.body, { childList: true });
    setTimeout(() => observer.disconnect(), 10000);
  }

  /**
   * @description we can use this function  for restting the google address API's
   * @param count If form have multiple address fields or If we have to set multiple address fields, so we need to pass the address count in this reset function.
   */
  resetGoogleAutocompleteAPI(count?: number) {
    this.isAutocompleteAPILoaded = false;
    this.removeOrphanedPacContainers();
    if (count) {
      this.addressInstanceCounter = count;
      this.multiCount = true;
      this.instanceList = [];
    } else {
      this.addressInstanceCounter = 0;
    }
  }

  /**
   * Applies the restriction to every autocomplete still bound. A view holding more than one
   * address field binds one per field, so restricting only the most recent would leave the
   * others suggesting addresses from the previously selected country.
   */
  updateCountryRestriction(countries: string[]): void {
    this.autocompletes.forEach((autocomplete) =>
      autocomplete.setComponentRestrictions({ country: countries })
    );
  }
  
  /**
   * Removes orphaned `.pac-container` elements Google leaves on `document.body`, which otherwise
   * stack as overlapping dropdowns.
   *
   * Every live autocomplete loses its dropdown here, so the `attachAutocomplete` bookkeeping is
   * cleared with it - those elements re-bind on their next focus and get a fresh container
   * instead of a silently dead one.
   */
  private removeOrphanedPacContainers(): void {
    this.boundElements = new WeakSet<HTMLInputElement>();
    this.autocompletes = [];
    if (typeof document === 'undefined') {
      return;
    }
    document
      .querySelectorAll('.pac-container')
      .forEach((node) => node.remove());
  }
}
