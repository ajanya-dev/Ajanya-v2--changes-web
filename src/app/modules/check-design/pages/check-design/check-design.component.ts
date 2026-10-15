import { ThemeService } from 'src/app/shared/service/theme/theme.service';
import {
  Component,
  HostListener,
  OnInit,
  ViewChild,
  OnDestroy,
  inject,
  signal
} from '@angular/core';
import { Subscription } from 'rxjs';
import { EditCheckDesignService } from 'src/app/shared/service/check-design/check-design-data.service';
import {
  CheckdesignCanvasService,
  IActiveMenu
} from 'src/app/shared/service/check-design/checkdesign-canvas.service';
import { CheckDesignService } from 'src/app/shared/service/check-design/check-design.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { ActivatedRoute, Router } from '@angular/router';
import Mousetrap from 'mousetrap';
import {
  LocationStrategy,
  NgClass,
  NgFor,
  NgOptimizedImage,
  NgIf,
  KeyValuePipe
} from '@angular/common';
import { finalize } from 'rxjs/operators';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { IAppConfig } from 'src/app/models/app_settings';
import { MatDialog } from '@angular/material/dialog';
import {
  ICheckDesign,
  ICheckDesignData,
  ICheckDesignObjects
} from 'src/app/models/check-design';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { FormsModule } from '@angular/forms';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { SignatureMenuComponent } from '../../components/signature-menu/signature-menu.component';
import { CheckTemplatesModalComponent } from '../../check-design/check-templates-modal/check-templates-modal.component';
import { CheckdesignCanvasComponent } from '../../components/checkdesign-canvas/checkdesign-canvas.component';
import { EditImageComponent } from '../../components/edit-image/edit-image.component';
import { ShapesMenuComponent } from '../../components/shapes-menu/shapes-menu.component';
import { BanklogosMenuComponent } from '../../components/banklogos-menu/banklogos-menu.component';
import { BackgroundMenuComponent } from '../../components/background-menu/background-menu.component';
import { ImagesMenuComponent } from '../../components/images-menu/images-menu.component';
import { IconsMenuComponent } from '../../components/icons-menu/icons-menu.component';
import { LogosMenuComponent } from '../../components/logos-menu/logos-menu.component';
import { TextMenuComponent } from '../../components/text-menu/text-menu.component';
import { ElementsMenuComponent } from '../../components/elements-menu/elements-menu.component';

/**
 * @description Angular component responsible for designing checks.
 */
@Component({
  selector: 'app-check-design',
  templateUrl: './check-design.component.html',
  styleUrls: ['./check-design.component.scss'],
  standalone: true,
  imports: [
    FaIconComponent,
    NgClass,
    FormsModule,
    NgFor,
    NgOptimizedImage,
    MatTooltip,
    ElementsMenuComponent,
    TextMenuComponent,
    LogosMenuComponent,
    SignatureMenuComponent,
    IconsMenuComponent,
    ImagesMenuComponent,
    BackgroundMenuComponent,
    BanklogosMenuComponent,
    ShapesMenuComponent,
    EditImageComponent,
    CheckdesignCanvasComponent,
    NgIf,
    KeyValuePipe,
    DemoVideoComponent
  ]
})
export class CheckDesignComponent implements OnInit, OnDestroy {
  public checkDesignData = inject(EditCheckDesignService);
  public checkDesignService = inject(CheckDesignService);
  public canvasService = inject(CheckdesignCanvasService);
  public alertService = inject(AlertService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private locationStrategy = inject(LocationStrategy);
  private appSettingService = inject(AppSettingsService);
  private themeService = inject(ThemeService);
  private dialog = inject(MatDialog);

  @ViewChild(SignatureMenuComponent)
  private signatureMenu: SignatureMenuComponent;

  subscriptions: Subscription[] = [];
  appConfig: IAppConfig;

  designData: ICheckDesignData = {} as ICheckDesignData;
  activeMenu: IActiveMenu = {} as IActiveMenu;

  showPreview = false;
  clipboardHasObject = false;

  bankAccountId: string;
  loading = false;
  selectedPreTemplate: number;
  isMICRCode = signal(false);

  templates = {
    1: 'Recommended Style',
    2: 'Payroll Check Template',
    3: 'Pre Printed Check Template',
    4: 'View More'
  } as const;

  selectedTemplate = '';
  type: string;
  fromVersion: string;
  returnUrl: string;
  preMadeTemplateId: number | undefined;
  templateId: string;

  constructor() {
    // Disable browser back button
    history.pushState(null, '', location.href);
    this.locationStrategy.onPopState(() => {
      history.pushState(null, '', location.href);
    });
  }

  ngOnInit(): void {
    this.loadAppSettings();
    this.bankAccountId = this.route.snapshot.params.id;
    this.type = this.route.snapshot.queryParams.data;
    this.fromVersion = this.route.snapshot.queryParams.from;
    this.returnUrl = this.route.snapshot.queryParams.returnUrl;
    this.getDesign();

    this.mousetrapBind();
    this.subscriptions.push(
      this.canvasService.activeMenu$.subscribe((menu) => {
        this.activeMenu = menu;
        if(menu?.mode === 'routing_no'){
          this.isMICRCode.set(true);
        }else{
          this.isMICRCode.set(false);
        }
      })
    );

    if (this.type === 'check') {
      this.canvasService.setActiveMenu({ name: 'menu-signature' });
    }

    const checkDesignTempateId = sessionStorage.getItem('checkDesignTempateId');
    if (
      checkDesignTempateId &&
      JSON.parse(checkDesignTempateId)?.accountId === this.bankAccountId
    ) {
      this.getTemplate(JSON.parse(checkDesignTempateId)?.templateId);
    }

    this.themeService.initTheme();
  }

  /**
   * @description Loads the application settings.
   */
  loadAppSettings(): void {
    this.subscriptions.push(
      this.appSettingService.appConfig$.subscribe(
        (config: IAppConfig | null) => {
          if (config) {
            this.appConfig = config;
          }
        }
      )
    );
  }

  /**
   * @description Retrieves the check design data from the server.
   */
  getDesign() {
    this.subscriptions.push(
      this.checkDesignService
        .getDesign(this.bankAccountId)
        .subscribe(async (data) => {
          if (data?.success) {
            this.designData = data.data;
            this.designData.checkDesign = JSON.parse(
              this.designData.checkDesign as string
            );
            this.handleDataUriImages(
              (this.designData.checkDesign as ICheckDesign).objects
            );
            this.editCheckDesign();
            if (
              (this.designData.checkDesign as ICheckDesign)?.backgroundImage
                ?.src
            ) {
              this.canvasService.initialBackgroundMeta =
                await this.canvasService.getImageNaturalSize(
                  (this.designData.checkDesign as ICheckDesign)?.backgroundImage
                    ?.src ?? ''
                );
            }
            this.canvasService.bankVariables = this.designData;
            this.signatureMenu.setQrImage();
            if (data.data?.templateLogo || data.data?.templateSignature) {
              this.updateLogoSignature(
                data.data?.templateLogo,
                data.data?.templateSignature
              );
            }
          }
        })
    );
  }

  /**
   *@description Edits the check design by updating the properties of each object in the `checkDesign.objects` array,
   * except for the object with `id` equal to `"dynamic['bank_account_routing_no']"`.
   */
  editCheckDesign(): void {
    const updatedObjects: any[] = (
      this.designData.checkDesign as ICheckDesign
    ).objects.map((obj) => {
      if (obj.id === "dynamic['bank_account_routing_no']") {
        return obj;
      }
      let selectedFontStyle;
      let selectedFontFamily;
      let selectedColor;
      if (obj.styles && obj.styles?.length) {
        selectedFontStyle = obj?.styles[0]?.style?.fontStyle ?? 'normal';
        selectedFontFamily = obj?.styles[0]?.style?.fontFamily ?? 'Arial';
        selectedColor = obj?.styles[0]?.style?.fill ?? '#000';
      } else {
        selectedFontStyle = obj.fontStyle ?? 'normal';
        selectedFontFamily = obj.fontFamily ?? 'Arial';
        selectedColor = obj.fill ?? '#000';
      }
      
      return {
        ...obj,
        selectable: true,
        hasControls: true,
        lockMovementX: false,
        lockMovementY: false,
        fontStyle: selectedFontStyle,
        fontFamily: selectedFontFamily,
        fill: selectedColor,
        styles: []
      };
    });

    this.designData.checkDesign = {
      ...(this.designData.checkDesign as ICheckDesign),
      objects: updatedObjects
    };
    this.canvasService.initEditCheckCanvas(this.designData.checkDesign);
  }

  /**
   * @description Handles data URI images in the check design objects.
   * @param data - Array of check design objects.
   */
  handleDataUriImages(data: ICheckDesignObjects[]) {
    data.forEach((obj) => {
      if (obj.src && obj.type === 'image' && obj.src.includes('data:image/')) {
        obj.src = obj.src.split('?')[1];
      }
    });
  }

  /**
   * @description Getting template using this method.
   */
  getTemplate(templateId: string, preTemplateId?: number) {
    this.subscriptions.push(
      this.checkDesignService
        .getTemplate(this.bankAccountId, templateId, preTemplateId)
        .subscribe((data) => {
          if (data?.success) {
            this.designData = data.data;
            this.designData.checkDesign = JSON.parse(
              this.designData.checkDesign as string
            );
            this.canvasService.initEditCheckCanvas(this.designData.checkDesign);
          }
        })
    );
  }

  /**
   * @description To update the templates.
   */
  templateChange(template: string) {
    this.templateId = template;
    if (template === '4') {
      this.openCheckTemplateModal();
    } else {
      // eslint-disable-next-line @typescript-eslint/ban-types
      const dRef = this.alertService.confirmAlert({
        content: `Are you sure you want to change template to ${
          this.templates[template as keyof object]
        }?`
      });
      dRef.afterClosed().subscribe((res) => {
        this.preMadeTemplateId = 0;
        if (res) {
          this.getTemplate(template);
        } else {
          this.selectedTemplate = '';
        }
      });
    }
  }

  /**
   * @description Open the modal of check templates and update the templates.
   */
  openCheckTemplateModal() {
    const dialogRef = this.dialog.open(CheckTemplatesModalComponent, {
      maxWidth: '1050px',
      width: '90%',
      disableClose: true
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res.templateId) {
        this.preMadeTemplateId = res.templateId;
        this.getTemplate(this.templateId, this.preMadeTemplateId);
      }
      this.selectedTemplate = '';
    });
  }

  /**
   * @description Update Logo & Signature for new banks
   */
  updateLogoSignature(logoUrl: string, signatureUrl: string) {
    if (logoUrl) {
      this.canvasService.addImage(logoUrl);
    }
    if (signatureUrl) {
      this.canvasService.addImage(signatureUrl, '', {
        id: 'user_signature',
        left: 510,
        top: 175,
        originX: 'left',
        originY: 'top',
        cornerStyle: 'circle',
        transparentCorners: false,
        cornerColor: 'orange',
        borderColor: 'orange',
        cornerSize: 14,
        padding: 4,
        borderDashArray: [6, 6],
        rotatingPointOffset: 25,
        type: 'image'
      });
    }
  }

  /**
   * @description Resets the design on the canvas.
   */
  resetDesign() {
    const confRef = this.alertService.confirmAlert({
      title: null,
      content: 'Are you sure you want to reset design?'
    });
    confRef.afterClosed().subscribe((res) => {
      if (res) {
        this.preMadeTemplateId = undefined;
        this.canvasService.initEditCheckCanvas(this.designData.checkDesign);
      }
    });
  }

  /**
   * @description Saves the current design to the server.
   */
  saveDesign() {
    this.loading = true;

    const checkData = this.canvasService.getCanvasData();
    checkData.background = '#FFFFFF';

    if (checkData?.objects?.length) {
      checkData.objects = checkData.objects.filter(
        (ele) => ele.id !== 'grid_line' && ele.id !== 'grid_image'
      );
    }

    for (let i = checkData.objects.length - 1; i >= 0; i--) {
      if (
        (checkData.objects[i].type === 'i-text' ||
          checkData.objects[i].type === 'text') &&
        (!checkData.objects[i].text || checkData.objects[i].text === '')
      ) {
        checkData.objects.splice(i, 1);
        continue;
      }

      if (!checkData.objects[i].id) {
        checkData.objects[i].id = 'newid';
        continue;
      }

      if (
        checkData.objects[i].id === 'grid_line' ||
        checkData.objects[i].id === 'grid_image'
      ) {
        checkData.objects.splice(i, 1);
      }
    }
    const updatedObjects: any[] = checkData.objects.map((obj) => {
      if (obj.id === "dynamic['bank_account_routing_no']") {
        return obj;
      }
      return {
        ...obj,
        selectable: true,
        hasControls: true,
        lockMovementX: false,
        lockMovementY: false
      };
    });
    checkData.objects = updatedObjects;
    const sendingData = {
      checkData,
      templateId: this.preMadeTemplateId
    };

    this.checkDesignService
      .saveDesign(this.designData.bankAccountId, sendingData)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((data) => {
        if (data?.success) {
          this.alertService.successAlert({
            content: 'Design saved successfully ',
            close: true,
            timeout: 2000
          });
          this.preMadeTemplateId = undefined;
          this.canvasService.justSavedDesign = true;
        }
      });
  }

  /**
   * @description Toggles the loading state.
   * @param value - Boolean value to set the loading state.
   */
  toggleLoading(value: boolean) {
    this.loading = value;
  }

  /**
   * @description Binds keyboard shortcuts using the Mousetrap library.
   */
  mousetrapBind() {
    Mousetrap.bind('del', () => this.canvasService.deleteObject());
    Mousetrap.bind('right', () => this.canvasService.moveObjects('right'));
    Mousetrap.bind('left', () => this.canvasService.moveObjects('left'));
    Mousetrap.bind('up', () => this.canvasService.moveObjects('up'));
    Mousetrap.bind('down', () => this.canvasService.moveObjects('down'));
  }

  /**
   * @description Previews the current check design.
   */
  preview() {
    this.showPreview = true;
    this.canvasService.previewDesign();
  }

  /**
   * @description Closes the preview of the check design.
   */
  closePreview() {
    this.canvasService.closePreview();
    this.showPreview = false;
  }

  /**
   * @description Toggles the visibility of grid lines on the canvas.
   */
  toggleGridLine() {
    this.canvasService.toggleGridLine();
  }

  /**
   * @description Deletes the currently selected object from the canvas.
   */
  cutObject() {
    this.copyObject();
    this.canvasService.deleteObject();
  }

  /**
   * @description Copies the currently selected object to the clipboard.
   */
  copyObject() {
    this.clipboardHasObject = this.canvasService.copyObject();
  }

  /**
   * @description Pastes the object from the clipboard onto the canvas.
   */
  pasteObject() {
    this.canvasService.pasteObject();
  }

  /**
   * @description Navigates back to the bank page with optional confirmation.
   */
  goBackToBankPage() {
    if (
      this.canvasService.canvasHistory.undoList.length > 1 &&
      !this.canvasService.justSavedDesign
    ) {
      const dRef = this.alertService.confirmAlert({
        content: 'Changes you made may not be saved',
        cancelMsg: 'Continue Editing',
        isCancel: true,
        isOk: true,
        doneMsg: 'OK'
      });
      dRef.afterClosed().subscribe((res) => {
        if (res) {
          this.navigateBack();
        }
      });
    } else {
      setTimeout(() => {
        this.navigateBack();
      }, 100);
    }
  }

  private navigateBack() {
    const isV4 = this.fromVersion === 'v4';
    if (this.type === 'check') {
      this.router.navigate([
        isV4 ? '/v4/manage/payments-out/detailed/check' : 'manage/cheque/checkrecords'
      ]);
      return;
    }
    this.router.navigate(
      [isV4 ? '/v4/manage/bank-accounts/index' : '/manage/bank-accounts/index'],
      { queryParams: { selectPrev: true } }
    );
  }

  /**
   * @description Host listener for preventing unsaved changes during navigation.
   * @returns - boolean indicating whether navigation is allowed.
   */
  @HostListener('window:beforeunload')
  canDeactivate(): boolean {
    if (
      this.canvasService.canvasHistory.undoList.length > 1 &&
      !this.canvasService.justSavedDesign
    ) {
      return false;
    }
    return true;
  }

  /**
   * @description Host listener for handling popstate events (e.g., back button).
   * @param event - Popstate event object.
   */
  @HostListener('window:popstate', ['$event'])
  onPopState() {
    this.goBackToBankPage();
  }

  /**
   * @description Disposes of the canvas and its history.
   */
  disposeCanvas() {
    this.canvasService.setActiveMenu({ name: 'menu-elements', mode: 'new' });
    this.canvasService.canvasHistory = { undoList: [], redoList: [] };
  }

  ngOnDestroy(): void {
    this.disposeCanvas();

    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}
