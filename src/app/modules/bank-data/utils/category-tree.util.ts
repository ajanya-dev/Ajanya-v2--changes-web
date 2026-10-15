export interface ICategoryNode {
  id: string;
  name: string;
  parent_category_id: string | null;
  childiren?: ICategoryNode[];
  level?: number; // computed for indentation
}

/**
 * Flattens a parent/child category list into a depth-first ordered list,
 * assigning each item a `level` used for indentation.
 */
export function buildCategoryTree(list: ICategoryNode[]): ICategoryNode[] {
  const byParent = new Map<string | null, ICategoryNode[]>();
  (list || []).forEach((item) => {
    const key = item.parent_category_id ?? null;
    if (!byParent.has(key)) {
      byParent.set(key, []);
    }
    byParent.get(key)?.push(item);
  });

  const ordered: ICategoryNode[] = [];
  const visited = new Set<string>();

  const walk = (parentId: string | null, level: number) => {
    (byParent.get(parentId) || []).forEach((item) => {
      if (visited.has(item.id)) {
        return;
      }
      visited.add(item.id);
      ordered.push({ ...item, level });
      walk(item.id, level + 1);
    });
  };

  walk(null, 0);

  // Append any orphan (parent id not present in the list) so nothing is dropped.
  (list || []).forEach((item) => {
    if (!visited.has(item.id)) {
      visited.add(item.id);
      ordered.push({ ...item, level: 0 });
    }
  });

  return ordered;
}

/**
 * Returns a display name indented for a native <select><option>, where CSS
 * padding does not apply. Uses 4 Unicode non-breaking spaces per nesting level.
 */
export function indentNameByLevel(name: string, level: number): string {
  const indent = '    '.repeat(level || 0);
  return indent + (name || '');
}
