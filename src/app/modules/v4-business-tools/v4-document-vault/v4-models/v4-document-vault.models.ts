export interface IDocumentVaultResponse {
  success: boolean;
  items: IDocumentVaultItems;
  breadcrumbs: IBreadcrumb[];
  storage: IStorageInfo;
}
export interface IDocumentVaultItems {
  current_page: number;
  data: IDocumentVaultItem[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: IPaginationLink[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export interface IPaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

export interface IBreadcrumb {
  id: number;
  name: string;
}

export interface IStorageInfo {
  used: number;
  used_formatted: string;
  remaining: number;
  remaining_formatted: string;
  max: number;
  max_formatted: string;
  percentage: number;
  file_count: number;
  root_folders: number;
  max_folder_depth: number;
}

export interface IDocumentVaultItem {
  id: number;
  parent_id: number | null;
  name: string;
  serial_number: string | null;
  type: 'folder' | 'file';
  file_path: string | null;
  file_size: number | null;
  file_type: string | null;
  created_for_id: number;
  created_by_id: number;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  deleted_at: string | null;
  encrypted_id: string;
  file_size_formatted: string | null;
  memo_note: string | null;
}

export interface IDocumentVaultUpload {
  id: string;
  message: string;
  name: string;
  file_name: string;
  file_serial_number: string;
  file_url: string;
  size_bytes: number;
  file_extension: string;
  mime_type: string;
}

export interface IDocumentVaultCreateFolder {
  name: string;
  type: 'folder' | 'file';
  parent_id?: number;
}

export interface IDocumentVaultUploadFile {
  name: string;
  file_serial_number: string;
  parent_folder_id?: string;
  tags?: string[];
}

export interface IDocumentVaultShareItem {
  folder_id?: string;
  file_id?: string;
  email: string;
  expires_days: number;
  max_downloads: number;
}

export interface IDocumentVaultRenameItem {
  name: string;
  type: 'folder' | 'file';
  serial_number?: string;
}

export interface IDocumentVaultMoveItem {
  new_parent_id: string;
}

export interface IDocumentVaultSearchRequest {
  folder_id?: string;
  page?: number;
  limit?: number;
}

export interface IApiDocumentVaultResponse<Type> {
  readonly success: boolean;
  readonly items: Type;
  readonly breadcrumbs: IBreadcrumb[];
  readonly storage: IStorageInfo;
}

export interface IDocumentVaultSetPermissions {
  userId: string;
  actions: string[];
}

export interface IDocumentVaultUserPermission {
  userId: string;
  userName: string;
  userEmail: string;
  actions: string[];
  selectedPermissions: IDocumentVaultSelectedPermissions;
}

export interface IDocumentVaultSelectedPermissions {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

export interface IShareCollectData {
  share_token: string;
  folder_name: string;
  company_name: string;
  logo_url: string | null;
  message: string | null;
  pin_enabled: boolean;
  max_uploads: number;
  current_uploads: number;
}

export interface IShareCollectDataResponse {
  company_name: string;
  message?: string;
  logo?: string;
  pin_protection: boolean;
  upload_limit: boolean;
  max_files?: number;
  link_expiry: boolean;
  expiry_date?: string;
  is_expired: boolean;
  is_limit_reached: boolean;
}

export interface IShareLinkPayload {
  share_token: string;
  email?: string;
  phone?: string;
  type: 1 | 2; // 1 = email, 2 = sms
}

export interface IDownloadLinkResponse {
  share_link: string;
  share_token: string;
  expires_at: string;
}

export interface IDownloadPageData {
  share_token: string;
  target_name: string;
  target_type: string;
  company_name: string;
  logo_url: string | null;
  message: string;
  pin_enabled: boolean;
  max_downloads: number;
  current_downloads: number;
  expires_at: string;
  items: IDownloadItem[];
}

export interface IDownloadItem {
  id: number;
  name: string;
  type: 'file' | 'folder';
  parent_id: number | null;
  file_size?: number;
  file_type?: string;
  s3_url?: string;
}
