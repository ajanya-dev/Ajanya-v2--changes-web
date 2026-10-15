import Dexie, { Table } from 'dexie';

export interface TableItem {
  id: number;
  payload: any;
  data: any;
  attachCommentData: any;
}

export interface TableItemV3 {
  id: number;
  payload: any;
  response: any;
  attachCommentData: any;
}

export class AppDB extends Dexie {
  tablePostData: Table<TableItem, number>;
  v3TablesResponses: Table<TableItemV3, number>;

  constructor() {
    super('ngdexieliveQuery');
    this.version(2).stores({
      tablePostData: 'id',
      v3TablesResponses: 'id, payload'
    });
  }

  async resetPostData(): Promise<any> {
    await this.transaction('rw', 'tablePostData', () => {
      this.tablePostData.clear();
    });
    await this.transaction('rw', 'v3TablesResponses', () => {
      this.v3TablesResponses.clear();
    });
  }

  async deleteData(tableName: string, id: number) {
    if (tableName === 'tablePostData') {
      await this.tablePostData.delete(id);
    }
    if (tableName === 'v3TablesResponses') {
      await this.v3TablesResponses.delete(id);
    }
  }

  async deleteDb() {
    await this.delete();
    await this.open();
  }
}

export const db = new AppDB();
