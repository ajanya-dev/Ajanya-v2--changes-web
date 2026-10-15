import {
  Component,
  OnDestroy,
  ViewEncapsulation,
  inject
} from '@angular/core';
import { AgFloatingFilterComponent } from '@ag-grid-community/angular';
import { IFloatingFilterParams } from '@ag-grid-community/core';
import { BankDataService } from 'src/app/shared/service/bank-data/bank-data.service';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgIf, KeyValuePipe } from '@angular/common';
import {
  buildCategoryTree,
  indentNameByLevel
} from '../../utils/category-tree.util';

@Component({
  selector: 'app-bank-data-search',
  template: `
    <ng-container *ngIf="colId === 'category_id_custom'">
    <div>
      <ng-select
        class="font-[11px] min-w-[200px]"
        placeholder="Search"
        appendTo="body"
        [items]="categoryOptions"
        bindValue="id"
        bindLabel="name"
        [(ngModel)]="searchString"
        (change)="search()"
      >
        <ng-template ng-option-tmp let-item="item">
          <span [innerHTML]="item.name"></span>
        </ng-template>
        <ng-template ng-label-tmp let-item="item">
          <span [innerHTML]="stripIndent(item.name)"></span>
        </ng-template>
      </ng-select>
    </div>
    </ng-container>

    <ng-container *ngIf="colId === 'accountId'">
      <div>
        <ng-select
          placeholder="Search"
          class="font-[11px] min-w-[200px]"
          appendTo="body"
          [(ngModel)]="searchString"
          (change)="search()"
          id="account-search"
        >
          @for (item of bankDataService.accounts | keyvalue; track item) {
            <ng-option [value]="item.key">
              <span title="{{ item.value?.name }}">
                {{
                  item.value?.short_name
                    ? item.value.short_name
                    : item.value.nick_name
                      ? item.value.nick_name
                      : item.value.name
                }}
              </span>
            </ng-option>
          }
        </ng-select>
      </div>
    </ng-container>
  `,
  styles: [
    `
      :host ::ng-deep .ng-select .ng-select-container {
        border: 0 !important;
      }
    `
  ],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [NgIf, NgSelectModule, FormsModule, KeyValuePipe]
})
export class BankDataCommonSearchComponent
  implements AgFloatingFilterComponent, OnDestroy
{
  public bankDataService = inject(BankDataService);
  subscriptions: Subscription[] = [];

  inputStyle = {
    'border-radius': '4px',
    width: '100%',
    padding: '0px 4px',
    position: 'relative',
    height: '21px',
    'font-size': '11px',
    'text-transform': 'lowercase',
    'font-family': 'Arial, FontAwesome'
  };

  params!: IFloatingFilterParams;
  searchString: string;
  currentValue: string;

  colId: string;

  categoryOptions: Array<{ id: string; name: string }> = [];

  onParentModelChanged(): void {}

  agInit(params: IFloatingFilterParams): void {
    this.clearSearchSubscribe();
    this.params = params;
    this.colId = this.params.column?.getColId();
    if (this.colId === 'category_id_custom') {
      this.loadCategoryOptions();
    }
  }

  /**
   * Builds the category filter options from the hierarchical custom categories
   * (categories.categories), flattened depth-first and indented by nesting level.
   */
  private loadCategoryOptions(): void {
    this.subscriptions.push(
      this.bankDataService.categories.subscribe((value) => {
        this.categoryOptions = buildCategoryTree(value?.categories || []).map(
          (node) => ({
            id: node.id,
            name: indentNameByLevel(node.name, node.level || 0)
          })
        );
      })
    );
  }

  /** Strip leading indentation (\s also matches the U+00A0 tree indent) so the
   * selected label shows the plain name while the open list keeps its indent. */
  stripIndent(label: string): string {
    return (label || '').replace(/^\s+/, '');
  }

  search() {
    if (this.searchString !== this.currentValue) {
      this.subscriptions.push(
        this.bankDataService.emitSearch({
          searchString: this.searchString,
          colId: this.colId
        })
      );
      this.currentValue = this.searchString;
    }
  }

  clearSearchSubscribe() {
    this.bankDataService.clearSearch$.subscribe((colId) => {
      if (
        (colId === 'accountId' || colId === 'all') &&
        this.colId === 'accountId'
      ) {
        this.bankDataService.emitSearch({
          searchString: '',
          colId: this.colId
        });
      }

      if (colId === this.colId || colId === 'all') {
        this.searchString = '';
        this.currentValue = '';
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
