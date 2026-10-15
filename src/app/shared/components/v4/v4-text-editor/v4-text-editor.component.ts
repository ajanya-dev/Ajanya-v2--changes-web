import { Component, effect, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AngularEditorModule,
  AngularEditorConfig
} from '@kolkov/angular-editor';

@Component({
  selector: 'app-v4-text-editor',
  standalone: true,
  imports: [FormsModule, CommonModule, AngularEditorModule],
  templateUrl: './v4-text-editor.component.html',
  styleUrls: ['./v4-text-editor.component.scss']
})
export class V4TextEditorComponent {
  content = input<string>('');
  editorStyle = input<{ height: string }>({ height: '160px' });
  toolbarHiddenButtons = input<string[][]>([]);
  uploadUrl = input<string>('');
  placeholder = input<string>('Enter text here...');

  textChange = output<string>();

  editorContent = signal<string>('');
  editorConfig = signal<AngularEditorConfig>({
    editable: true,
    spellcheck: true,
    height: 'auto',
    minHeight: '0',
    maxHeight: 'auto',
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
      { name: 'quote', class: 'quote' },
      { name: 'redText', class: 'redText' },
      { name: 'titleText', class: 'titleText', tag: 'h1' }
    ],
    uploadWithCredentials: false,
    sanitize: true,
    toolbarPosition: 'top',
    toolbarHiddenButtons: []
  });

  constructor() {
    effect(() => {
      this.editorContent.set(this.content());
    }, { allowSignalWrites: true });

    effect(() => {
      const hidden = this.toolbarHiddenButtons();
      const url = this.uploadUrl();
      const placeholderText = this.placeholder();

      this.editorConfig.update(config => ({
        ...config,
        toolbarHiddenButtons: hidden,
        uploadUrl: url || undefined,
        placeholder: placeholderText
      }));
    }, { allowSignalWrites: true });
  }

  onContentChange(newContent: string): void {
    if (this.editorContent() !== newContent) {
      this.editorContent.set(newContent);
      this.textChange.emit(newContent);
    }
  }
}
