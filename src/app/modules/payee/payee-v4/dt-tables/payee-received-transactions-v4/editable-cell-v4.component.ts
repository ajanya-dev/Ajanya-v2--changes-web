import { Component } from '@angular/core';
import { ICellRendererParams } from '@ag-grid-community/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  standalone: true,
  imports: [LucideAngularModule],
  selector: 'app-editable-cell-v4',
  template: `
    @if (isEditable) {
      <lucide-icon
        name="check"
        [size]="16"
        class="text-v4-common-green-color"
      />
    }
  `
})
export class EditableCellV4Component {
  isEditable = false;

  agInit(params: ICellRendererParams): void {
    this.isEditable = params.data?.is_editable === 1;
  }
}
