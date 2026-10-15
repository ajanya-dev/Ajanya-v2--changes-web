import { Params } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export class DataTableUtils {
  //  ============> EXPORT FUNCTIONS ============> //

  public static makeJspdf(
    option: 'print' | 'download',
    tableData: any,
    heading: string,
    name: string
  ) {
    const { header, rowsArr } = tableData;

    const doc = new jsPDF('landscape');
    // var width = doc.internal.pageSize.getWidth(); // =============> page height and width
    // var height = doc.internal.pageSize.getHeight();
    const title = heading || name;
    if (title) {
      doc.text(title, 7, 7);
    }

    const indexOfMemoColumn = header.indexOf('Memo');
    let memoExist = false;
    if (indexOfMemoColumn) {
      rowsArr.forEach((data: Params) => {
        if (data[indexOfMemoColumn] && data[indexOfMemoColumn].length >= 40) {
          memoExist = true;
        }
      });
    }

    autoTable(doc, {
      head: [header],
      body: rowsArr,
      theme: 'striped',
      tableWidth: 'auto',
      styles: {
        fontSize: 9,
        cellWidth: 'auto',
        minCellWidth: 20,
        overflow: 'linebreak',
        halign: 'left'
      },
      columnStyles: memoExist ? { [indexOfMemoColumn]: { cellWidth: 70 } } : {},
      margin: {
        left: 1,
        right: 1
      }
    });
    if (option === 'print') {
      const string = doc.output('datauristring');
      const iframe =
        "<iframe width='100%' height='100%' src='" + string + "'></iframe>";
      const x: any = window.open();
      x.document.open();
      x.document.write(iframe);
      x.document.close();
    } else if (option === 'download') {
      doc.save(`${name || heading || 'table'}.pdf`);
    }
  }

  public static getExportEmailHtml(header: any[], rowsArr: any[]): string {
    let headerTh = '';
    let rowsTrTd = '';
    header.forEach((e) => (headerTh += `<th  style="padding:8px;">${e}</th>`));
    rowsArr.forEach((e) => {
      rowsTrTd += '<tr>';
      e.forEach((val: any) => {
        rowsTrTd += `<td style="padding:8px;">${val ? val : ''}</td>`;
      });
      rowsTrTd += '</tr>';
    });

    const html = `
      <table>
        <thead>
          <tr>
          ${headerTh}
          </tr>
        </thead>
        <tbody>
          ${rowsTrTd}
        </tbody>
      </table>`;

    return html;
  }
}
