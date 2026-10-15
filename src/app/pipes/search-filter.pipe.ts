import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'searchFilter',
  standalone: true
})
export class SearchFilterPipe implements PipeTransform {
  /**
   * @description A custom Angular pipe designed to filter an array
   * of data based on a provided search term and an optional specific attribute.
   * When applied to an array, it returns a new array containing only the elements that match the search term.
   * If a filter attribute is provided, the pipe searches for matches within that specific attribute
   * of each object in the array. If no filter attribute is provided, the pipe searches for
   * matches in all attributes of each object. The search is case-insensitive.
   *
   * @usage
   * ```
   * <div *ngFor="let item of items | searchFilter: searchInput: 'filterAttribute'">
      {{ item }}
     </div>
   * ```
   * @param value The data you want to filter (usually an array of objects)
   * @param searchTerm The string you want to search for within the data
   * @param filterAttribute The specific attribute or column in the data you want to search
   * @returns returns a filtered version of the input data
   */
  transform(value: any, searchTerm?: string, filterAttribute?: string): any {
    if (!value) return null;
    if (!searchTerm) return value;

    searchTerm = searchTerm.toLowerCase();

    return value.filter((data: any) => {
      if (filterAttribute) {
        // Filter by specific attribute if it exists
        return (
          data[filterAttribute] &&
          data[filterAttribute].toLowerCase().includes(searchTerm)
        );
      } else {
        // Filter by all attributes if no specific attribute is provided
        if (searchTerm) {
          return JSON.stringify(data).toLowerCase().includes(searchTerm);
        } else {
          return JSON.stringify(data).toLowerCase();
        }
      }
    });
  }
}
