import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { FieldType } from '../../v4-models/v4-zil-sign.models';

export interface IV4ContextMenuAction {
  action: 'delete' | 'placeOnOtherPages' | 'edit';
  fieldId: string;
}

@Component({
  selector: 'app-v4-field-context-menu',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div
      class="fixed z-[1000] min-w-[210px] rounded-lg border border-v4-border-color bg-v4-popup-background-color shadow-lg py-1 context-menu-anim"
      [style.left.px]="x"
      [style.top.px]="y"
    >
      @if (canEdit()) {
        <button
          type="button"
          class="flex items-center gap-3 w-full px-3 py-2 text-left text-sm text-v4-main-text-color hover:bg-v4-tertiary-background-color transition-colors"
          (click)="onEdit()"
        >
          <lucide-icon name="pencil" [size]="14" class="text-v4-secondary-text-color"></lucide-icon>
          <span>Edit</span>
        </button>
      }
      <button
        type="button"
        class="flex items-center gap-3 w-full px-3 py-2 text-left text-sm text-v4-main-text-color hover:bg-v4-tertiary-background-color transition-colors"
        (click)="onPlaceOnOtherPages()"
      >
        <lucide-icon name="copy" [size]="14" class="text-v4-secondary-text-color"></lucide-icon>
        <span>Place field(s) on other pages</span>
      </button>
      <div class="border-t border-v4-border-color my-1"></div>
      <button
        type="button"
        class="flex items-center gap-3 w-full px-3 py-2 text-left text-sm text-v4-common-red-color hover:bg-v4-tertiary-background-color transition-colors"
        (click)="onDelete()"
      >
        <lucide-icon name="trash-2" [size]="14"></lucide-icon>
        <span>Delete</span>
      </button>
    </div>
  `,
  styles: [
    `
      .context-menu-anim {
        animation: fadeIn 0.1s ease-out;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
    `
  ]
})
export class V4FieldContextMenuComponent {
  @Input() x = 0;
  @Input() y = 0;
  @Input() fieldId = '';
  @Input() fieldType: FieldType | null = null;
  @Output() menuAction = new EventEmitter<IV4ContextMenuAction>();
  @Output() closeMenu = new EventEmitter<void>();

  private elementRef = inject(ElementRef);

  canEdit(): boolean {
    return this.fieldType !== 'checkbox' && this.fieldType !== 'radio';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeMenu.emit();
    }
  }

  @HostListener('document:contextmenu', ['$event'])
  onDocumentContextMenu(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeMenu.emit();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenu.emit();
  }

  onEdit(): void {
    this.menuAction.emit({ action: 'edit', fieldId: this.fieldId });
    this.closeMenu.emit();
  }

  onDelete(): void {
    this.menuAction.emit({ action: 'delete', fieldId: this.fieldId });
    this.closeMenu.emit();
  }

  onPlaceOnOtherPages(): void {
    this.menuAction.emit({
      action: 'placeOnOtherPages',
      fieldId: this.fieldId
    });
    this.closeMenu.emit();
  }
}
