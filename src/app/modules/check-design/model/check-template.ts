export interface IPremadeCheckTemplates {
  all_designs: IAllTemplates[];
  category_designs: IPreMadeTemplates[];
}
export interface IPreMadeTemplates {
  category_name: string;
  items: [
    {
      id: string;
      design_name: string;
      s3_image_link: string;
      premium?: boolean;
      price?: string;
    }
  ];
}
export interface IAllTemplates {
  id: string;
  design_name: string;
  s3_image_link: string;
  premium?: boolean;
  price?: string;
}
