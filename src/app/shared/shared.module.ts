import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ImageCropperModule } from 'ngx-image-cropper';
import { HttpClientModule } from '@angular/common/http';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { AngularMaterialModule } from '../modules/angular-material/angular-material.module';
import { ControlMessageComponent } from './components/control-message/control-message/control-message.component';
import { CalculatorComponent } from './components/calculator/calculator.component';
import { CustomRangeComponent } from './components/date-range/header/custom-range/custom-range.component';
import { HeaderComponent } from './components/date-range/header/header.component';
import { PermissionDeniedComponent } from './components/permission-denied/permission-denied.component';
import { ChangeBaseUrlModalComponent } from './modal/change-base-url(staging)/change-base-url-modal/change-base-url-modal.component';
import { PipesModule } from '../pipes/pipes.module';
import { CopiedTextComponent } from './components/copied-text/copied-text.component';
import { NewUserModalLatestComponent } from './modal/user-modal/new-user-modal-latest/new-user-modal-latest.component';
import { UploadImageModalComponent } from './modal/upload-image-modal/upload-image-modal.component';

import { AddContactModalComponent } from './modal/add-contact/add-contact-modal/add-contact-modal.component';
import { CyberSourceAutherizationModalComponent } from './modal/cyber-source-modals/cyber-source-autherization-modal/cyber-source-autherization-modal.component';
import { NewCreditCardModalComponent } from './modal/cyber-source-modals/new-credit-card-modal/new-credit-card-modal.component';
import { AddPayeeBankModalComponent } from './modal/payee-bank-modal/add-payee-bank-modal/add-payee-bank-modal.component';
import { LoaderModalComponent } from './modal/loader-modal/loader-modal.component';
import { AddToDoModalComponent } from './modal/todo/add-to-do-modal/add-to-do-modal.component';
import { FeatureRequestModalComponent } from './modal/feature-request-modal/feature-request-modal.component';
import { WhatsNewComponent } from '../layout/header/whats-new/whats-new.component';
import { TryNewVersionV3AlertComponent } from './modal/try-new-version-v3-alert/try-new-version-v3-alert.component';
import { SearchFilterPipe } from '../pipes/search-filter.pipe';
import { EditUserModalComponent } from './modal/user-modal/edit-user-modal/edit-user-modal.component';
import { V3DtDropDownPayeeComponent } from './v3/dt-cellrenderers/v3-dt-drop-down-payee/v3-dt-drop-down-payee.component';
import { V3DescriptionComponent } from './v3/dt-cellrenderers/v3-description/v3-description.component';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import {
  faAddressBook,
  faBuilding,
  faCaretDown,
  faCaretUp,
  faCreditCard,
  faCreditCardFront,
  faDownload,
  faEnvelope,
  faPlayCircle,
  faPlus,
  faTimes,
  faTrash,
  faUpload,
  faWallet,
  faSpinnerThird,
  faPaperclip,
  faUpToLine,
  faCircleInfo,
  faCircleCheck,
  faCamera,
  faXmark,
  faUsers
} from '@fortawesome/pro-solid-svg-icons';
import { EllipsisActiveDirective } from '../directive/ellipsis-active.directive';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { helpVideoReducer } from './service/common/shared/help-video-state/video.reducer';
import { helpVideoEffects } from './service/common/shared/help-video-state/video.effects';
import { CommonButtonV35Component } from './v3/buttons/common-button-v35/common-button-v35.component';
import { CommonUploadButtonV35Component } from './v3/buttons/common-upload-button-v35/common-upload-button-v35.component';

@NgModule({
  imports: [
    NgxMaskPipe,
    NgxMaskDirective,
    NgSelectModule,
    FormsModule,
    AngularMaterialModule,
    ReactiveFormsModule,
    CommonModule,
    DragDropModule,
    PipesModule,
    ImageCropperModule,
    HttpClientModule,
    AngularEditorModule,
    EllipsisActiveDirective,
    StoreModule.forFeature('helpVideos', helpVideoReducer),
    EffectsModule.forFeature([helpVideoEffects]),
    FontAwesomeModule,
    CommonButtonV35Component,
    CommonUploadButtonV35Component,
    CustomRangeComponent,
    HeaderComponent,
    ControlMessageComponent,
    CalculatorComponent,
    NewUserModalLatestComponent,
    EditUserModalComponent,
    PermissionDeniedComponent,
    ChangeBaseUrlModalComponent,
    CopiedTextComponent,
    UploadImageModalComponent,
    AddContactModalComponent,
    CyberSourceAutherizationModalComponent,
    NewCreditCardModalComponent,
    AddPayeeBankModalComponent,
    AddToDoModalComponent,
    LoaderModalComponent,
    FeatureRequestModalComponent,
    WhatsNewComponent,
    TryNewVersionV3AlertComponent,
    V3DtDropDownPayeeComponent,
    V3DescriptionComponent
  ],
  exports: [RouterModule, ControlMessageComponent],
  providers: [SearchFilterPipe, DatePipe]
})
export class SharedModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faDownload,
      faEnvelope,
      faTrash,
      faTimes,
      faPlus,
      faPlayCircle,
      faSpinnerThird,
      faCaretUp,
      faCaretDown,
      faUpload,
      faBuilding,
      faWallet,
      faCreditCardFront,
      faCamera,
      faCreditCard,
      faAddressBook,
      faPaperclip,
      faUpToLine,
      faCircleInfo,
      faCircleCheck,
      faXmark,
      faUsers
    );
  }
}
