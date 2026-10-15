import { NgModule } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { faPen, faPlus, faTrash } from '@fortawesome/pro-solid-svg-icons';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { TimeoutModalComponent } from './modals/timeout-modal/timeout-modal.component';
import { ComingSoonComponent } from './components/coming-soon/coming-soon.component';
import { SubscriptionRequiredComponent } from './components/subscription-required/subscription-required.component';
import { FirstLoaderComponent } from './components/first-loader/first-loader.component';
import { OnBehalfOfComponent } from './components/on-behalf-of/on-behalf-of.component';
import { SwitchAppComponent } from './components/switch-app/switch-app.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    AngularMaterialModule,
    SharedModule,
    NgSelectModule,
    NgOptimizedImage,
    NotFoundComponent,
    TimeoutModalComponent,
    ComingSoonComponent,
    SubscriptionRequiredComponent,
    FirstLoaderComponent,
    OnBehalfOfComponent,
    SwitchAppComponent
  ],
  exports: [FirstLoaderComponent, OnBehalfOfComponent]
})
export class CommonComponentsModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(faPen, faTrash, faPlus);
  }
}
