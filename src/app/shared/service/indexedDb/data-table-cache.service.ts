import { Injectable } from '@angular/core';
import { db } from '../../../../db/db';
import {
  ICoulmnDefFieldsResponse,
  IDefaultPayload
} from 'src/app/models/v3-datatable';
import { Utils } from 'src/app/data/utils';

/**
 * Master switch for painting data-table rows from the IndexedDB cache while the
 * live request is in flight, plus a per-table opt-out for any table that turns
 * out to misbehave. Set the flag to false to disable caching app-wide.
 */
export const DATA_TABLE_CACHE_ENABLED = true;
export const CACHE_DISABLED_TABLE_IDS: ReadonlySet<number> = new Set<number>([]);

@Injectable({
  providedIn: 'root'
})
export class DataTableCacheService {
  // Set to false while routing to datatable without showing cache data
  firstLoadFromCache = true;
  utils = Utils;

  async addRowData(tableId: number, payload: any, data: any): Promise<any> {
    try {
      await db.tablePostData.add({
        id: tableId,
        payload,
        data,
        attachCommentData: null
      });
    } catch (error: any) {
      // ON duplicate update row
      if (error?.name === 'ConstraintError') {
        await db.tablePostData.update(tableId, { payload, data });
      }
    }
  }

  async updateAttachmentComment(tableId: number, data: any): Promise<any> {
    await db.tablePostData.update(tableId, { attachCommentData: data });
  }

  async getDataById(tableId: number): Promise<any> {
    try {
      return await db.tablePostData.where('id').equals(tableId).toArray();
    } catch (error: any) {
      return [];
    }
  }

  resetTablePostData(): any {
    db.resetPostData();
  }

  deleteV2Data(tableId: number) {
    db.deleteData('tablePostData', tableId);
  }

  async deleteV3Data(tableId: number) {
    await db.deleteData('v3TablesResponses', tableId);
  }

  deleteDb() {
    db.deleteDb();
  }

  //V3Tables

  async getCachedRowDataV3(
    tableId: number,
    payload: IDefaultPayload
  ): Promise<any> {
    if (!DATA_TABLE_CACHE_ENABLED || CACHE_DISABLED_TABLE_IDS.has(tableId)) {
      return false;
    }
    try {
      const result = await db.v3TablesResponses.get({
        id: tableId
      });
      if (result && this.utils.areObjectsEqual(result.payload, payload)) {
        return result;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  async addRowDataV3(
    tableId: number,
    payload: any,
    response: ICoulmnDefFieldsResponse<any>
  ): Promise<any> {
    try {
      await db.v3TablesResponses.add({
        id: tableId,
        payload,
        response,
        attachCommentData: null
      });
    } catch (error: any) {
      if (error?.name === 'ConstraintError') {
        await db.v3TablesResponses.update(tableId, { payload, response });
      }
    }
  }
}
