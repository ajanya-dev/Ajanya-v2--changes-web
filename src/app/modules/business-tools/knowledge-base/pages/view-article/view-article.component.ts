import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { KnowledgeBaseService } from 'src/app/shared/service/knowledge-base/knowledge-base.service';

@Component({
  selector: 'app-view-article',
  templateUrl: './view-article.component.html',
  styleUrls: ['./view-article.component.scss'],
  standalone: true,
  imports: [RouterLink]
})
export class ViewArticleComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  articleContent: string | undefined;

  constructor(
    private activatedRoute: ActivatedRoute,
    public knowledgeBaseService: KnowledgeBaseService
  ) {}

  ngOnInit(): void {
    this.getArticle();
  }

  /**
   * @description Get article data.
   *
   */
  getArticle() {
    this.subscriptions.push(
      this.activatedRoute.queryParams.subscribe((res) => {
        const articleId = res.id;
        this.subscriptions.push(
          this.knowledgeBaseService
            .getArticleById(articleId)
            .subscribe((res) => {
              const knowledgeBaseArticles = res.data[0];
              this.articleContent = knowledgeBaseArticles.s3_path;
              this.removeLoadingSpinner();
            })
        );
      })
    );
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
    const innerHTMLDesign = document.getElementById(
      'inner-html-design'
    ) as HTMLDivElement;
    innerHTMLDesign.style.display = 'block';
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
  }
}
