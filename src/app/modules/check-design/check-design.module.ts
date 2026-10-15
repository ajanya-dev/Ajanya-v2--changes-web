import { NgModule } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { ColorPickerModule } from 'ngx-color-picker';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { CheckdesignCanvasService } from 'src/app/shared/service/check-design/checkdesign-canvas.service';

import {
  faAlignCenter,
  faAlignLeft,
  faArrowLeft,
  faArrowRight,
  faArrowsH,
  faBold,
  faBoxOpen,
  faCircle,
  faCopy,
  faCrown,
  faEdit,
  faHeart,
  faHorizontalRule,
  faImages,
  faItalic,
  faMobileAndroid,
  faPaste,
  faPencilSquare,
  faPlus,
  faQrcode,
  faRotate,
  faRotateLeft,
  faRotateRight,
  faScissors,
  faSquare,
  faStar,
  faTimes,
  faTimesCircle,
  faTrash,
  faTriangle,
  faTvAlt,
  faUnderline,
  faUpload,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { faMagnifyingGlassPlus } from '@fortawesome/pro-regular-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CheckDesignComponent } from './pages/check-design/check-design.component';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { ElementsMenuComponent } from './components/elements-menu/elements-menu.component';
import { CheckdesignCanvasComponent } from './components/checkdesign-canvas/checkdesign-canvas.component';
import { TextMenuComponent } from './components/text-menu/text-menu.component';
import { SignatureMenuComponent } from './components/signature-menu/signature-menu.component';
import { ShapesMenuComponent } from './components/shapes-menu/shapes-menu.component';
import { LogosMenuComponent } from './components/logos-menu/logos-menu.component';
import { EditImageComponent } from './components/edit-image/edit-image.component';
import { EditNicknameModalComponent } from './modals/edit-nickname-modal/edit-nickname-modal.component';
import { IconsMenuComponent } from './components/icons-menu/icons-menu.component';
import { ImagesMenuComponent } from './components/images-menu/images-menu.component';
import { BackgroundMenuComponent } from './components/background-menu/background-menu.component';
import { BanklogosMenuComponent } from './components/banklogos-menu/banklogos-menu.component';
import { AddCustomElementComponent } from './modals/add-custom-element/add-custom-element.component';
import { CheckTemplatesModalComponent } from './check-design/check-templates-modal/check-templates-modal.component';
import { CheckTemplatePreviewModalComponent } from './check-design/check-templates-modal/check-template-preview-modal/check-template-preview-modal.component';

/**
 * @description Routes avaiable In CheckDesingModuel
 */
const routes: Routes = [
  {
    path: 'edit/:id',
    component: CheckDesignComponent
  }
];

/**
 * @description Module for Check Design. with only One page and route.
 */
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    ColorPickerModule,
    RouterModule.forChild(routes),
    AngularMaterialModule,
    NgxMaskDirective,
    NgxMaskPipe,
    FontAwesomeModule,
    CommonButtonV35Component,
    NgOptimizedImage,
    CheckDesignComponent,
    ElementsMenuComponent,
    CheckdesignCanvasComponent,
    TextMenuComponent,
    SignatureMenuComponent,
    ShapesMenuComponent,
    LogosMenuComponent,
    EditImageComponent,
    EditNicknameModalComponent,
    IconsMenuComponent,
    ImagesMenuComponent,
    BackgroundMenuComponent,
    BanklogosMenuComponent,
    CheckTemplatesModalComponent,
    CheckTemplatePreviewModalComponent,
    AddCustomElementComponent
  ],
  providers: [CheckdesignCanvasService]
})
export class CheckDesignModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faCircle,
      faCrown,
      faPlus,
      faTimes,
      faArrowsH,
      faTimesCircle,
      faArrowLeft,
      faArrowRight,
      faPencilSquare,
      faTrash,
      faSquare,
      faTriangle,
      faStar,
      faHorizontalRule,
      faHeart,
      faMobileAndroid,
      faUpload,
      faQrcode,
      faEdit,
      faTvAlt,
      faBoxOpen,
      faUnderline,
      faItalic,
      faBold,
      faAlignLeft,
      faAlignCenter,
      faImages,
      faRotateLeft,
      faRotateRight,
      faRotate,
      faScissors,
      faCopy,
      faPaste,
      faMagnifyingGlassPlus,
      faXmark
    );
  }
}
