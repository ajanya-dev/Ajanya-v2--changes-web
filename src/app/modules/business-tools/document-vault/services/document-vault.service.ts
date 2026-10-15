import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { IApiRes, IApiResSuccessOnly, IApiResWithMsg, IApiResMesssage } from 'src/app/models/api';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import {
  IDocumentVaultCreateFolder,
  IDocumentVaultShareItem,
  IDocumentVaultRenameItem,
  IDocumentVaultMoveItem,
  IDocumentVaultSearchRequest,
  IDocumentVaultUpload,
  IDocumentVaultItem,
  IDocumentVaultItems,
  IApiDocumentVaultResponse,
  IDocumentVaultSetPermissions,
  IDocumentVaultUserPermission,
  IShareCollectDataResponse,
  IShareLinkPayload,
  IDownloadLinkResponse,
} from '../models/document-vault.models';

@Injectable({
  providedIn: 'root'
})
export class DocumentVaultService {
  private http = inject(HttpClient);

  ROOT_URL = `${environment.rootUrl}/document-vault`;

  /**
   * Uploads a document using the provided FormData.
   *
   * @param data - FormData containing the document to be uploaded.
   * @returns Observable of the API response for document upload.
   */
  uploadDocument(data: FormData): Observable<IApiResWithMsg<IDocumentVaultUpload>> {
    return this.http.post<IApiResWithMsg<IDocumentVaultUpload>>(
      `${this.ROOT_URL}`,
      data
    );
  }

  /**
   * Creates a new folder.
   *
   * @param data - Data for creating a new folder.
   * @returns Observable of the API response for folder creation.
   */
  createFolder(id: number, data: IDocumentVaultCreateFolder): Observable<IApiDocumentVaultResponse<IDocumentVaultCreateFolder>> {
    return this.http.post<IApiDocumentVaultResponse<IDocumentVaultCreateFolder>>(
      `${this.ROOT_URL}?folder_id=${id}`,
      data
    );
  }

  /**
   * Retrieves all documents and folders based on search criteria.
   *
   * @param params - Search and filter parameters including pagination.
   * @returns Observable of the API response containing documents and folders.
   */
  getDocuments(params: IDocumentVaultSearchRequest = {}): Observable<IApiDocumentVaultResponse<IDocumentVaultItems>> {
    return this.http.get<IApiDocumentVaultResponse<IDocumentVaultItems>>(
      `${this.ROOT_URL}`,
      { params: params as HttpParams }
    );
  }

  /**
   * Deletes a document or folder by ID.
   *
   * @param id - ID of the item to delete.
   * @returns Observable of the API response for the deletion operation.
   */
  deleteItem(id: string): Observable<IApiResSuccessOnly> {
    return this.http.delete<IApiResSuccessOnly>(
      `${this.ROOT_URL}/${id}`
    );
  }

  /**
   * Renames a document or folder.
   *
   * @param id - ID of the item to rename.
   * @param data - New name and item type.
   * @returns Observable of the API response for the rename operation.
   */
  renameItem(id: string, data: IDocumentVaultRenameItem): Observable<IApiResWithMsg<string>> {
    return this.http.put<IApiResWithMsg<string>>(
      `${this.ROOT_URL}/${id}`,
      data
    );
  }

  /**
   * Moves items to a different folder.
   *
   * @param data - Move operation data including item IDs and destination.
   * @returns Observable of the API response for the move operation.
   */
  moveItems(id: string, data: IDocumentVaultMoveItem): Observable<IApiRes<IDocumentVaultItem>> {
    return this.http.post<IApiRes<IDocumentVaultItem>>(
      `${this.ROOT_URL}/${id}/move`,
      data
    );
  }

  /**
   * Downloads a document by ID.
   *
   * @param id - ID of the document to download.
   * @returns Observable of the API response containing the file URL for download.
   */
  downloadDocument(id: string): Observable<{success: boolean, url: string }> {
    return this.http.get<{success: boolean, url: string }>(
      `${this.ROOT_URL}/${id}/download`
    );
  }

  /**
   * Shares a file with specified email.
   *
   * @param data - Share configuration including email, expiry, and max downloads.
   * @returns Observable of the API response for the share operation.
   */
  shareItem(data: IDocumentVaultShareItem): Observable<IApiRes<IDocumentVaultShareItem>> {
    return this.http.post<IApiRes<IDocumentVaultShareItem>>(
      `${this.ROOT_URL}/share/email`,
      data
    );
  }

  /**
   * Creates a shareable link for collecting files to a specific folder with optional logo.
   *
   * @param data - FormData containing folder_id, company name, message, settings, and logo file.
   * @returns Observable of the API response containing the shareable link.
   */
  createShareCollectLink(data: FormData): Observable<IApiRes<{ share_link: string , share_token: string, expires_at: string }>> {
    return this.http.post<IApiRes<{ share_link: string , share_token: string, expires_at: string }>>(
      `${this.ROOT_URL}/folder-upload-link`,
      data
    );
  }

  /**
   * Creates a shareable link for collecting files to the entire vault with optional logo.
   *
   * @param data - FormData containing company name, message, settings, and logo file.
   * @returns Observable of the API response containing the shareable link.
   */
  createVaultUploadLink(data: FormData): Observable<IApiRes<{ share_link: string , share_token: string, expires_at: string }>> {
    return this.http.post<IApiRes<{ share_link: string , share_token: string, expires_at: string }>>(
      `${this.ROOT_URL}/vault-upload-link`,
      data
    );
  }

  /**
   * Gets share/collect page data using token.
   *
   * @param token - The token from the URL to retrieve page configuration.
   * @returns Observable of the API response containing page data.
   */
  getShareCollectData(token: string): Observable<IApiRes<IShareCollectDataResponse>> {
    return this.http.get<IApiRes<IShareCollectDataResponse>>(
      `${this.ROOT_URL}/outside/document-vault-upload/${token}`
    );
  }

  /**
   * Submits files to a share/collect link.
   *
   * @param token - The token from the URL.
   * @param data - FormData containing files and optional comment and PIN.
   * @returns Observable of the API response for the file submission.
   */
  submitShareCollectFiles(token: string, data: FormData): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/outside/document-vault-upload/${token}`,
      data
    );
  }

  /**
   * Sends share link via email or SMS.
   *
   * @param shareToken - The share token identifier.
   * @param data - Object containing recipient (email/phone) and type (1=email, 2=sms).
   * @returns Observable of the API response.
   */
  sendShareLink(shareToken: string, data: IShareLinkPayload): Observable<IApiResWithMsg<Record<string, never>>> {
    return this.http.post<IApiResWithMsg<Record<string, never>>>(
      `${this.ROOT_URL}/folder-upload-link/share`,
      data
    );
  }

  /**
   * Generates a download link for a folder or file.
   *
   * @param data - FormData containing folder/file info, company details, settings, and optional logo.
   * @returns Observable of the API response containing the download link.
   */
  generateDownloadLink(data: FormData): Observable<IApiRes<IDownloadLinkResponse>> {
    return this.http.post<IApiRes<IDownloadLinkResponse>>(
      `${this.ROOT_URL}/download-link`,
      data
    );
  }

  /**
   * Generates a download link for the entire vault.
   *
   * @param data - FormData containing company details, settings, and optional logo.
   * @returns Observable of the API response containing the download link.
   */
  generateVaultDownloadLink(data: FormData): Observable<IApiRes<IDownloadLinkResponse>> {
    return this.http.post<IApiRes<IDownloadLinkResponse>>(
      `${this.ROOT_URL}/vault-download-link`,
      data
    );
  }

  /**
   * Sends download link via email or SMS.
   *
   * @param shareToken - The share token identifier.
   * @param data - Object containing recipient (email/phone) and type (1=email, 2=sms).
   * @returns Observable of the API response.
   */
  sendDownloadLink(shareToken: string, data: IShareLinkPayload): Observable<IApiResWithMsg<Record<string, never>>> {
    return this.http.post<IApiResWithMsg<Record<string, never>>>(
      `${this.ROOT_URL}/download-link/share`,
      data
    );
  }

  setPermissions(folderId: string, data: IDocumentVaultSetPermissions[]): Observable<IApiRes<IDocumentVaultSetPermissions[]>> {
    return this.http.post<IApiRes<IDocumentVaultSetPermissions[]>>(
      `${this.ROOT_URL}/${folderId}/permissions`,
      {permissions: data}
    );
  }

  getPermissions(folderId: string): Observable<IApiRes<IDocumentVaultUserPermission[]>> {
    return this.http.get<IApiRes<IDocumentVaultUserPermission[]>>(
      `${this.ROOT_URL}/${folderId}/permissions`
    );
  }

  /**
   * Updates the memo note for a file.
   *
   * @param encryptedFileId - Encrypted ID of the file.
   * @param memoNote - The memo note to set.
   * @returns Observable of the API response.
   */
  updateMemoNote(encryptedFileId: string, memoNote: string): Observable<IApiResWithMsg<Record<string, never>>> {
    return this.http.patch<IApiResWithMsg<Record<string, never>>>(
      `${this.ROOT_URL}/${encryptedFileId}/memo-note`,
      { memo_note: memoNote }
    );
  }

}