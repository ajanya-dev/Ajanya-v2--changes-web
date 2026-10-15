import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AngularEditorModule,
  AngularEditorConfig
} from '@kolkov/angular-editor';

/**
 * @description Component for angular editor.
 */
@Component({
  standalone: true,
  imports: [FormsModule, CommonModule, AngularEditorModule],
  selector: 'app-text-editor',
  templateUrl: './text-editor.component.html',
  styleUrls: ['./text-editor.component.scss']
})
export class TextEditorComponent implements OnInit {
  @Input() content: string;
  @Input() style: { height?: string; minHeight?: string; maxHeight?: string } = {};
  @Input() public toolbarHiddenButtons = [];
  @Input() public uploadUrl: string;

  @Output() textChange = new EventEmitter<any>();
  @Output() theContent = new EventEmitter<any>();

  editorConfig: AngularEditorConfig;

  ngOnInit() {
    this.initialiseAngularEditor();
  }

  /**
   * @description Initializes angular editor.
   */
  initialiseAngularEditor() {
    this.editorConfig = {
      editable: true,
      spellcheck: true,
      height: this.style?.height ?? 'auto',
      minHeight: this.style?.minHeight ?? '0',
      maxHeight: this.style?.maxHeight ?? 'auto',
      width: 'auto',
      minWidth: '0',
      translate: 'yes',
      enableToolbar: true,
      showToolbar: true,
      placeholder: 'Enter text here...',
      defaultParagraphSeparator: 'p',
      defaultFontName: 'Arial',
      defaultFontSize: '',
      fonts: [
        { class: 'arial', name: 'Arial' },
        { class: 'times-new-roman', name: 'Times New Roman' },
        { class: 'calibri', name: 'Calibri' },
        { class: 'comic-sans-ms', name: 'Comic Sans MS' }
      ],
      customClasses: [
        {
          name: 'quote',
          class: 'quote'
        },
        {
          name: 'redText',
          class: 'redText'
        },
        {
          name: 'titleText',
          class: 'titleText',
          tag: 'h1'
        }
      ],
      uploadWithCredentials: false,
      sanitize: true,
      toolbarPosition: 'top',
      toolbarHiddenButtons: this.toolbarHiddenButtons
    };
  }

  /**
   * @description Handles content change from editor and emits `textChange` event.
   */
  onContentChange(newContent: string) {
    if (this.content !== newContent) {
      this.content = newContent;
      this.textChange.emit(newContent);
    }
  }

  /**
   * @description Emits `textChange` event with content.
   */
  sendContent() {
    this.textChange.emit(this.content);
  }
}
