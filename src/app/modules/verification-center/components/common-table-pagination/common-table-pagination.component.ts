import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faAngleLeft, faAngleRight } from '@fortawesome/pro-regular-svg-icons';

@Component({
  selector: 'app-common-table-pagination',
  standalone: true,
  imports: [NgFor, NgIf, FontAwesomeModule, NgClass, MatTooltipModule],
  templateUrl: './common-table-pagination.component.html',
  styleUrl: './common-table-pagination.component.scss'
})
export class CommonTablePaginationComponent  {

  @Input() rowCount = 0;
  @Input() page = 1;
  @Input() pageLimit = 10;
  @Input() totalPages = 0;
  @Input() hideViewAll = false;
  @Output() clcikedItem = new EventEmitter<'prev' | 'next'>();
  @Output() viewAllEvent = new EventEmitter();


  faAngleLeft = faAngleLeft;
  faAngleRight = faAngleRight;


  onSelect(type: 'prev' | 'next'): void {
    this.clcikedItem.emit(type);
  }

  viewAll(): void {
    this.viewAllEvent.emit();
  }

}
