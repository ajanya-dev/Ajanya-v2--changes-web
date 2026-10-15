import { Component, inject } from '@angular/core';
import { ICardList2 } from 'src/app/modules/cloud-bank/model/cloudbank';
import { Router } from '@angular/router';
import { Utils } from 'src/app/data/utils';
import { AlertService } from '../../../../../shared/service/alert/alert.service';
import { CloudBankDetailsDataV35Service } from '../../services/cloud-bank-details-data-v35.service';
import { CloudListV35Service } from '../../services/cloud-list-v35.service';
import { WhiteLabelPipe } from '../../../../../pipes/white-label.pipe';
import { CamelToTitlePipe } from '../../../../../pipes/camel-to-title.pipe';
import { SearchFilterPipe } from '../../../../../pipes/search-filter.pipe';
import { CommonButtonV35Component } from '../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonListSkeltonComponent } from '../../../../../shared/v3/common-components/common-list-skelton/common-list-skelton.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgClass, NgStyle, TitleCasePipe } from '@angular/common';
import { ListHeaderV35Component } from '../../../../../shared/v3/common-components/list-header-v35/list-header-v35.component';

@Component({
  selector: 'app-manage-cloud-card-v35',
  templateUrl: './manage-cloud-card-v35.component.html',
  styleUrls: ['./manage-cloud-card-v35.component.scss'],
  standalone: true,
  imports: [
    ListHeaderV35Component,
    NgClass,
    FaIconComponent,
    CommonListSkeltonComponent,
    NgStyle,
    CommonButtonV35Component,
    TitleCasePipe,
    SearchFilterPipe,
    CamelToTitlePipe,
    WhiteLabelPipe
  ]
})
export class ManageCloudCardV35Component {
  public cloudListV35Service = inject(CloudListV35Service);
  private router = inject(Router);
  public cloudBankDataService = inject(CloudBankDetailsDataV35Service);
  private alertService = inject(AlertService);

  public utils = Utils;
  public newPin = '';
  searchString = '';

  /**
   * @description routes to create card page.
   */
  createCard(accountId: string): void {
    return;
    this.router.navigate([`/manage/cloud-bank/card/create-card`], {
      queryParams: { id: accountId }
    });
  }

  /**
   * @description Sets the search string on typing
   * @param value string
   */
  onCardSearch(value: string) {
    this.searchString = value;
  }

  /**
   * @description Select a card
   * @param card Selected card
   */
  selectCard(card: ICardList2) {
    this.cloudBankDataService.selectCard(card);
  }

  /**
   * @description Edit selected card
   * @param card
   */
  editCard(card: ICardList2) {
    this.router.navigate(['/manage/cloud-bank/card/create-card'], {
      queryParams: { cardId: card.id }
    });
  }

  /**
   * @description Show airwallex card details like card number, expiry date, cvv
   * @param card
   */
  revealCard(card: ICardList2) {
    this.cloudBankDataService.revealCard(card);
  }

  /**
   * @description Show airwallex card pin
   * @param card Selected card
   * @returns if card is inactive
   */
  revealCardPin(card: ICardList2) {
    if (card.cardStatus !== 'active') {
      this.alertService.warningAlert({
        content:
          'The card is not active. Please make the card active and try again.'
      });
      return;
    }
    this.newPin = '';
    this.cloudBankDataService.revealCardPin(card);
  }

  /**
   * @description Change the status of the card from active to inactive or vice versa.
   * @param card
   */
  changeStatus(card: ICardList2) {
    const statusAlert = this.alertService.confirmAlert({
      content:
        card.cardStatus === 'active'
          ? 'Are you sure you want to make this card inactive?'
          : 'Are you sure you want to make this card active?',
      doneMsg: 'Yes'
    });
    statusAlert.afterClosed().subscribe((res) => {
      if (res) {
        this.cloudBankDataService.changeStatus(card);
      }
    });
  }

  /**
   * @description Set card pin
   */
  setPin() {
    this.cloudBankDataService.setPin(this.newPin);
  }

  /**
   * @description Show input to set new pin
   */
  showPinInput() {
    this.cloudBankDataService.setPinInputVisibility(true);
  }

  /**
   * @description returns font size based on the current window size
   */
  get cardSize() {
    if (window.innerWidth < 1366) {
      return '0.9rem';
    }
    return '1.1rem';
  }
}
