import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  standalone: true,
  selector: 'app-list-header-v4',
  templateUrl: './list-header-v4.component.html',
  styleUrls: ['./list-header-v4.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatTooltipModule,
    LucideAngularModule,
    MatTooltipModule,
    CommonInputFieldV4Component,
    CommonButtonV4Component,
    MatTooltipModule
  ]
})
export class ListHeaderV4Component {
  header = input.required<string>();
  isAddButton = input<boolean>(true);
  buttonText = input<string>('New');
  addButtonTooltip = input<string>('Add');
  isSwitchOption = input<boolean>(true);
  isFilterOption = input<boolean>(false);
  loading = input<boolean>(false);
  disabled = input<boolean>(false);
  searchPlaceholder = input<string>('Search...');
  
  @Output() searchEvent = new EventEmitter<string>();
  @Output() addButtonClickEvent = new EventEmitter<boolean>();
  @Output() gridClickEvent = new EventEmitter<boolean>();

  searchInput = '';
  isGridView = true;

  fetchSearchData(): void {
    this.searchEvent.emit(this.searchInput);
  }

  clearSearch(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.searchInput = '';
    this.fetchSearchData();
  }

  buttonClick(): void {
    this.addButtonClickEvent.emit(true);
  }

  viewToggle(isGrid: boolean): void {
    this.isGridView = isGrid;
    this.gridClickEvent.emit(isGrid);
  }
}
