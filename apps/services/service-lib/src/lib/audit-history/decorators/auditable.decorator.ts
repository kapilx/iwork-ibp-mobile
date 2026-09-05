import 'reflect-metadata';
import { AUDITABLE_KEY } from '../audit-history.constants';

export function Auditable(options?: { name?: string }) {
  return function (target: Function) {
    Reflect.defineMetadata(AUDITABLE_KEY, true, target);
    if (options?.name) {
      Reflect.defineMetadata('audit-history:entityName', options.name, target);
    }
  };
}

export function isAuditable(entityOrClass: any): boolean {
  if (!entityOrClass) return false;
  const ctor =
    typeof entityOrClass === 'function' ? entityOrClass : entityOrClass.constructor;
  return Reflect.getMetadata(AUDITABLE_KEY, ctor) === true;
}

export function getAuditEntityName(entityOrClass: any): string {
  if (!entityOrClass) return 'Unknown';
  const ctor =
    typeof entityOrClass === 'function' ? entityOrClass : entityOrClass.constructor;
  return Reflect.getMetadata('audit-history:entityName', ctor) || ctor.name || 'Unknown';
}