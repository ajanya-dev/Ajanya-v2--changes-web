import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DepositSlipsService } from 'src/app/shared/service/deposit-slips/deposit-slips.service';
import { TextEditorComponent } from '../../../../shared/components/text-editor/text-editor.component';

@Component({
  selector: 'app-deposit-slip-settings',
  templateUrl: './deposit-slip-settings.component.html',
  styleUrls: ['./deposit-slip-settings.component.scss'],
  standalone: true,
  imports: [TextEditorComponent]
})
export class DepositSlipSettingsComponent implements OnInit {
  editorStyles = {
    height: '350px'
  };

  toolbarHiddenButtons = [
    [
      'undo',
      'redo',
      // 'bold',
      // 'italic',
      'underline',
      'strikeThrough',
      'subscript',
      'superscript',
      'justifyLeft',
      'justifyCenter',
      'justifyRight',
      'justifyFull',
      'indent',
      'outdent',
      // 'insertUnorderedList',
      // 'insertOrderedList',
      'heading'
      // 'fontName'
    ],
    [
      'fontSize',
      'textColor',
      'backgroundColor',
      'customClasses',
      'link',
      'unlink',
      'insertImage',
      'insertVideo',
      'insertHorizontalRule',
      'removeFormat',
      'toggleEditorMode'
    ]
  ];

  emailMsg: string;

  saving = false;

  constructor(
    private despositService: DepositSlipsService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.getStub();
  }

  textChange(event: string) {
    this.emailMsg = event;
  }

  getStub() {
    this.despositService.getStub().subscribe((data) => {
      if (data?.success) {
        this.emailMsg = data.data;
      }
    });
  }

  saveStub() {
    this.saving = true;

    this.despositService
      .saveStub(this.emailMsg)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe((data) => {
        if (data?.success) {
          this.alertService.successAlert({ title: 'Updated!', close: true });
        }
      });
  }
}
