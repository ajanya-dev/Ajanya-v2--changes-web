import { IGroups } from '../../model/knowledge-base';
import { IKnowledgeBaseArticle } from 'src/app/modules/business-tools/knowledge-base/model/knowledge-base';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { KnowledgeBaseService } from 'src/app/shared/service/knowledge-base/knowledge-base.service';
import { IInfoAlert, ISuccessAlert } from 'src/app/models/alert';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import { NgIf, NgFor, JsonPipe } from '@angular/common';

@Component({
  selector: 'app-articles',
  templateUrl: './articles.component.html',
  styleUrls: ['./articles.component.scss'],
  standalone: true,
  imports: [RouterLink, NgIf, NgFor, RouterLinkActive, JsonPipe]
})
export class ArticlesComponent implements OnInit, OnDestroy {
  knowledgeBaseArticles: IKnowledgeBaseArticle[];
  groups: IGroups[];
  subscriptions: Subscription[] = [];

  constructor(
    public knowledgeBaseService: KnowledgeBaseService,
    private _alertService: AlertService,
    private _router: Router
  ) {}

  ngOnInit(): void {
    this.getArticleData();
    this.getGroupsData();
  }

  /**
   * @description Get articles datas.
   *
   */
  getArticleData() {
    this.knowledgeBaseService.getArticles().subscribe((res) => {
      const knowledgeBaseArticles = res.data;
      this.removeLoadingSpinner();
      this.knowledgeBaseArticles = knowledgeBaseArticles.filter(
        (res) => res.status === 'Active'
      );
    });
  }

  /**
   * @description Get groups datas.
   *
   */
  getGroupsData() {
    this.knowledgeBaseService.getGroups().subscribe((res) => {
      this.groups = res.data;
    });
  }

  /**
   * @description View articles datas.
   *
   */
  viewArticle(disabled: boolean, id: string) {
    if (disabled) {
      this.openInfoAlert('Article is disabled', ' ');
    } else if (!disabled) {
      this._router.navigate(
        ['/manage/business-tools/knowledge-base/view-article'],
        { queryParams: { id: id } }
      );
    }
  }

  /**
   * @description Delete articles datas.
   *
   */
  deleteArticle(id: string) {
    this.knowledgeBaseService.deleteArticleById(id).subscribe((res) => {
      if (res.success) {
        this.openSuccessAlert();
        this.getArticleData();
      }
    });
  }

  /**
   * @description Remove loading spinner.
   *
   */
  removeLoadingSpinner() {
    const loadingSpinner = document.getElementById(
      'loading-spinner'
    ) as HTMLDivElement;
    loadingSpinner.style.display = 'none';
    const row = document.getElementById('remove-row') as HTMLDivElement;
    row.style.display = 'none';
  }

  /**
   * @description Success alert.
   *
   */
  openSuccessAlert(content?: string, _disable?: boolean, timeout?: number) {
    const data: ISuccessAlert = {
      title: 'Success!',
      content: content ? content : 'Article deleted',
      close: true,
      timeout: timeout ? timeout : 2000
    };
    return this._alertService.successAlert(data);
  }

  /**
   * @description Info alert.
   *
   */
  openInfoAlert(
    content?: string,
    title?: string,
    _disable?: boolean,
    timeout?: number
  ) {
    const data: IInfoAlert = {
      title: title ? title : 'Coming Soon!',
      content: content ? content : '',
      close: true,
      timeout: timeout ? timeout : 2000
    };
    return this._alertService.infoAlert(data);
  }

  /**
   * @description Delete article confirmation.
   *
   */
  onDelete(id: string) {
    const data = {
      title: 'Are you sure you want to delete this article?',
      content: '',
      width: '370px',
      doneMsg: 'Yes',
      cancelMsg: 'No'
    };
    const response = this._alertService.confirmAlert(data);
    response.afterClosed().subscribe((result) => {
      if (result) {
        this.deleteArticle(id);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
  }
}
