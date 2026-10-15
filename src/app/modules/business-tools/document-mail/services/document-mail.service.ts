import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { IApiRes, IApiResMesssage, IApiResWithMsg } from 'src/app/models/api';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { ICheckMailTrackDetails } from 'src/app/modules/check/model/check';
import {
  IDocumentMailStatements,
  IDocumentMailFromAddress,
  TDocumentMailAddAddress,
  IDocumentMailShippingType,
  IDocumentMailUpload,
  IDocumentMailComments,
  IDocumentMailActivityLog,
  IDocumentMailById,
  IDocumentMailSummary,
  IPdfDocument,
  IDocumentUploadAdditionalData
} from '../models/document-mail.model';

@Injectable({
  providedIn: 'root'
})
export class DocumentMailService {
  private http = inject(HttpClient);

  ROOT_URL = `${environment.rootUrl}/document-mailing`;

  // Temporary storage for file and page selection during multi-step flow
  private tempFile: File | null = null;
  private pdfDocuments: IPdfDocument[] = [];
  private selectedPagesByPdf: Map<number, number[]> = new Map();

  // Storage keys for persistence
  private readonly STORAGE_KEYS = {
    PDF_METADATA: 'document_mail_pdf_metadata',
    SELECTED_PAGES: 'document_mail_selected_pages',
    TEMP_FILE_META: 'document_mail_temp_file_meta'
  };

  // IndexedDB configuration
  private readonly DB_NAME = 'DocumentMailDB';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'pdfFiles';
  private db: IDBDatabase | null = null;

  constructor() {
    this.initIndexedDB();
  }

  /**
   * Initialize IndexedDB for storing File objects
   */
  private initIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        resolve();
        return;
      }

      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME);
        }
      };
    });
  }

  /**
   * Save a File object to IndexedDB
   */
  private async saveFileToIndexedDB(key: string, file: File): Promise<void> {
    if (!this.db) {
      await this.initIndexedDB();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('IndexedDB not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put(file, key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Retrieve a File object from IndexedDB
   */
  private async getFileFromIndexedDB(key: string): Promise<File | null> {
    if (!this.db) {
      await this.initIndexedDB();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('IndexedDB not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete a File object from IndexedDB
   */
  private async deleteFileFromIndexedDB(key: string): Promise<void> {
    if (!this.db) {
      await this.initIndexedDB();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('IndexedDB not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save metadata to sessionStorage
   */
  private saveToSessionStorage(key: string, data: unknown): void {
    try {
      sessionStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      // Ignore error
    }
  }

  /**
   * Retrieve metadata from sessionStorage
   */
  private getFromSessionStorage<T>(key: string): T | null {
    try {
      const data = sessionStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      // Ignore error
      return null;
    }
  }

  /**
   * Restore all data from persistent storage
   */
  async restoreFromStorage(): Promise<boolean> {
    try {
      // Restore temp file if exists
      const tempFileMeta = this.getFromSessionStorage<{ name: string; type: string; size: number; lastModified: number }>(
        this.STORAGE_KEYS.TEMP_FILE_META
      );

      if (tempFileMeta) {
        const file = await this.getFileFromIndexedDB('tempFile');
        if (file) {
          this.tempFile = file;
        }
      }

      // Restore PDF documents
      const pdfMetadata = this.getFromSessionStorage<Array<{
        fileName: string;
        fileType: string;
        fileSize: number;
        startPageNumber: number;
        pageCount: number;
      }>>(this.STORAGE_KEYS.PDF_METADATA);

      if (pdfMetadata && pdfMetadata.length > 0) {
        const restoredDocs: IPdfDocument[] = [];

        // Fix: Do not use 'await' inside a loop; gather promises, then await all at once.
        const files = await Promise.all(
          pdfMetadata.map((_, i) => this.getFileFromIndexedDB(`pdfFile_${i}`))
        );
        for (let i = 0; i < pdfMetadata.length; i += 1) {
          const file = files[i];
          if (file) {
            // Reconstruct IPdfDocument with empty pages array (will be regenerated)
            restoredDocs.push({
              file,
              pages: [],
              startPageNumber: pdfMetadata[i].startPageNumber
            });
          }
        }

        if (restoredDocs.length > 0) {
          this.pdfDocuments = restoredDocs;
        }
      }

      // Restore selected pages
      const selectedPagesData = this.getFromSessionStorage<Array<[number, number[]]>>(
        this.STORAGE_KEYS.SELECTED_PAGES
      );

      if (selectedPagesData) {
        this.selectedPagesByPdf = new Map(selectedPagesData);
      }

      // Return true if any data was restored
      return !!(this.tempFile || this.pdfDocuments.length > 0);
    } catch (error) {
      // Ignore error
      return false;
    }
  }

  setTempFile(file: File): void {
    this.tempFile = file;

    // Save to persistent storage
    this.saveFileToIndexedDB('tempFile', file).catch();

    this.saveToSessionStorage(this.STORAGE_KEYS.TEMP_FILE_META, {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    });
  }

  getTempFile(): File | null {
    return this.tempFile;
  }

  setPdfDocuments(documents: IPdfDocument[], selectedPages: Map<number, number[]>): void {
    this.pdfDocuments = documents;
    this.selectedPagesByPdf = selectedPages;

    // Save to persistent storage
    const pdfMetadata = documents.map(doc => ({
      fileName: doc.file.name,
      fileType: doc.file.type,
      fileSize: doc.file.size,
      startPageNumber: doc.startPageNumber,
      pageCount: doc.pages?.length || 0
    }));

    this.saveToSessionStorage(this.STORAGE_KEYS.PDF_METADATA, pdfMetadata);

    // Save selected pages (convert Map to array for JSON serialization)
    const selectedPagesArray = Array.from(selectedPages.entries());
    this.saveToSessionStorage(this.STORAGE_KEYS.SELECTED_PAGES, selectedPagesArray);

    // Save files to IndexedDB
    documents.forEach((doc, index) => {
      this.saveFileToIndexedDB(`pdfFile_${index}`, doc.file).catch();
    });
  }

  getPdfDocuments(): IPdfDocument[] {
    return this.pdfDocuments;
  }

  getSelectedPagesByPdf(): Map<number, number[]> {
    return this.selectedPagesByPdf;
  }

  /**
   * Creates FormData for multi-PDF upload with selected pages
   * Format:
   * - files[0], files[1], ... for PDF files
   * - selected_pages[0], selected_pages[1], ... for selected pages (comma-separated)
   */
  createMultiPdfFormData(additionalData?: Partial<IDocumentUploadAdditionalData>): FormData {
    const formData = new FormData();

    this.pdfDocuments.forEach((doc, index) => {
      formData.append(`files[${index}]`, doc.file, doc.file.name);

      const selectedPages = this.selectedPagesByPdf.get(index) || [];
      const pagesString = selectedPages.join(',');
      formData.append(`selected_pages[${index}]`, pagesString);
    });

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });
    }

    return formData;
  }

  clearTempData(): void {
    this.tempFile = null;
    this.pdfDocuments = [];
    this.selectedPagesByPdf = new Map();

    // Clear persistent storage
    this.clearAllStorage();
  }

  /**
   * Clear all persistent storage (IndexedDB and sessionStorage)
   */
  private clearAllStorage(): void {
    // Clear sessionStorage
    try {
      sessionStorage.removeItem(this.STORAGE_KEYS.PDF_METADATA);
      sessionStorage.removeItem(this.STORAGE_KEYS.SELECTED_PAGES);
      sessionStorage.removeItem(this.STORAGE_KEYS.TEMP_FILE_META);
    } catch (error) {
      // Ignore error
    }

    // Clear IndexedDB
    this.deleteFileFromIndexedDB('tempFile').catch();

    // Delete all PDF files from IndexedDB
    for (let i = 0; i < 20; i += 1) {
      this.deleteFileFromIndexedDB(`pdfFile_${i}`).catch(() => {
        // Ignore errors for non-existent files
      });
    }
  }

  /**
   * Uploads a document using the provided FormData.
   *
   * @param data - FormData containing the document to be uploaded.
   * @returns Observable of the API response for document upload.
   */
  uploadDocument(data: FormData) {
    return this.http.post<IApiRes<IDocumentMailUpload>>(
      `${this.ROOT_URL}/doc/upload_file`,
      data
    );
  }

  /**
   * Retrieves all available from addresses.
   *
   * @returns {Observable<IApiRes<IDocumentMailFromAddress[]>>} Observable of the API response containing an array of from addresses.
   */
  getAllFromAddress(): Observable<IApiRes<IDocumentMailFromAddress[]>> {
    return this.http.get<IApiRes<IDocumentMailFromAddress[]>>(
      `${this.ROOT_URL}/reply_to/getall`
    );
  }

  /**
   * Retrieves a specific from address by ID.
   *
   * @param {string} id - ID of the from address to retrieve.
   * @returns {Observable<IApiRes<[IDocumentMailFromAddress]>>} Observable of the API response containing the requested from address.
   */
  getOneFromAddress(
    id: string
  ): Observable<IApiRes<[IDocumentMailFromAddress]>> {
    return this.http.get<IApiRes<[IDocumentMailFromAddress]>>(
      `${this.ROOT_URL}/reply_to/${id}`
    );
  }

  /**
   * Deletes a from address by ID.
   *
   * @param {string} id - ID of the from address to delete.
   * @returns {Observable<any>} Observable of the API response for the deletion operation.
   */
  deleteFromAddress(id: string): Observable<unknown> {
    return this.http.delete(`${this.ROOT_URL}/reply_to/${id}`);
  }

  /**
   * Retrieves the statement for a document by ID.
   *
   * @param {string} id - ID of the document for which to retrieve the statement.
   * @returns {Observable<IDocumentMailStatements>} Observable of the API response containing the document statement.
   */
  getStatement(id: string): Observable<IDocumentMailStatements> {
    return this.http.get<IDocumentMailStatements>(
      `${this.ROOT_URL}/statements/${id}`
    );
  }

  /**
   * Retrieves all available shipping types.
   *
   * @returns {Observable<IDocumentMailShippingType[]>} Observable of the API response containing an array of shipping types.
   */
  getShippingType(): Observable<IDocumentMailShippingType[]> {
    return this.http.get<IDocumentMailShippingType[]>(
      `${this.ROOT_URL}/get_shipping_type`
    );
  }

  /**
   * Deletes a document by ID.
   *
   * @param {string} id - ID of the document to delete.
   * @returns {Observable<IApiResMesssage>} Observable of the API response for the deletion operation.
   */
  deleteDocument(id: string): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/doc/delete/${id}`,
      {}
    );
  }

  editDocument(id: string, formData: FormData): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/doc/edit/${id}`,
      formData
    );
  }

  /**
   * Downloads a document by ID.
   *
   * @param {string} id - ID of the document to download.
   * @returns {Observable<IApiRes<{ file_url: string }>>} Observable of the API response containing the file URL for download.
   */
  downloadDocument(id: string): Observable<IApiRes<{ file_url: string }>> {
    return this.http.get<IApiRes<{ file_url: string }>>(
      `${this.ROOT_URL}/doc/download_file/${id}`
    );
  }

  /**
   * Sends mail for the specified document IDs.
   *
   * @param {unknown[]} data - Array of document IDs for which to send mail.
   * @returns {Observable<IApiRes<{ ids: string }>>} Observable of the API response containing the sent mail information.
   */
  sendMail(data: unknown[]): Observable<IApiRes<{ ids: string }>> {
    return this.http.post<IApiRes<{ ids: string }>>(
      `${this.ROOT_URL}/send_mail_new`,
      data
    );
  }

  /**
   * Api call for invoice mail.
   */
  invoiceMail(data: { id: string; shipping_type: string }[]) {
    return this.http.post<{ success: boolean }>(
      `${environment.rootUrl}/invoices/bulk-mail`,
      data
    );
  }


  /** 
   * Deletes multiple documents by their IDs.
   *
   * @param {string[]} ids - Array of document IDs to delete.
   * @returns {Observable<IApiResMesssage>} Observable of the API response for the deletion operation.
   */
  deleteMultipleDocuments(ids: string[]) {  
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/doc/delete`,
      { ids }
    );
  }

  /**
   * Adds a new from address using the provided data.
   *
   * @param {TDocumentMailAddAddress} data - Data for adding a new from address.
   * @returns {Observable<IApiResMesssage & { payee_name: string; id: string }>} Observable of the API response for adding a new from address.
   */
  addFromAddress(
    data: TDocumentMailAddAddress
  ): Observable<IApiResWithMsg<{ payee_name: string; id: string }>> {
    return this.http.post<IApiResWithMsg<{ payee_name: string; id: string }>>(
      `${this.ROOT_URL}/reply_to/store1`,
      data
    );
  }

  /**
   * @description Get tracking details of selected document.
   * @param {string} id - ID of the document.
   * @returns {Observable<IApiRes<ICheckMailTrackDetails>>} Observable of the API response containing the mail track details.
   */
  getMailTrack(id: string): Observable<IApiRes<ICheckMailTrackDetails>> {
    return this.http.get<IApiRes<ICheckMailTrackDetails>>(
      `${this.ROOT_URL}/tracking/${id}`
    );
  }

  /**
   * Get comments for a document by ID.
   *
   * @param {string} id - ID of the document.
   * @returns {Observable<IApiRes<IDocumentMailComments[]>>} Observable of the API response containing the comments.
   */
  getComments(id: string): Observable<IApiRes<IDocumentMailComments[]>> {
    return this.http.get<IApiRes<IDocumentMailComments[]>>(
      `${this.ROOT_URL}/${id}/comments`
    );
  }

  /**
   * Get activity logs for a document by ID.
   *
   * @param {string} id - ID of the document.
   * @returns {Observable<IApiRes<IDocumentMailActivityLog[]>>} Observable of the API response containing the activity logs.
   */
  getDocumentMailActivityLogs(id: string): Observable<IApiRes<IDocumentMailActivityLog[]>> {
    return this.http.get<IApiRes<IDocumentMailActivityLog[]>>(
      `${this.ROOT_URL}/${id}/activities`
    );
  }


  getDocumentMailById(id: string): Observable<IApiRes<IDocumentMailById>> {
    return this.http.get<IApiRes<IDocumentMailById>>(
      `${this.ROOT_URL}/doc/details/${id}`
    );
  }

  getMailingSummary(): Observable<IApiRes<IDocumentMailSummary>> {
    return this.http.get<IApiRes<IDocumentMailSummary>>(
      `${this.ROOT_URL}/doc/statistics`
    );
  }

}
