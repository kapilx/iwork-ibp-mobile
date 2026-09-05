import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MASKING_TABLE_KEY } from '../decorators/apply-masking.decorator';
import { SKIP_MASKING_KEY } from '../decorators/skip-masking.decorator';
import { MASKING_REGISTRY, RevealAsConditional, RevealAsTarget } from '../constants/masking-registry.constants';
import { MaskingConfig, MaskingPattern } from '../constants/masking-patterns.constants';
import { maskValue } from '../utils/masking.util';
import { AclService } from '../../acl.service';
import { UserRole } from '../../entities/user-role.entity';

@Injectable()
export class ResponseMaskingInterceptor implements NestInterceptor {
  private readonly isMaskingEnabled =
    process.env.FF_FIELD_MASKING_EXPERIMENTAL === 'true';

  constructor(
    private readonly reflector: Reflector,
    private readonly aclService: AclService,
    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    if (!this.isMaskingEnabled) return next.handle();

    const tableName = this.reflector.getAllAndOverride<string>(MASKING_TABLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!tableName) return next.handle();

    const skipMasking = this.reflector.getAllAndOverride<boolean>(SKIP_MASKING_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipMasking) return next.handle();

    const request = context.switchToHttp().getRequest();
    const userId: number | undefined = parseInt(request?.headers?.userid);

    // Fetch current role IDs from DB — JWT roles can be stale if roles were
    // assigned after the token was issued.
    let roleIds: number[] = [];
    if (userId) {
      const userRoles = await this.userRoleRepo.find({ where: { userId } });
      roleIds = userRoles.map((ur) => ur.roleId);
    }

    const includeRevealMeta =
      roleIds.length > 0
        ? await this.aclService.hasAccess(roleIds, 'POST', 'reveal')
        : false;

    return next.handle().pipe(
      map((response) => this.maskDeep(response, includeRevealMeta)),
    );
  }

  /**
   * Resolves the reveal target (table, field, id) from a `revealAs` config.
   * Handles static (RevealAsTarget) and conditional (RevealAsConditional) cases.
   */
  private resolveRevealTarget(
    revealAs: (RevealAsTarget | RevealAsConditional) | undefined,
    registryTable: string,
    field: string,
    pk: any,
    result: Record<string, any>,
  ): { revealTable: string; revealField: string; revealId: any } {
    if (!revealAs) {
      return { revealTable: registryTable, revealField: field, revealId: pk };
    }

    let target: RevealAsTarget | undefined;

    if ('conditionField' in revealAs) {
      const condValue = String(result[revealAs.conditionField] ?? '').toLowerCase();
      target = revealAs.conditionMap[condValue] ?? revealAs.fallback;
    } else {
      target = revealAs;
    }

    if (!target) {
      return { revealTable: registryTable, revealField: field, revealId: pk };
    }

    return {
      revealTable: target.table,
      revealField: target.field,
      revealId: target.idField !== undefined ? result[target.idField] : pk,
    };
  }

  /**
   * Recursively walks the entire response value (any depth, any shape) and
   * applies masking for every registered table whose primary key is found on
   * an object.  This handles:
   *   - plain objects           { employeeId, emailId, ... }
   *   - arrays                  [ { employeeId, ... }, ... ]
   *   - API wrappers            { status, message, data: <any of the above> }
   *   - pagination wrappers     { data: [...], count: N }
   *   - deeply nested objects   employee.user.emailId, etc.
   *
   * Primitives (string, number, boolean, null, undefined) are returned as-is.
   * Already-added `_reveal` keys are not recursed into.
   */
  private maskDeep(value: any, includeRevealMeta: boolean): any {
    // Primitives — nothing to do
    if (value === null || value === undefined || typeof value !== 'object') {
      return value;
    }

    // Arrays — recurse into every element
    if (Array.isArray(value)) {
      return value.map((item) => this.maskDeep(item, includeRevealMeta));
    }

    // Plain object — apply masking for every registry entry whose PK is present,
    // then recurse into every nested value.
    const result = { ...value };

    for (const [registryTable, config] of Object.entries(MASKING_REGISTRY)) {
      const pk = result[config._primaryKey];
      if (pk === undefined) continue; // this object doesn't belong to this table

      // Discriminator guard: if defined, the object must have that field present.
      // Prevents generic { id } objects from being mistakenly matched.
      if (config._discriminator && result[config._discriminator.field] === undefined) continue;

      for (const [field, maskConfig] of Object.entries(config.fields)) {
        if (result[field] !== undefined && result[field] !== null) {
          // Resolve CONDITIONAL pattern using the sibling field's runtime value.
          let resolvedConfig: MaskingConfig;
          if (maskConfig.pattern === MaskingPattern.CONDITIONAL) {
            const typeValue = String(result[maskConfig.typeField] ?? '');
            resolvedConfig = maskConfig.typeMap[typeValue] ?? { pattern: MaskingPattern.FULL };
          } else {
            resolvedConfig = maskConfig;
          }
          result[field] = maskValue(String(result[field]), resolvedConfig);
          // Only inject reveal metadata for roles that have reveal permission.
          if (includeRevealMeta) {
            const { revealTable, revealField, revealId } =
              this.resolveRevealTarget(maskConfig.revealAs, registryTable, field, pk, result);
            result[`${field}_reveal`] = { table: revealTable, field: revealField, id: revealId };
          }
        }
      }
    }

    // Recurse into all nested values.
    // Skip keys ending in '_reveal' — those are metadata objects we just added
    // and don't need further traversal.
    for (const key of Object.keys(result)) {
      if (!key.endsWith('_reveal')) {
        result[key] = this.maskDeep(result[key], includeRevealMeta);
      }
    }

    return result;
  }
}
