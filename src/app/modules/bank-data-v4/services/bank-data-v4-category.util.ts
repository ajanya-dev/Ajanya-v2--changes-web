export interface IV4CategoryNode {
  id: string;
  name: string;
  parent_category_id?: string | null;
  childiren?: IV4CategoryNode[];
  yd_category_id?: number | null;
  level?: number; // computed for indentation
}

/**
 * Flattens a parent/child category list (new API format, hierarchy expressed via
 * `parent_category_id`) into a depth-first ordered list, adding a `level` to each
 * item for indentation. Generic so callers keep their extra fields.
 */
export function buildCategoryTree<
  T extends { id: string; parent_category_id?: string | null }
>(list: T[]): Array<T & { level: number }> {
  const byParent = new Map<string | null, T[]>();
  (list || []).forEach((item) => {
    const key = item.parent_category_id ?? null;
    if (!byParent.has(key)) {
      byParent.set(key, []);
    }
    byParent.get(key)?.push(item);
  });

  const ordered: Array<T & { level: number }> = [];
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
 * Returns a display name indented by nesting level for select/option text, where
 * CSS padding does not apply. Uses 4 Unicode non-breaking spaces per level.
 */
export function indentNameByLevel(name: string, level: number): string {
  const indent = '    '.repeat(level || 0);
  return indent + (name || '');
}
