import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { DepositSlipsService } from 'src/app/shared/service/deposit-slips/deposit-slips.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { TextEditorComponent } from 'src/app/shared/components/text-editor/text-editor.component';

interface IDynamicElement {
  tag: string;
  label: string;
}

@Component({
  selector: 'app-edit-stub-modal-v4',
  templateUrl: './edit-stub-modal-v4.component.html',
  styleUrls: ['./edit-stub-modal-v4.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    CommonButtonV4Component,
    TextEditorComponent
  ]
})
export class EditStubModalV4Component implements OnInit {
  private dialogRef = inject(MatDialogRef<EditStubModalV4Component>);
  private depositService = inject(DepositSlipsService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);

  stubMessage = '';
  saving = signal(false);
  loading = signal(true);

  editorStyles = { height: '300px', minHeight: '120px' };

  toolbarHiddenButtons = [
    [
      'undo',
      'redo',
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
      'heading'
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

  dynamicElements: IDynamicElement[] = [
    { tag: '#ref_id', label: 'Reference ID of the deposit slip' },
    { tag: '#created_by_name', label: 'Name of the person who created the slip' },
    { tag: '#created_date_time', label: 'Date and time when slip was created' },
    { tag: '#depo_date', label: 'Deposit date' },
    { tag: '#memo', label: 'Memo field content' },
    { tag: '#total_amount', label: 'Total deposit amount' },
    { tag: '#created_date', label: 'Creation date only' },
    { tag: '#total_item', label: 'Total number of items' },
    { tag: '#deposit_from', label: 'Deposit source' }
  ];

  ngOnInit(): void {
    this.getStub();
  }

  getStub(): void {
    this.loading.set(true);
    this.depositService
      .getStub()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((data) => {
        if (data?.success) {
          this.stubMessage = data.data;
        }
      });
  }

  onTextChange(event: string): void {
    this.stubMessage = event;
  }

  insertElement(element: IDynamicElement): void {
    const editorEl = document.querySelector('.angular-editor-textarea') as HTMLElement;
    if (editorEl) {
      editorEl.focus();
      document.execCommand('insertText', false, element.tag);
    } else {
      this.stubMessage += ` ${element.tag}`;
    }
  }

  saveStub(): void {
    this.saving.set(true);
    this.depositService
      .saveStub(this.stubMessage)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((data) => {
        if (data?.success) {
          this.alertService.successAlert({ title: 'Updated!', close: true });
          this.dialogRef.close(true);
        }
      });
  }

  close(): void {
    this.dialogRef.close();
  }
}
