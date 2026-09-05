import 'reflect-metadata';
import { SKIP_AUDIT_KEY } from '../audit-history.constants';

export function SkipAudit() {
  return function (target: any, propertyKey: string) {
    const existingSkipFields =
      Reflect.getMetadata(SKIP_AUDIT_KEY, target.constructor) || [];
    Reflect.defineMetadata(
      SKIP_AUDIT_KEY,
      [...existingSkipFields, propertyKey],
      target.constructor,
    );
  };
}

export function getSkipAuditFields(entityOrClass: any): string[] {
  if (!entityOrClass) return [];
  const ctor =
    typeof entityOrClass === 'function' ? entityOrClass : entityOrClass.constructor;
  return Reflect.getMetadata(SKIP_AUDIT_KEY, ctor) || [];
}