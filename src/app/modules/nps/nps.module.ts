import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NpsComponent } from './components/nps/nps.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { faAngleRight } from '@fortawesome/pro-solid-svg-icons';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    NpsComponent
  ],
  exports: [NpsComponent]
})
export class NpsModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(faAngleRight);
  }
}
