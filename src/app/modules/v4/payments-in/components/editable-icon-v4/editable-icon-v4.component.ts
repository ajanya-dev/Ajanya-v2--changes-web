import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  standalone: true,
  selector: 'app-editable-icon-v4',
  imports: [LucideAngularModule],
  template: `
    @if (isEditable) {
      <lucide-icon
        name="check"
        [size]="12"
        class="text-v4-common-green-color"
      ></lucide-icon>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditableIconV4Component implements ICellRendererAngularComp {
  isEditable = false;

  agInit(params: ICellRendererParams): void {
    this.isEditable = params.data?.is_editable === 1;
  }

  refresh(): boolean {
    // Value-only cell — let ag-grid rebuild it when the row data changes.
    return false;
  }
}
