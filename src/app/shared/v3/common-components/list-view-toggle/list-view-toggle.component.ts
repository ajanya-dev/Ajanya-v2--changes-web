import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-list-view-toggle',
  templateUrl: './list-view-toggle.component.html',
  styleUrls: ['./list-view-toggle.component.scss'],
  standalone: true,
  imports: [CommonModule, FontAwesomeModule]
})
export class ListViewToggleComponent {
  @Input() isGridView = true;

  /** Emits a boolean value to the parent component when the grid or list view option is clicked. */
  @Output() viewToggleEvent = new EventEmitter<boolean>();

  /**
   * @description emits event to switch to grid view.
   */
  gridView(): void {
    if(this.isGridView) return;
    this.isGridView = true;
    this.viewToggleEvent.next(true);
  }

  /**
   * @description emits event to switch to list view.
   */
  listView(): void {
    if(!this.isGridView) return;
    this.isGridView = false;
    this.viewToggleEvent.next(false);
  }
}
