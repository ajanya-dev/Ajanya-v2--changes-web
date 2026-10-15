export interface ICheckDesignData {
  bankAccountId: string;
  templateLogo: string;
  templateSignature: string;
  qrCodeToken: string;
  bankAccountAddress: string;
  bankAccountNumber: string;
  bankAccountPhone: string;
  bankAccountRouting: string;
  bankAccountIsVerified: boolean;
  bankName: string;
  bankAccountName: string;
  checkSerialNumber: number;
  fractionalNo: string;
  template: number;
  templateOptions: {
    name: string;
    id: number;
  }[];
  checkDesign: string | ICheckDesign;
  transitNo: null | string;
  financialInstitutionNo: null | string;
}

export interface ICheckDesign {
  version: string;
  objects: ICheckDesignObjects[];
  background: string;
  backgroundImage?: Partial<ICheckDesignBackgroundImage>;
}

export interface ICheckDesignBackgroundImage {
  type: string;
  version: string;
  originX: string;
  originY: string;
  left: number;
  top: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeDashArray: Array<unknown>;
  strokeLineCap: string;
  strokeDashOffset: number;
  strokeLineJoin: string;
  strokeUniform: boolean;
  strokeMiterLimit: number;
  scaleX: number;
  scaleY: number;
  angle: number;
  flipX: boolean;
  flipY: boolean;
  opacity: number;
  visible: boolean;
  backgroundColor: string;
  fillRule: string;
  paintFirst: string;
  globalCompositeOperation: string;
  skewX: number;
  skewY: number;
  cropX: number;
  cropY: number;
  cornerStyle: string;
  transparentCorners: boolean;
  cornerColor: string;
  borderColor: string;
  cornerSize: number;
  padding: number;
  borderDashArray: Array<number>;
  rotatingPointOffset: number;
  hasBorders: boolean;
  hasControls: boolean;
  selectable: boolean;
  evented: boolean;
  lockRotation: boolean;
  hasRotatingPoint: boolean;
  lockMovementX: boolean;
  lockMovementY: boolean;
  src: string;
  crossOrigin: string;
  filters: Array<unknown>;
}

export interface ICheckDesignObjects extends fabric.Object {
  text: string;
  id: string;
  fontWeight: string;
  fontStyle: string;
  src: string;
  fontFamily: string;
  fontSize: number;
  setSelectionStyles: (value: Record<string, unknown>) => void | unknown;
  isEditing: boolean;
  underline: boolean;
  textAlign: string;
  styles?: IStyleList[];
}

export interface IStyleList {
  start: number;
  end: number;
  style: IStyle;
}

export interface IStyle {
  fontStyle: string;
  fontFamily: string;
  fontWeight: string;
  fill: string;
}

export interface IImageCategories {
  id: number;
  imageType: number;
  name: string;
}

export interface IObjectOptions extends fabric.IObjectOptions {
  ctype?: string;
  id?: string;
  fontSize?: number;
  fontFamily?: string;
  radius?: number;
}
