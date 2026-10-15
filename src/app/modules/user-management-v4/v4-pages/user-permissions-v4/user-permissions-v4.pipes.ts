/* eslint-disable no-restricted-syntax */
import { Pipe, PipeTransform } from '@angular/core';
import { IUserPermissionList } from 'src/app/models/user';

export interface ModuleMeta {
  icon: string;
  tileBg: string;
  iconColor: string;
}

const FALLBACK_META: ModuleMeta = {
  icon: 'box',
  tileBg: 'bg-v4-badge-neutral-bg-color',
  iconColor: 'text-v4-badge-neutral-text-color'
};

@Pipe({ name: 'moduleMeta', standalone: true, pure: true })
export class ModuleMetaPipe implements PipeTransform {
  transform(displayName: string, map: Record<string, ModuleMeta>): ModuleMeta {
    return map?.[displayName] ?? FALLBACK_META;
  }
}

@Pipe({ name: 'permEnabledCount', standalone: true, pure: true })
export class PermEnabledCountPipe implements PipeTransform {
  transform(
    item: IUserPermissionList,
    userPermissions: Record<string, boolean>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _version: number
  ): { enabled: number; total: number } {
    if (!item?.permissions) return { enabled: 0, total: 0 };
    const lists = [
      item.permissions.ap,
      item.permissions.normal,
      item.permissions.sp
    ];
    let total = 0;
    let enabled = 0;
    for (const list of lists) {
      if (!list) break;
      total += list.length;
      for (const p of list) {
        if (userPermissions?.[p.name]) enabled += 1;
      }
    }
    return { enabled, total };
  }
}
