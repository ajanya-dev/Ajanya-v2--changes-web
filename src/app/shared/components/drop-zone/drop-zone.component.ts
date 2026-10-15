import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCircleXmark } from '@fortawesome/pro-solid-svg-icons';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-drop-zone',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './drop-zone.component.html',
  styleUrl: './drop-zone.component.scss'
})
export class DropZoneComponent implements OnInit, OnDestroy {
  @Input() accept = '';
  @Input() clearable = true;
  @Input() disabled = false;

  @Input() set previewHeight(val: string) {
    if (val) {
      this.previewStyle.height = val;
    }
  }

  @Input() removeSubject = new Subject<boolean>();

  @Input() set previewWidth(val: string) {
    if (val) {
      this.previewStyle.width = val;
    }
  }

  @Output() changeEvent = new EventEmitter<File[]>();
  @Output() removeEvent = new EventEmitter<File>();

  @ViewChild('inputElm') input: ElementRef<HTMLInputElement>;

  previewStyle: Pick<CSSStyleDeclaration, 'width' | 'height'> = {
    height: '100px',
    width: '100px'
  };

  faCircleXmark = faCircleXmark;

  hasFocus = false;
  preViewUrl?: ArrayBuffer | string;
  file?: File;
  isImage = false;
  destroy$ = new Subject();

  ngOnInit(): void {
    this.removeSubject.pipe(takeUntil(this.destroy$)).subscribe((val) => {
      if (val) this.clear();
    });
  }

  changeFocus(state: boolean) {
    this.hasFocus = state;
  }

  fileChange(event: Event) {
    const { files } = <HTMLInputElement>event.target;

    this.changeEvent.emit(Array.from(files ?? []));

    if (files?.length) {
      this.file = files[0];

      const reader = new FileReader();

      reader.onload = () => {
        this.preViewUrl = reader.result ?? undefined;
      };
      reader.readAsDataURL(files[0]);

      if (files[0].type.startsWith('image/')) {
        this.isImage = true;
      }

      return;
    }
    this.clear();
  }

  clear() {
    this.removeEvent.emit(this.file);
    this.hasFocus = false;
    this.isImage = false;
    this.file = undefined;
    this.preViewUrl = undefined;
    if (this.input) {
      this.input.nativeElement.value = '';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }
}
