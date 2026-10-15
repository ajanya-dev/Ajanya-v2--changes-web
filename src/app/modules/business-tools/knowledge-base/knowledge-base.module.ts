import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { TextEditorComponent } from 'src/app/shared/components/text-editor/text-editor.component';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faEye,
  faEyeSlash,
  faPenToSquare,
  faPlus,
  faShareNodes,
  faTimes,
  faTrash
} from '@fortawesome/pro-solid-svg-icons';
import { ArticlesComponent } from './pages/articles/articles.component';
import { ArticlePageComponent } from './pages/article-page/article-page.component';
import { AngularMaterialModule } from '../../angular-material/angular-material.module';
import { GroupsComponent } from './pages/groups/groups.component';
import { GroupModalComponent } from './modals/group-modal/group-modal.component';
import { ViewArticleComponent } from './pages/view-article/view-article.component';

const routes: Routes = [
  { path: 'articles-list', component: ArticlesComponent, pathMatch: 'full' },
  { path: 'article', component: ArticlePageComponent },
  { path: 'view-article', component: ViewArticleComponent },
  { path: 'article/:id', component: ArticlePageComponent },
  { path: 'groups-list', component: GroupsComponent }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule,
    OcwBackButtonComponent,
    TextEditorComponent,
    AngularMaterialModule,
    NgSelectModule,
    ArticlesComponent,
    ArticlePageComponent,
    GroupsComponent,
    GroupModalComponent,
    ViewArticleComponent
  ]
})
export class KnowledgeBaseModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faTrash,
      faPlus,
      faEye,
      faEyeSlash,
      faTimes,
      faShareNodes,
      faPenToSquare
    );
  }
}
