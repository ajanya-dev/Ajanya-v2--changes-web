import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { TCButtonType } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';

export interface IV3DtHeaderElements {
  headerText?: string;
  panelButtons?: {
    name: string;
    id: string;
    options?: { isItButton: boolean };
    lucideIcon?: string;
  }[];
  selectedPanelButton?: string;
  buttons?: IV3CommonButton[];
  topRightButtons?: IV3CommonButton[];
  titleButtons?: IV3CommonButton[];
  pendingItems?: {
    id: string;
    itemName: string;
    pendingCount: number;
  };
  /**
   * Slug for help video button.
   * src/app/shared/components/demo-video/readme.txt
   */
  videoButton?: { slug: string }[];
}

export interface IV3CommonButton {
  id?: string;
  text?: string;
  type?: TCButtonType;
  width?: string;
  minWidth?: string;
  textColorInput?: string;
  disableHoverEffect?: boolean;
  loading?: boolean;
  disabled?: boolean;
  suffix?: boolean;
  suffixIcon?: IconProp;
  backGroundInput?: string;
  isAddIcon?: boolean;
  icon?: IconProp;
  toolTip?: string;
  boxshadow?: string;
  menu?: {
    id: string;
    name: string;
    icon?: IconProp;
    lucideIcon?: string;
    toolTip?: string;
  }[];
  roundIcon?: IconProp;
  customClasses?: string;
  isHidden?: boolean;
  toolTipClass?: string;
  lucideIcon?: string;
  /** Floating action bar cluster; equal values render together, ascending, divider between. */
  barGroup?: number;
  floatingBarVariant?:
    | 'primary'
    | 'filled-primary'
    | 'filled-success'
    | 'outline-success'
    | 'outline-navy'
    | 'outline-warning'
    | 'outline-primary'
    | 'outline-violet'
    | 'outline-danger'
    | 'filled-danger'
    | 'outline-default'
    | 'success-soft'
    | 'danger-soft';
}

export interface ICashExpenseExport {
  bankAccountId: string;
  fromDate: string | Date;
  toDate: string | Date;
  type: 'csv' | 'xlsx';
}
