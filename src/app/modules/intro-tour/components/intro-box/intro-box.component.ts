import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  inject
} from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { faCircleInfo } from '@fortawesome/pro-solid-svg-icons';
import { IIntroStep } from '../../model/intro';
import { IntroService } from '../../service/intro.service';

@Component({
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, CommonButtonV35Component],
  selector: 'app-intro-box',
  templateUrl: './intro-box.component.html',
  styleUrls: ['./intro-box.component.scss']
})
export class IntroBoxComponent implements OnInit, OnDestroy {
  @ViewChild('introBox') introBox: ElementRef;

  private introService = inject(IntroService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private dialog = inject(MatDialog);

  introData!: IIntroStep[];

  faCircleInfo = faCircleInfo;

  top = 0;
  left = 0;

  shadowDivTop = 0;
  shadowDivLeft = 0;
  shadowDivHeight = 0;
  shadowDivWidth = 0;

  windowHeight = 0;
  windowWidth = 0;

  subscriptions: Subscription[] = [];

  showIntroBox = false;
  hideIntroBox = false;

  currentStep: IIntroStep;
  currentStepIndex = 0;
  currentHtmlElement: HTMLElement;

  selectorType = '#';
  description = '';
  stopOrDone = 'Stop';



  @HostListener('window:resize', ['$event']) onResize() {
    if (window.matchMedia('(max-width: 780px)').matches) {
      this.stopIntro(); // Stop intro if it is in mobile.
    }
    this.introBoxPositioning(this.currentHtmlElement);
  }

  @HostListener('window:wheel', ['$event']) listenToScroll() {
    this.introBoxPositioning(this.currentHtmlElement);
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.activatedRoute.queryParamMap.subscribe((param) => {
        const flow = param.get('flow') as string;
        if (flow) {
          this.introData = this.introService.getIntroSteps(flow);
          this.InitiateIntroTour();
          this.introStepChange();
        }
      })
    );
  }

  /**
   * @description This method will initiate the intro tour
   */
  InitiateIntroTour() {
    this.subscriptions.push(
      this.introService.introTrigger.subscribe((res) => {
        // To stop trigerring intro tour if it is already started.
        if (this.introService.introStatus.getValue() === true) {
          return;
        }
        if (res === 'startIntro') {
          this.showIntroBox = true;
          this.hideIntroBox = true;
          setTimeout(() => {
            this.currentStepIndex = 0;
            this.introService.introStatus.next(true);
            this.introService.introStepChange.next(this.introData[0].selector);
          }, 1000);
        }
      })
    );
  }

  /**
   *
   * @param selector Selector of intro step
   * @returns index number of the step
   */
  findIntroStepIndex(selector: string): number {
    return this.introData.findIndex((elem) => elem.selector === selector);
  }

  /**
   * This method will find the element to apply the selection style
   * @returns {HTMLElement} Element that needs to apply the style
   */
  findElementToHighlight(): HTMLElement {
    const { selector } = this.introData[this.currentStepIndex];
    this.selectorType = selector.charAt(0); // Deciding if the selector is an id or a class.

    const elementData = document.querySelectorAll(selector);
    const index = this.introData[this.currentStepIndex]
      .selectElementIndex as number;
    
    if (typeof index === 'number') {
      if (elementData.length === 1) {
        return document.querySelectorAll(selector)[0] as HTMLElement;
      }
      return document.querySelectorAll(selector)[index] as HTMLElement;
    }
    return document.querySelector(selector) as HTMLElement;
  }

  /**
   * This method finds the element that has the intro style, for the style removal.
   * @returns {HTMLElement} Element that needs style removal
   */
  findElementToRemove(): HTMLElement {
    let styleType;

    if (this.currentStep?.padding) {
      if (this.currentStep.paddingType === 'low') {
        styleType = 'intro-style-padding-low';
      } else {
        styleType = 'intro-style-padding';
      }
    } else {
      styleType = 'intro-style';
    }

    const element = document.getElementById(styleType);
    return element as HTMLElement;
  }

  /**
   * @description This method will create a custom delay.
   * @param seconds Seconds to wait
   * @returns Promise that that the 'seconds' to complete
   */
  waitForCustomSeconds(seconds: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, seconds * 1000);
    });
  }

  /**
   * @description This method take care of removing the style from the current element before selecting the next element.
   * This method will remove the intro style id from the element and append the original id before the intro style
.   * @param index Index number of the current step.
   * @param selector selector of the current step.
   */
  removeSelectionFromPrev(index: number) {
    if (this.introData[index].noSelectionRemoval) {
      return;
    }

    const element = this.findElementToRemove();

    if (element !== null && element !== undefined) {
      if (this.selectorType === '#') {
        element.id = this.introData[index].selector.split('#')[1];
        return;
      }
      element.removeAttribute('id');
    }
  }

  /**
   * @description This method will update the step of the intro (not selecting)
   */
  introStepChange() {
    this.subscriptions.push(
      this.introService.introStepChange.subscribe((introStep) => {
        if (introStep.length) {
          let indexNo = 0;
          // This if condition is used to get the indexNo of step because multiple steps have same name.
          if (introStep.includes('$')) {
            const part2 = introStep.split('$').pop(); // pop to only get the second part            
            if(part2){
              const secondPart = part2.trim(); 
              indexNo = Number(secondPart); 
            }
          }
          if(indexNo > 0){
            this.removeSelectionFromPrev(this.currentStepIndex);
            this.currentStepIndex = indexNo;
            this.applyStyleToStep();
          }
          else if (this.findIntroStepIndex(introStep) >= 0) {
            this.removeSelectionFromPrev(this.currentStepIndex);
            this.currentStepIndex = this.findIntroStepIndex(introStep);
            this.applyStyleToStep();
          } else {            
            this.stopIntro();
          }
        }
      })
    );
  }

  /**
   * @description This method apply the intro style to the selected element and also invoke the positioning method to position the intro box accordingly.
   */
  async applyStyleToStep() {
    this.currentStep = { ...this.introData[this.currentStepIndex] }; 
    this.introService.currentIntroStep = this.currentStep;
    if (this.currentStep?.isLastStep) {
      this.stopOrDone = 'Done';
    }else{
      this.stopOrDone = 'Stop';
    }

    // This step is to wait for a custom seconds before we select an element.
    if (this.currentStep.delayBefore) {
      await this.waitForCustomSeconds(this.currentStep.delayBefore);
    }

    const element = this.findElementToHighlight();    
    if (element) {
      this.currentHtmlElement = element;
      this.description = this.currentStep.description;
      this.hideIntroBox = false;
      if (this.currentStep.padding) {
        if (this.currentStep.paddingType === 'low') {
          element.id = 'intro-style-padding-low';
        } else {
          element.id = 'intro-style-padding';
        }
      } else {
        element.id = 'intro-style';
      }

      if (this.introBox) {
        this.introBoxPositioning(element);
      }
    }
  }

  /**
   * @description This method will get executed when a user clicks on the next button in intro info box.
   * This method just increment the intro step by 1 and pass the next selector to the nextIntro <observable> in the IntroV2Sevice.
   */
  nextButtonClick(data: number) {
    let nextIntroId = '';
    let nextIndex = 0;
    const currentStep = this.introData[this.currentStepIndex];
    const indexToJump = currentStep?.jumpOnPrev;
    const receiveFrom = this.introService.recieveFrom(); 
    if(currentStep?.checkFormOnNext && data > 0){            
      if (receiveFrom === 'payer'){
        nextIntroId = '.intro-amount-receive-payer';
      }else if (receiveFrom === 'email'){
        nextIntroId = '.intro-amount-receive-email';
      }else if (receiveFrom === 'sms'){
        nextIntroId = '.intro-amount-receive-sms';
      }else{
        nextIntroId = '.intro-pay-receive';
      }
    }
    else if(currentStep?.checkFormOnPrev && data < 0){
      if(!receiveFrom){
          nextIntroId = '.intro-pay-receive';
      }else{
        nextIntroId = '.receive-from-payee-dropdown';
        // if recieveFrom matches any of the keys it will assign corresponding values , else it will retain old nextIndex value
        nextIndex = {payer: 7, email: 12, sms: 17}[receiveFrom] || nextIndex;
      }
    }
    else if(indexToJump !== undefined && data < 0){
      nextIntroId = this.introData[indexToJump]?.selector;
    }  
    else if (this.introData[this.currentStepIndex + data]?.skipOnNext) {
      nextIndex = this.currentStepIndex + (data > 0 ? data + 1 : data + -1);
      nextIntroId =
        this.introData[
          nextIndex
        ]?.selector;
    } else {
      nextIndex = this.currentStepIndex + data;
      nextIntroId = this.introData[nextIndex]?.selector;
    } 
       
    if (!nextIntroId) {
      this.stopIntro();
    }
    if(nextIndex > 0){
      nextIntroId = `${nextIntroId}$${nextIndex}`;
    }
    if(currentStep?.pageChangeOnPrev === 'payment-page'){
      this.introService.isShowSuccess.set(false);
      this.introService.isSaved.set(false);
    }
    this.introService.introStepChange.next(nextIntroId);
  }

  /**
   * @description This method takes care of finding the exact position to place the intro info box on each step.
   * @param element Highlighted HTMLElement to find its position.
   */
  introBoxPositioning(element: HTMLElement) {
    const elementPlacement = element.getBoundingClientRect();
    this.shadowDivTop = elementPlacement.top;
    this.shadowDivLeft = elementPlacement.left;
    this.shadowDivHeight = element.clientHeight;
    this.shadowDivWidth = element.clientWidth;
    this.windowHeight = window.innerHeight;
    this.windowWidth = window.innerWidth;
    const introBox = this.introBox?.nativeElement;
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    this.currentStep.introBoxPosition =
      this.introData[this.currentStepIndex].introBoxPosition;

    const clockWiseConditions: { [key: string]: () => boolean } = {
      left: () =>
        elementPlacement.x > introBox.offsetWidth + 20 &&
        windowHeight - elementPlacement.bottom > introBox.offsetHeight,
      right: () =>
        windowWidth - elementPlacement.right > introBox.offsetWidth &&
        windowHeight - elementPlacement.bottom > introBox.offsetHeight,
      top: () =>
        (elementPlacement.y > introBox.offsetHeight &&
          windowWidth - elementPlacement.right > introBox.offsetWidth) ||
        element.offsetWidth > introBox.offsetWidth,
      bottom: () =>
        windowHeight - elementPlacement.bottom > introBox.offsetHeight + 20 &&
        windowWidth - elementPlacement.right > introBox.offsetWidth
    };

    const { left, right, top, bottom } = clockWiseConditions;

    if (this.currentStep.introBoxPosition === 'left') {
      if (left()) {
        this.positionLeft(element, introBox);
      } else if (top()) {
        this.currentStep.introBoxPosition = 'top';
        this.positionTop(element, introBox);
      } else if (right()) {
        this.currentStep.introBoxPosition = 'right';
        this.positionRight(element);
      } else if (bottom()) {
        this.currentStep.introBoxPosition = 'bottom';
        this.positionBottom(element);
      } else {
        this.stopIntro();
      }
    } else if (this.currentStep.introBoxPosition === 'right') {
      if (right()) {
        this.positionRight(element);
      } else if (bottom()) {
        this.currentStep.introBoxPosition = 'bottom';
        this.positionBottom(element);
      } else if (left()) {
        this.currentStep.introBoxPosition = 'left';
        this.positionLeft(element, introBox);
      } else if (top()) {
        this.currentStep.introBoxPosition = 'top';
        this.positionTop(element, introBox);
      } else {
        this.stopIntro();
      }
    } else if (this.currentStep.introBoxPosition === 'top') {
      if (top()) {
        this.positionTop(element, introBox);
      } else if (right()) {
        this.currentStep.introBoxPosition = 'right';
        this.positionRight(element);
      } else if (bottom()) {
        this.currentStep.introBoxPosition = 'bottom';
        this.positionBottom(element);
      } else if (left()) {
        this.currentStep.introBoxPosition = 'left';
        this.positionLeft(element, introBox);
      } else {
        this.stopIntro();
      }
    } else if (this.currentStep.introBoxPosition === 'bottom') {
      if (bottom()) {
        this.positionBottom(element);
      } else if (left()) {
        this.currentStep.introBoxPosition = 'left';
        this.positionLeft(element, introBox);
      } else if (top()) {
        this.currentStep.introBoxPosition = 'top';
        this.positionTop(element, introBox);
      } else if (right()) {
        this.currentStep.introBoxPosition = 'right';
        this.positionRight(element);
      } else {
        this.stopIntro();
      }
    }
  }

  /**
   * @description This method will position the intro info box in the left side of the element.
   * @param element {HTMLElement} The element to be higlighted.
   * @param introBox {HTMLElement} The intro info box element.
   */
  positionLeft(element: HTMLElement, introBox: HTMLElement) {
    const elementPosition = element.getBoundingClientRect();
    this.top = elementPosition.top;
    this.left =
      elementPosition.left - (introBox as HTMLElement).offsetWidth - 15;
    this.hideIntroBox = false;
  }

  /**
   * @description This method will position the intro info box in the right side of the element.
   * @param element {HTMLElement} The element to be higlighted.
   */
  positionRight(element: HTMLElement) {
    const elementPosition = element.getBoundingClientRect();
    this.top = elementPosition.top;
    this.left =
      elementPosition.left + (element as HTMLElement).offsetWidth + 15;
    this.hideIntroBox = false;
  }

  /**
   * @description This method will position the intro info box in the top side of the element.
   * @param element {HTMLElement} The element to be higlighted.
   * @param introBox {HTMLElement} The intro info box element.
   */
  positionTop(element: HTMLElement, introBox: HTMLElement) {
    const elementPosition = element.getBoundingClientRect();
    this.top =
      elementPosition.top -
      (introBox as HTMLElement).getBoundingClientRect().height -
      16;
    this.left = elementPosition.left;
    this.hideIntroBox = false;
  }

  /**
   * @description This method will position the intro info box in the bottom side of the element.
   * @param element {HTMLElement} The element to be higlighted.
   * @param introBox {HTMLElement} The intro info box element.
   */
  positionBottom(element: HTMLElement) {
    const elementPosition = element.getBoundingClientRect();
    this.top = elementPosition.bottom - 10;
    this.left = elementPosition.left;
    this.hideIntroBox = false;
  }

  stopIntro() {     
    const url = this.introService.beforeUrl.split('?')[0]; 
    this.dialog.closeAll();
    this.introService.introForm.reset();
    this.introService.isBlinking.set(true);
    this.removeSelectionFromPrev(this.currentStepIndex);
    this.introService.introStatus.next(false);
    this.showIntroBox = false;
    this.currentStepIndex = 0;
    this.introService.introStepChange.next('');
    this.currentStep = this.introData[0];
    if (url.includes('intro-tour')) {
      this.router.navigate(['/manage/home']);
    }else{
      this.router.navigate([url]);
    }
  }

  ngOnDestroy(): void {
    this.stopIntro();
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
