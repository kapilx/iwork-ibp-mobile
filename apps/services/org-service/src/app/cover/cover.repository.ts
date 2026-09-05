import { BadRequestException, Injectable } from "@nestjs/common";
import { DataSource, In } from "typeorm";
import {
  MstrCover,
  MstrCoverTemplate,
} from "../../../../service-lib/src/lib/entities";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { SyncCoverItemDto } from "./dto/sync-cover-template.dto";

/**
 * Handles cover-template (mstr_cover_template) read + reconcile operations
 * for the master "Covers" mapping flow (Step 2).
 * See docs/cover_template_map/cover-template-map-spec.md (§5).
 */
@Injectable()
export class CoverRepository {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly dataSource: DataSource,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.ORG_SERVICE);
  }

  /**
   * Returns the covers currently mapped to a policy type (optionally scoped by org),
   * ordered by display sequence.
   */
  async getMappings(
    policyTypeId: number,
    organizationId?: number
  ): Promise<MstrCoverTemplate[]> {
    const where: Record<string, number> = { policyTypeId };
    if (organizationId !== undefined && organizationId !== null) {
      where.organizationId = organizationId;
    }
    return this.dataSource.getRepository(MstrCoverTemplate).find({
      where,
      order: { displaySequence: "ASC", id: "ASC" },
    });
  }

  /**
   * Reconciles the mapped covers for a policy type + org to match the desired set:
   * - inserts new mappings (copying carry-over fields from mstr_cover)
   * - updates mandatory / display sequence on existing mappings
   * - deletes mappings that are no longer in the desired set
   */
  async syncMappings(
    policyTypeId: number,
    organizationId: number,
    covers: SyncCoverItemDto[],
    userId: number
  ): Promise<MstrCoverTemplate[]> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "CoverRepository",
        method: "syncMappings",
        payload: { policyTypeId, organizationId, count: covers.length },
        messageData: "method invoked",
      }),
    });

    return this.dataSource.transaction(async (manager) => {
      const tplRepo = manager.getRepository(MstrCoverTemplate);
      const coverRepo = manager.getRepository(MstrCover);

      const desiredRefIds = covers.map((c) => c.refCoverId);

      const existing = await tplRepo.find({
        where: { policyTypeId, organizationId },
      });
      const existingByRef = new Map(existing.map((e) => [e.refCoverId, e]));

      // Delete mappings no longer desired.
      const toDelete = existing.filter(
        (e) => !desiredRefIds.includes(e.refCoverId)
      );
      if (toDelete.length) {
        await tplRepo.delete({ id: In(toDelete.map((e) => e.id)) });
      }

      // Load source covers for the new mappings.
      const newRefIds = covers
        .filter((c) => !existingByRef.has(c.refCoverId))
        .map((c) => c.refCoverId);
      const sourceCovers = newRefIds.length
        ? await coverRepo.find({ where: { id: In(newRefIds) } })
        : [];
      const sourceById = new Map(sourceCovers.map((s) => [s.id, s]));

      const toSave: Array<Partial<MstrCoverTemplate>> = covers.map((c) => {
        const mandatory = c.mandatory ?? "Yes";
        const displaySequence =
          c.displaySequence === undefined ? undefined : c.displaySequence;
        const existingRow = existingByRef.get(c.refCoverId);

        if (existingRow) {
          return {
            ...existingRow,
            mandatory,
            displaySequence: displaySequence ?? existingRow.displaySequence,
            visibleUntilActivityKey: c.visibleUntilActivityKey ?? null,
            updatedBy: userId,
          };
        }

        const src = sourceById.get(c.refCoverId);
        if (!src) {
          throw new BadRequestException(
            `Cover with id ${c.refCoverId} does not exist`
          );
        }
        return {
          refCoverId: src.id,
          coverName: src.name,
          coverDescription: src.description ?? undefined,
          mandatory,
          organizationId,
          policyTypeId,
          displaySequence: displaySequence ?? undefined,
          coverTypeLid: src.coverTypeLid ?? undefined,
          inputType: src.inputType ?? undefined,
          inputLov: src.inputLov ?? undefined,
          coversMeta: src.coversMeta ?? undefined,
          visibleUntilActivityKey: c.visibleUntilActivityKey ?? null,
          createdBy: userId,
          updatedBy: userId,
        };
      });

      if (toSave.length) {
        await tplRepo.save(toSave);
      }

      return tplRepo.find({
        where: { policyTypeId, organizationId },
        order: { displaySequence: "ASC", id: "ASC" },
      });
    });
  }
}
