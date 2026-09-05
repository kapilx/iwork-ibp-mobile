import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { NudgeScopeRoleMapping } from '../../../../service-lib/src/lib/entities/master-nudge-scope-role-mapping.entity';
import { Nudge } from '../../../../service-lib/src/lib/entities/master-nudge.entity';
import { NudgeParameter } from '../../../../service-lib/src/lib/entities/master-nudge-parameters.entity';

@Injectable()
export class NudgeDataRepository {
  constructor(
    @InjectRepository(NudgeScopeRoleMapping)
    private readonly mappingRepo: Repository<NudgeScopeRoleMapping>,

    @InjectRepository(Nudge)
    private readonly nuggetRepo: Repository<Nudge>,

    @InjectRepository(NudgeParameter)
    private readonly nuggetParamRepo: Repository<NudgeParameter>
  ) {}

  async getTemplateByRoleAndScope(roleIds: number[], scopeId: number) {
    // Support both single and multiple role IDs
    return this.mappingRepo.find({
      where: {
        roleId: In(roleIds),
        scopeId,
        isEnable: true
      }
    });
  }

  async getNudgeWithRelations(nudgeId: number) {
    return this.nuggetRepo.findOne({
      where: { id: nudgeId, isEnable: true },
      relations: ['actions', 'parameters']
    });
  }
  
  async getParametersByNudgeId(nudgeId: number) {
    return this.nuggetParamRepo.find({
        where: {
          nudgeId: { id: nudgeId },
          isEnable: true
        }
      });
    }   
}
