import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  input
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MainHeader } from 'src/app/data/data/menu/header/MainHeader';
import { AngularMaterialModule } from 'src/app/modules/angular-material/angular-material.module';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { environment } from 'src/environments/environment';
import { CommonOnInitService } from 'src/app/shared/service/common-onInit/common-on-init.service';
import { faCircleQuestion } from '@fortawesome/pro-solid-svg-icons';
import { IHeaderLinks } from '../../model/header';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-common-help-button',
  templateUrl: './common-help-button.component.html',
  styleUrls: ['./common-help-button.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [FontAwesomeModule, CommonModule, AngularMaterialModule]
})
export class CommonHelpButtonComponent implements OnInit {
  helpIcon = input<boolean>(false);
  isFromPlanPage = input<boolean>(false);

  faHelpIcon = faCircleQuestion;
  supportDropdown: IHeaderLinks[] = MainHeader.supportDropdownLink();
  staticWhiteLabelConditions = StaticWhiteLabelConditions;
  subscriptions: Subscription[] = [];

  private commonOnInitService = inject(CommonOnInitService);

  ngOnInit() {
    this.loadWhiteLabelConfig();
  }

  /**
   * @description Display the Help dropdown content based on the White label.
   */
  loadWhiteLabelConfig(): void {
    if (environment.isItWhiteLabel) {
      this.supportDropdown = MainHeader.whiteLabelSupportDropdownLink();
    }

    if (!StaticWhiteLabelConditions.zohoSupportChat) {
      this.removeHeaderLinks(this.supportDropdown, ['liveChat']);
    }

    if (!StaticWhiteLabelConditions.customerSupportNo) {
      this.removeHeaderLinks(this.supportDropdown, ['phoneNumber']);
    }
  }

  /**
   * @description Use this for remove or splice links
   * @param {IHeaderLinks[]} object - The array of header link objects.
   * @param {string[]} removed - The array of link IDs to be removed.
   * @example
   * ```
   * const array = [{id:'live',name:'Live Chat'},
   *                {id:'phoneNumber',name:'Phone Number'},
   *                {id:'tickets',name:'Ticket'}]
   * this.removeHeaderLinks(array, ['tickets', 'phoneNumber']);
   * Output =  [{id:'live',name:'Live Chat'}]
   * ```
   */
  removeHeaderLinks(object: IHeaderLinks[], removed: string[]): void {
    if (!object?.length || !removed?.length) return;
    object.forEach((e: IHeaderLinks, i: number) => {
      if (removed?.includes(e.id)) object.splice(i, 1);
    });
  }

  /**
   * @description Handles the click event on the support menu.
   * @param {IHeaderLinks} data - The data associated with the clicked support menu item.
   */
  onSupportMenuClick(data: IHeaderLinks) {
    /**
     * Opens an external link based on the provided router link.
     * @param {string} data.routerLink - The router link to open.
     */
    if (data?.type === 'outside') {
      this.commonOnInitService.openOutside(data.routerLink);
      return;
    }

    /**
     * Initiates a phone call to the specified customer support number.
     */
    if (data?.type === 'phone') {
      document.location.href = `tel:${StaticWhiteLabelConditions.customerSupportNo}`;
      return;
    }

    /**
     * Opens a live chat window using the specified Zoho Support Chat URL.
     */
    if (data?.type === 'liveChat') {
      const chatBox = document.getElementById('zsiq_float');
      if (chatBox) chatBox.click();
      return;
    }

    /**
     * Performs an action based on the title of the clicked menu item.
     */
    switch (data.title) {
      case 'Report an Issue':
      case 'Tickets/Question':
        this.commonOnInitService.navigateToRoute(data.routerLink);
        break;
      // case 'Tickets/Question':
      //   if (
      //     environment.env_id === 'quickbanked' ||
      //     environment.env_id === 'quickbanked-sandbox'
      //   ){
      //     window.open(data.routerLink);
      //   }else{
      //     this.commonOnInitService.navigateToRoute(data.routerLink);
      //   }
      //   break;
      case 'Help/ Tutorial':
        this.commonOnInitService.onHelpTutorial();
        break;
      case 'Video Tutorial':
        this.commonOnInitService.onVideoTutorial();
        break;
      case 'Submit an Idea':
        this.commonOnInitService.onFeatureRequest();
        break;
      case 'Instant Demo':
        this.commonOnInitService.onDemoSection();
        break;
      case 'Text Us':
        this.commonOnInitService.onTextUs();
        break;
      case 'Our Compliance':
        this.commonOnInitService.navigateToRoute(data.routerLink, {
          queryParams: { tab: 'our-compliance' }
        });
        break;
      default:
        break;
    }
  }
}
