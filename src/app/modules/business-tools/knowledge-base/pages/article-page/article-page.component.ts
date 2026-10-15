import { IGroups } from '../../model/knowledge-base';
import { OnDestroy } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ISuccessAlert } from 'src/app/models/alert';
import { IKnowledgeBaseArticle } from 'src/app/modules/business-tools/knowledge-base/model/knowledge-base';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { KnowledgeBaseService } from 'src/app/shared/service/knowledge-base/knowledge-base.service';
import { MatDialog } from '@angular/material/dialog';
import { GroupModalComponent } from '../../modals/group-modal/group-modal.component';
import { TextEditorComponent } from '../../../../../shared/components/text-editor/text-editor.component';
import { MatCheckbox } from '@angular/material/checkbox';
import { NgSelectModule } from '@ng-select/ng-select';
import { ControlMessageComponent } from '../../../../../shared/components/control-message/control-message/control-message.component';
import { NgIf, NgFor } from '@angular/common';
import { OcwBackButtonComponent } from '../../../../../shared/components/ocw-back-button/ocw-back-button.component';

@Component({
  selector: 'app-article-page',
  templateUrl: './article-page.component.html',
  styleUrls: ['./article-page.component.scss'],
  standalone: true,
  imports: [
    OcwBackButtonComponent,
    NgIf,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    NgSelectModule,
    NgFor,
    MatCheckbox,
    TextEditorComponent,
    RouterLink
  ]
})
export class ArticlePageComponent implements OnInit, OnDestroy {
  articlesForm!: UntypedFormGroup;
  subscriptions: Subscription[] = [];

  toolbarHiddenButtons = [[], ['insertVideo']];
  editArticleMode = false;
  articleId: string | null;
  headerText: string;

  Empty: string;
  selectedItem: string | undefined | number;
  articleContent: string | undefined;
  slug: string;
  groups: IGroups[];
  onSubmitButtonText = 'Save';

  toKebabCase = (str: { match: (arg0: RegExp) => string[] }) =>
    str &&
    str
      .match(
        /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g
      )
      .map((x: string) => x.toLowerCase())
      .join('-');

  constructor(
    public knowledgeBaseService: KnowledgeBaseService,
    private fb: UntypedFormBuilder,
    private activatedRoute: ActivatedRoute,
    private _alertService: AlertService,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    this.initArticlesForm();
    this.getGroups();
    this.checkArticleMode();
  }
  /**
   * @description  Getting the article groups.
   *
   */
  getGroups() {
    this.knowledgeBaseService.getGroups().subscribe((res) => {
      const groups = res.data;
      this.groups = groups.filter(
        (res: { status: string }) => res.status === 'Active'
      );
    });
  }
  /**
   * @description  checking the article mode and changing the content.
   *
   */
  checkArticleMode() {
    this.subscriptions.push(
      this.activatedRoute.paramMap.subscribe((params) => {
        this.articleId = params.get('id');
        if (this.articleId) {
          this.editArticleMode = true;
          this.headerText = 'Add New Article';
          this.onSubmitButtonText = 'Update';
          this.setArticleFormValuesForEditMode(this.articleId);
        }
      })
    );
  }
  /**
   * @description deleting articles.
   *
   */
  clear() {
    this.selectedItem = this.Empty;
  }
  /**
   * @description  open add group modal.
   *
   */
  openGroupModal() {
    const dialogRef = this.dialog.open(GroupModalComponent, {
      maxWidth: '430px',
      width: '95%',
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.selectedItem = res;
        this.getGroups();
      }
    });
  }

  /**
   * @description Initializes the form group for the bill form.
   *
   */
  initArticlesForm(): void {
    this.articlesForm = this.fb.group({
      subject: ['', [Validators.required]],
      slug: ['', [Validators.required]],
      group_name: ['', [Validators.required]],
      group_id: ['', [Validators.required]],
      internal_article: [false],
      disabled: [false],
      article_description: ['', [Validators.required]],
      status: ['', [Validators.required]]
    });
  }

  /**
   * @description  Change the article content.
   *
   */
  textChange(event: string) {
    this.articleContent = event;
    this.articlesForm.patchValue({
      article_description: this.articleContent
    });
  }

  /**
   * @description  add the group name.
   *
   */
  patchGroupName() {
    this.articlesForm.patchValue({
      group_name: this.selectedItem
    });
  }

  /**
   * @description  Set the data in article form.
   *
   */
  setArticleFormValues(groupId: string) {
    this.articlesForm.patchValue({
      article_description: this.articleContent,
      slug: this.toKebabCase(this.articlesForm.value.subject),
      group_name: this.selectedItem,
      group_id: groupId,
      status: this.articlesForm.value.status
        ? this.articlesForm.value.status
        : 'Active'
    });
  }

  /**
   * @description Set the data in article form.
   *
   */
  setGroupId() {
    for (const group of this.groups) {
      if (this.selectedItem === group.group_name) {
        this.setArticleFormValues(group.id);
      }
    }
  }

  /**
   * @description Set the data in article form for edit mode.
   *
   */
  setArticleFormValuesForEditMode(id: string) {
    this.subscriptions.push(
      this.knowledgeBaseService.getArticleById(id).subscribe((res) => {
        const knowledgeBaseArticles = res.data[0];

        this.articleContent = knowledgeBaseArticles.s3_path;
        this.selectedItem = knowledgeBaseArticles.group_name;

        this.articlesForm.patchValue({
          article_description: knowledgeBaseArticles.article_description,
          slug: knowledgeBaseArticles.slug,
          group_id: knowledgeBaseArticles.group_id,
          subject: knowledgeBaseArticles.subject,
          internal_article: knowledgeBaseArticles.internal_article,
          disabled: knowledgeBaseArticles.disabled,
          status: knowledgeBaseArticles.status
        });
      })
    );
  }

  /**
   * @description Submitting the article form.
   *
   */
  onSubmit() {
    this.articlesForm.markAllAsTouched();
    this.setGroupId();
    if (this.articlesForm.valid) {
      if (this.editArticleMode === false) {
        this.postArticle();
      } else {
        this.updateArticle();
      }
    }
  }

  /**
   * @description Add articles.
   *
   */
  postArticle() {
    this.subscriptions.push(
      this.knowledgeBaseService
        .postArticle(this.articlesFormBody())
        .subscribe((res) => {
          if (res.success) {
            this.openSuccessAlert('Article created');
            this.knowledgeBaseService.navigateByUrl(
              '/manage/business-tools/knowledge-base/articles-list'
            );
          }
        })
    );
  }

  /**
   * @description Edit articles.
   *
   */
  updateArticle() {
    this.subscriptions.push(
      this.knowledgeBaseService
        .updateArticle(this.articlesFormBody(), this.articleId)
        .subscribe((res) => {
          if (res.success) {
            this.openSuccessAlert('Article updated');
            this.knowledgeBaseService.navigateByUrl(
              '/manage/business-tools/knowledge-base/articles-list'
            );
          }
        })
    );
  }

  /**
   * @description Success alert.
   *
   */
  openSuccessAlert(content: string, _disable?: boolean, timeout?: number) {
    const data: ISuccessAlert = {
      title: 'Success!',
      content: content,
      close: true,
      timeout: timeout ? timeout : 2000
    };
    return this._alertService.successAlert(data);
  }

  /**
   * @description Creating article form body.
   *
   */
  articlesFormBody(): IKnowledgeBaseArticle {
    const data = this.articlesForm.value;
    return {
      subject: data.subject,
      slug: data.slug,
      group_id: data.group_id,
      internal_article: data.internal_article,
      disabled: data.disabled,
      article_description: data.article_description,
      group_name: data.group_name,
      status: data.status
    };
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
  }
}
