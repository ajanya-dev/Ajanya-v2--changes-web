import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  OnDestroy,
  computed,
  inject,
  HostBinding
} from '@angular/core';
import { Subscription } from 'rxjs';
import { CardsDataServiceService } from 'src/app/modules/cards/services/cards-data-service.service';
import { CommonLayoutToggleV4Service } from 'src/app/shared/service/common/shared/common-layout/common-layout-toggle-v4.service';
import { ListHeaderV4Component } from 'src/app/shared/v4/common-components/list-header-v4/list-header-v4.component';
import { CreditCardsOcwV4Component } from '../lists/credit-cards-ocw-v4/credit-cards-ocw-v4.component';

@Component({
  standalone: true,
  selector: 'app-cards-list-v4',
  templateUrl: './cards-list-v4.component.html',
  styleUrls: ['./cards-list-v4.component.scss'],
  imports: [CommonModule, ListHeaderV4Component, CreditCardsOcwV4Component]
})
export class CardsListV4Component implements OnInit, OnDestroy {
  @HostBinding('class') hostClass = 'flex flex-col h-full overflow-hidden';
  private cardsDataService = inject(CardsDataServiceService);
  private commonLayoutToggleV4Service = inject(CommonLayoutToggleV4Service);
  private resizeSubscription: Subscription;

  cardList = computed(() => this.cardsDataService.cardsData().cards);
  searchKey = computed(() => this.cardsDataService.cardsData().searchTerm);
  loading = computed(() => this.cardsDataService.cardsData().isLoading);

  resize = false;

  ngOnInit(): void {
    this.checkResize();
  }

  onSearch(value: string): void {
    this.cardsDataService.cardsData.update((state) => ({
      ...state,
      searchTerm: value
    }));
  }

  addNewButtonClick(): void {
    this.cardsDataService.openAddNewModalV4('credit');
  }

  private checkResize(): void {
    this.resizeSubscription =
      this.commonLayoutToggleV4Service.toggleChange$.subscribe((isNarrow) => {
        this.resize = isNarrow;
      });
  }

  ngOnDestroy(): void {
    this.resizeSubscription?.unsubscribe();
  }
}
