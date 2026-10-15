import { IconProp } from '@fortawesome/fontawesome-svg-core';

export interface IIntroStep {
  /**
   * @description This key is used to select the element from the DOM, must be a 'Class' or an 'Id'.
   * @example <div class='some-class'></div>
   * @example <div id='some-id'></div>
   */
  selector: string;

  /**
   * @description This key is used to provide the description about the step to be displayed in the intro-info-box.
   */
  description: string;

  /**
   * @description This key is used to specify the position of the intro-info-box relative to the selected element.
   *              The value must be of the four positions [left, top, right, bottom]
   *               If the intro-info-box does not have enought space in the provided position, will automatically update the position in below order.
   * @enum {left => top => right => bottom}
   */
  introBoxPosition: string;

  /**
   * @description This key is used to specify whether you need the next button in a step.
   */
  nextButton: boolean;

  /**
   * @description If the provided selector is a class and need to select an element fom the list of elements, element from the given index will be selected.
   */
  selectElementIndex?: number;

  /**
   * @description This key is used to specify whether you need the previous button in a step.
   */
  prevButton?: boolean;

  /**
   * @description This key is used to specify if the selected element needs a padding, if value is 'True' padding of 20px will be applied.
   */
  padding?: boolean;

  /**
   * @description This key is used to specify the type of the padding, [low], if this is not provided normal padding style will apply.
   */
  paddingType?: string;

  /**
   * @description This key is used to add a delay after selecting the element and before positioning the intro-info-box.
   *              In some cases we might need to wait a little to get the right position of the element.
   */
  delay?: number;

  /**
   * @description This key is used to hide the intro-info-box after a step (ie, after next button click, or any action that triggers the next step).
   *              The into-info-box we be visible once the next element is selected.
   */
  closeIntroBoxAfter?: boolean;

  /**
   * @description This key is used to wait for a custom seconds before selecting an element.
   * @example If you need to wait for an element to be plaed int he dom before selecting.
   * @example A component placed in dom after an Api call.
   */
  delayBefore?: number;

  /**
   * @description This key is used to avoid removing the selection from the current step.
   * @example It comes in handy with mat-select-dropdown, we wont be able to find the element from the dom to remvoe the style, because it could be already removed from the dom.
   */
  noSelectionRemoval?: boolean;

  /**
   * @description This key is used to skip the next step.
   */
  skipOnNext?: boolean;

  /**
   * @description This key is used to notify it is the last step.
   */
  isLastStep?: boolean;

  /**
   * @description This key is used to jump to specific index if previous button clicked.
   */
  jumpOnPrev?: number;
  
  /**
   * @description This key is used to know whether there is page(also mentions the page to change) change if previous button clicked.
   */
  pageChangeOnPrev?: string;

  /**
   * @description This key is used to know whether to check form  if previous button clicked.
   */
  checkFormOnPrev?: boolean;
  /**
   * @description This key is used to know whether to check form  if next button clicked.
   */
  checkFormOnNext?: boolean;

  
  
}

export interface IIntroFlow {
  [key: string]: IIntroStep[];
}

export interface IDropdownData {
  title: string;
  subTitle?: string;
}

export interface IIconData {
  [key: string]: {
    icon: IconProp;
    colorVars: {
      text: string;
      bg: string;
    };
  };
}

export interface IIntroFormData {
  payFrom?: string;
  payAs?: string;
  amount?: string;
  selectedBankAccount?: IDropdownData;
  selectedPayee?: IDropdownData;
  checkNo?: string;
  payeeAccNumber?: string;
  invoiceNo?: string;
  issueData?: string;
  category?: string;
  memo?: string;
  payeeBankAc?: IDropdownData;
  payeeEmail?: string;
  selectedCard?: IDropdownData;
  selectedWallet?: IDropdownData;
  selectedCloudBank?: IDropdownData;
}
