import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArticleWriterMainComponent } from './pages/article-writer-main/article-writer-main.component';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule } from '@angular/forms';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { MatTooltipModule } from '@angular/material/tooltip';
import { faCheck, faCopy } from '@fortawesome/pro-solid-svg-icons';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
const routes: Routes = [
  { path: '', component: ArticleWriterMainComponent, pathMatch: 'full' }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule,
    FormsModule,
    ClipboardModule,
    MatTooltipModule,
    ArticleWriterMainComponent
  ]
})
export class ArticleWriterModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(faCopy, faCheck);
  }
}
