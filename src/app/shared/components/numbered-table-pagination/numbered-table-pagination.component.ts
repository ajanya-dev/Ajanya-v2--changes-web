import { NgClass } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faAngleLeft, faAngleRight } from '@fortawesome/pro-regular-svg-icons';

@Component({
  selector: 'app-numbered-table-pagination',
  standalone: true,
  imports: [NgClass, FormsModule, FontAwesomeModule],
  templateUrl: './numbered-table-pagination.component.html',
  styleUrl: './numbered-table-pagination.component.scss'
})
export class NumberedTablePaginationComponent implements OnChanges {
  @Input() page = 1;
  @Input() totalPages = 0;
  @Output() pageChange = new EventEmitter<number>();

  faAngleLeft = faAngleLeft;
  faAngleRight = faAngleRight;

  pages: (number | '...')[] = [];
  goto: number | string = '';

  ngOnChanges(): void {
    this.buildPages();
  }

  private buildPages(): void {
    const total = this.totalPages;
    const current = this.page;

    if (total < 8) {
      this.pages = Array.from({ length: total }, (_, i) => i + 1);
      return;
    }

    if (current <= 4) {
      this.pages = [1, 2, 3, 4, 5, '...', total];
    } else if (current >= total - 3) {
      this.pages = [
        1,
        '...',
        total - 4,
        total - 3,
        total - 2,
        total - 1,
        total
      ];
    } else {
      this.pages = [1, '...', current - 1, current, current + 1, '...', total];
    }
  }

  select(item: number | '...'): void {
    if (typeof item !== 'number' || item === this.page) {
      return;
    }
    this.emit(item);
  }

  prev(): void {
    this.emit(this.page - 1);
  }

  next(): void {
    this.emit(this.page + 1);
  }

  onGotoInput(value: string): void {
    if (Number(value) > this.totalPages) {
      this.goto = this.totalPages;
    }
  }

  gotoEntered(): void {
    this.emit(Number(this.goto));
    this.goto = '';
  }

  private emit(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.page) {
      this.pageChange.emit(page);
    }
  }
}
