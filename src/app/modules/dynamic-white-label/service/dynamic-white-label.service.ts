import { Injectable } from '@angular/core';
import { EnvironmentId } from 'src/app/models/environment';
import { environment } from 'src/environments/environment';
import { WhiteLabel } from '../dynamic-white-label-data/dynamic-white-label-data';
import { IDynamicWhiteLabelFlags } from '../model/dynamic-white-label.model';
import { StaticWhiteLabelConditions } from '../static-white-label-conditions/static-dynamic-white-label-conditions';

@Injectable({
  providedIn: 'root'
})
export class DynamicWhiteLabelService {

  /**
   * Getting Static Conditions
   */
  staticWhiteLabelConditions = StaticWhiteLabelConditions;

  /**
   * @property {string} currentEnvironmentId
   * The current environment ID retrieved from the `environment` object.
   */
  currentEnvironmentId = this.localStorageGlobalEnvironmentId;

  /**
   * @property {IDynamicWhiteLabelAttributes[]} dynamicWhiteLabelData
   * An array of dynamic white label data retrieved from the `WhiteLabel` class.
   */
  dynamicWhiteLabelData = WhiteLabel.dynamicWhiteLabelData();

  /**
   * @description Common function to open live chat
   */
  goToLiveChat(): void {
    if (this.staticWhiteLabelConditions.zohoSupportChat){
      const chatBox = document.getElementById('zsiq_float');
      if (chatBox) chatBox.click();
      return;
    }
    else
      window.open(this.staticWhiteLabelConditions?.helpWebsite ?? '', '_blank');
  }

  /**
   * Option to change only the environment ID
   * for testing.
   */
  setGlobalEnvironmentId(selectedEnvironmentId?: EnvironmentId) {
    environment.env_id = this.localStorageGlobalEnvironmentId;

    if (selectedEnvironmentId) {
      this.localStorageGlobalEnvironmentId = selectedEnvironmentId;
      // eslint-disable-next-line no-restricted-globals
      location.reload();
    }
  }

  set localStorageGlobalEnvironmentId(selectedEnvironmentId: EnvironmentId) {
    localStorage.setItem('globalEnvironmentId', selectedEnvironmentId);
  }

  get localStorageGlobalEnvironmentId() {
    return (
      (localStorage.getItem('globalEnvironmentId') as EnvironmentId) ||
      environment.env_id
    );
  }

  dynamicWhiteLabelFlagChecker(flagToCheck: keyof IDynamicWhiteLabelFlags) {
    const whiteLabel = this.dynamicWhiteLabelData.find(
      (item) => item.environmentId === this.currentEnvironmentId
    );
    return whiteLabel?.flags[flagToCheck] || false;
  }
}
