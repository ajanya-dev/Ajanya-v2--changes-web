import { ICellRendererParams } from '@ag-grid-community/core';
import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  standalone: true,
  imports: [FontAwesomeModule],
  selector: 'app-icon-cell-renderer',
  template: `
    @if (isEditable) {
      <fa-icon
        [icon]="['fas', 'check']"
        class="text-common-green-color text-lg"
      ></fa-icon>
    }
  `
})
export class EditableCellRendererComponent {
  isEditable: boolean = false;

  agInit(params: ICellRendererParams): void {    
    this.isEditable = params.data?.is_editable === 1;
  }
}
