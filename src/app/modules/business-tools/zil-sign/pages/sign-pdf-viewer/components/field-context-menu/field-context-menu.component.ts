import { Component, EventEmitter, Input, Output, HostListener, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faTrash, faCopy } from '@fortawesome/pro-solid-svg-icons';

export interface ContextMenuAction {
  action: 'delete' | 'placeOnOtherPages';
  fieldId: string;
}

@Component({
  selector: 'app-field-context-menu',
  standalone: true,
  imports: [CommonModule, FaIconComponent],
  template: `
    <div
      class="context-menu bg-main-background-color border border-input-border-color rounded-lg shadow-lg py-1 min-w-[200px] z-[1000]"
      [style.position]="'fixed'"
      [style.left.px]="x"
      [style.top.px]="y"
    >
      <button
        class="w-full px-4 py-2 text-left text-sm text-main-text-color hover:bg-secondary-background-color flex items-center gap-3 transition-colors"
        (click)="onPlaceOnOtherPages()"
      >
        <fa-icon [icon]="faCopy" class="text-secondary-text-color text-xs w-4"></fa-icon>
        <span>Place field(s) on other pages</span>
      </button>
      <div class="border-t border-input-border-color my-1"></div>
      <button
        class="w-full px-4 py-2 text-left text-sm text-common-red-color hover:bg-secondary-background-color flex items-center gap-3 transition-colors"
        (click)="onDelete()"
      >
        <fa-icon [icon]="faTrash" class="text-xs w-4"></fa-icon>
        <span>Delete</span>
      </button>
    </div>
  `,
  styles: [`
    .context-menu {
      animation: fadeIn 0.1s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `]
})
export class FieldContextMenuComponent {
  @Input() x = 0;
  @Input() y = 0;
  @Input() fieldId = '';
  @Output() menuAction = new EventEmitter<ContextMenuAction>();
  @Output() closeMenu = new EventEmitter<void>();

  private elementRef = inject(ElementRef);

  faTrash = faTrash;
  faCopy = faCopy;

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

  onDelete(): void {
    this.menuAction.emit({ action: 'delete', fieldId: this.fieldId });
    this.closeMenu.emit();
  }

  onPlaceOnOtherPages(): void {
    this.menuAction.emit({ action: 'placeOnOtherPages', fieldId: this.fieldId });
    this.closeMenu.emit();
  }
}
