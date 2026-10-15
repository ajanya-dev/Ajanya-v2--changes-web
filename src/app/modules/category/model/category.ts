export interface ICategoriesState {
  categories: ICategoryDropdown[];
  pageNo: number;
  isFilterOn: boolean;
  searchTerm: string;
  searchIds: string[];
  categoriesFiltered: ICategoryDropdown[];
  filteredPageNo: number;
  isLoading: boolean;
  isCategoriesByIdsLoading: boolean;
  isError: boolean;
}
export interface ICategoryDropdown {
  id: string;
  name: string;
  type: number;
  status?: string;
  success?: boolean;
}

export interface ICategoryDetails {
  categoryName: string;
  categoryType: number;
  categoryStatus?: number;
}

export interface ICategoryRowData {
  id: string;
  catagory_name: string;
  catagory_type: number;
  category_status: number;
}
