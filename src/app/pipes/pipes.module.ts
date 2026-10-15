import { NgModule } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { TruncatePipe } from './truncate.pipe';
import { SearchFilterPipe } from './search-filter.pipe';
import { CurrencyFormatterPipe } from './currency-formatter.pipe';
import { SortPipe } from './sort.pipe';
import { MoveSelectedToTopPipe } from './move-selected-to-top.pipe';
import { PhoneNumberFormatterPipe } from './phone-number-formatter.pipe';
import { TextMaskingPipe } from './text-masking.pipe';

@NgModule({
  imports: [
    CommonModule,
    TruncatePipe,
    SearchFilterPipe,
    CurrencyFormatterPipe,
    SortPipe,
    MoveSelectedToTopPipe,
    PhoneNumberFormatterPipe,
    TextMaskingPipe
  ],
  exports: [
    TruncatePipe,
    TruncatePipe,
    SearchFilterPipe,
    CurrencyFormatterPipe,
    SortPipe,
    MoveSelectedToTopPipe,
    PhoneNumberFormatterPipe,
    TextMaskingPipe
  ],
  providers: [CurrencyPipe]
})
export class PipesModule {}
