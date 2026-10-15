import { Pipe, PipeTransform } from '@angular/core';
import { environment } from 'src/environments/environment';
import { WhiteLabel } from '../modules/dynamic-white-label/dynamic-white-label-data/dynamic-white-label-data';
import { IDynamicWhiteLabelAttributes } from '../modules/dynamic-white-label/model/dynamic-white-label.model';

/**
 * @name WhiteLabelPipe
 * @description This pipe is used to transform the value based on the white label attributes.
 * @param {string} value - The value to be transformed.
 * @param {keyof IDynamicWhiteLabelAttributes} attribute - The attribute key to be used for transformation.
 * @param {'uppercase'} textTransform - Optional parameter to transform the text to uppercase.
 * @returns {string} - Returns the transformed value.
 */
@Pipe({
  name: 'whiteLabel',
  pure: true,
  standalone: true
})
export class WhiteLabelPipe implements PipeTransform {
  dynamicWhiteLabelData = WhiteLabel.dynamicWhiteLabelData();
  currentEnvironmentId = environment.env_id;

  /**
   * @name transform
   * @description This method transforms the input value based on the white label attributes.
   * @param {string} value - The value to be transformed.
   * @param {keyof IDynamicWhiteLabelAttributes} attribute - The attribute key to be used for transformation.
   * @param {'uppercase'} textTransform - Optional parameter to transform the text to uppercase.
   * @returns {string} - Returns the transformed value.
   */
  transform(
    value: string,
    attribute: keyof IDynamicWhiteLabelAttributes,
    textTransform?: 'uppercase'
  ): string {
    let transformedValue: string = value;

    this.dynamicWhiteLabelData.some((whiteLabel) => {
      if (whiteLabel.environmentId === this.currentEnvironmentId) {
        if (textTransform === 'uppercase') {
          transformedValue =
            (whiteLabel.attributes[attribute] as string)?.toUpperCase() || '';
        } else {
          transformedValue = (whiteLabel.attributes[attribute] as string) || '';
        }
        return true;
      }
      return false;
    });
    return transformedValue || value;
  }
}
