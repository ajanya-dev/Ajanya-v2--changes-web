import {
  Component,
  HostListener,
  computed,
  inject,
  input
} from '@angular/core';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { RouterLink } from '@angular/router';
import { CommonButtonV35Component } from '../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-cloud-submitted-v3',
  templateUrl: './cloud-submitted-v3.component.html',
  styleUrls: ['./cloud-submitted-v3.component.scss'],
  standalone: true,
  imports: [FaIconComponent, CommonButtonV35Component, RouterLink]
})
export class CloudSubmittedV3Component {
  cloudStatus = input.required<string>();
  isRejected = computed(() => this.cloudStatus() === 'rejected');

  /**
   *@description Injecting dependencies using inject method
   */
  private sharedService = inject(SharedService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);

  /**
   * @description Variables
   */
  staticWhiteLabelConditions = StaticWhiteLabelConditions;
  /**
   * @description This function is called when the browser's history state changes.
   * The function is decorated with the @HostListener decorator, which tells Angular to listen for events of the specified type.
   * The function listens for the window:popstate event, which is fired when the browser's history state changes.
   * Sets the `canApplyForCloudBank` property on the `sharedService` service to true.
   * @param event - The event object that contains information about the change in history state.
   */
  @HostListener('window:popstate', ['$event'])
  onPopState() {
    this.sharedService.setCanApplyForCloudBank(true);
  }

  contactSupport() {
    this.dynamicWhiteLabelService.goToLiveChat();
  }
}
