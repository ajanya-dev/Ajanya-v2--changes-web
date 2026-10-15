import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  inject,
  input,
  ElementRef,
  effect,
  ViewChild,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { AngularMaterialModule } from 'src/app/modules/angular-material/angular-material.module';
import { MatMenu } from '@angular/material/menu';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { CommonButtonV35Component } from '../../buttons/common-button-v35/common-button-v35.component';
import { ListViewToggleComponent } from '../list-view-toggle/list-view-toggle.component';

/**
 * `ListHeaderV35Component` Represents a common List header component for v3.5.
 */
@Component({
  standalone: true,
  selector: 'app-list-header-v35',
  templateUrl: './list-header-v35.component.html',
  styleUrls: ['./list-header-v35.component.scss'],
  imports: [
    CommonModule,
    FontAwesomeModule,
    CommonButtonV35Component,
    ListViewToggleComponent,
    FormsModule,
    AngularMaterialModule
  ]
})
export class ListHeaderV35Component implements OnInit, OnChanges {
  /** Header of the List */
  @Input({ required: true }) header = '';
  /** Determines whether the grid and list view options are visible or not. */
  @Input() isSwitchOption = true;
  /** Determines whether the tabs are visible or not. */
  @Input() isTabChangeOption = false;
  /** Determines whether the filter option is visible or not.  */
  @Input() isFilterOption = false;
  /** Hide and show add button based on this value. */
  @Input() isAddButton = true;
  /** Add button text color. */
  @Input() addButtonTextColor = '';
  /** Button Text */
  @Input() buttonText = 'New';
  /** An array of objects representing tabs. Each object has a 'value' and a 'name'. */
  @Input() tabsArray: {
    value: string;
    name: string;
    toolTip?: string;
    count?: number;
  }[] = [{ value: '', name: '' }];

  /** Tab currently selected */
  @Input() selectedTab = '';
  /** search input */
  @Input() searchInput = '';
  /** To disable add new button */
  @Input() disabled = false;
  /** Reference to the MatMenu component. This is required when the filter option is used. */
  @Input() matMenu: MatMenu;

  loading = input(false);

  /** Emits a boolean value to the parent component when the grid or list view option is clicked. */
  @Output() gridClickEvent = new EventEmitter<boolean>();
  /** Emits the clicked tab value to the parent component. */
  @Output() tabClickEvent = new EventEmitter<string>();
  /**  Emits the search term to the parent component. */
  @Output() searchEvent = new EventEmitter<string>();
  /** Emits a boolean value when add button is click. */
  @Output() addButtonClickEvent = new EventEmitter<boolean>();

  @ViewChild('searchInputElm') searchInputElm: ElementRef<HTMLInputElement>;

  firstSelectTab = '';
  isGridView = true;

  payeeService = inject(PayeeService);

  constructor() {
    effect(() => {
      const loading = this.loading();

      const elem = this.searchInputElm?.nativeElement;

      if (elem && !loading) {
        elem.disabled = false;
        elem.focus();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.selectedTab) {
      this.firstSelectTab = this.selectedTab;
    }
  }

  /**
   * @description It checks if there are any tabs in the tabsArray, and if so, sets the firstSelectTab to the value of the first tab.
   */
  ngOnInit(): void {
    if (this.selectedTab) {
      this.firstSelectTab = this.selectedTab;
      return;
    }
    if (this.tabsArray.length > 0) {
      this.firstSelectTab = this.tabsArray[0].value;
    }
  }

  /**
   * @description Handles the category filter action.
   * @param {string} val - The selected category value.
   */
  categoryFilter(val: string) {
    this.firstSelectTab = val;
    this.tabClickEvent.next(val);
  }

  /**
   * @description emits event to switch to grid view.
   */
  viewToggle(val: boolean): void {
    this.isGridView = val;
    this.gridClickEvent.next(val);
  }

  /**
   * @description  Emits the search input value.
   */
  fetchSearchData() {
    this.searchEvent.next(this.searchInput);
  }

  /**
   * @description Handles the event when add  button is clicked.
   */
  buttonClick() {
    this.addButtonClickEvent.next(true);
  }
}
