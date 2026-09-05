import { Injectable } from '@nestjs/common';
import { NudgeDataRepository } from './nudge-data.repository';
import { Cacheable } from '../../../../service-lib/src/lib/cache/cacheable.decorator';
import { CacheService } from '../../../../service-lib/src/lib/cache/cache.service';
import axios from 'axios';
import { ENV } from '../../../../service-lib/src/lib/environment';

@Injectable()
export class NudgeDataService {
  constructor(private readonly repo: NudgeDataRepository, private readonly cacheService: CacheService) {}

  @Cacheable({
    key: (roleId: number, scopeId: number) => `${roleId}:${scopeId}`,
    ttl: 21600, // cache time in seconds
  })
  async getNudges(
    roleIds: number[] | number,
    scopeId: number,
    userId: number
  ) {
    // Normalize roleIds
    const roleIdArray = Array.isArray(roleIds) ? roleIds : [roleIds];
    const mappings = await this.repo.getTemplateByRoleAndScope(
        roleIdArray,
        scopeId
      );

    // Extract unique nudge IDs
    const nudgeIdSet = new Set<number>();
    for (const map of mappings) {
      if (map.nudgeId !== undefined && map.nudgeId !== null) {
        nudgeIdSet.add(map.nudgeId);
      }
    }
    const nudgeIds = Array.from(nudgeIdSet);

    const results: any[] = [];

    for (const nudgeId of nudgeIds) {
      // Fetch nudge
      const nudge = await this.repo.getNudgeWithRelations(nudgeId);
      if (!nudge) continue;

      // Replace placeholders with --
      let finalTemplate = nudge.nudgeTemplate;
      finalTemplate = finalTemplate.replace(/{{(.*?)}}/g, '--');

      // Fetch parameters
      const params = await this.repo.getParametersByNudgeId(nudge.id);

      // Build attributes
      const attributes: Record<string, any> = {};
      params.forEach((p: any) => {
        attributes[p.parameter] = p.dataType || '';
      });

      // AI payload structure (embedded, NOT sent)
      const aiPayload = {
        user_id: userId,
        nudges: [
          {
            nudge_id: nudge.id,
            prompt: nudge.prompt,
            nudge_template: nudge.nudgeTemplate,
            attributes
          }
        ]
      };

      // Final response object
      results.push({
        nudge_id: nudge.id,
        title: nudge.name,
        description: nudge.description,
        insight: finalTemplate,
        endpoint_url: nudge.endpointUrl,
        method: nudge.method,
        actions: nudge.actions?.map((a: any) => ({
          name: a.name,
          url: a.actionUrl || '',
          additional_details: a.additionalDetails || null
        })),
        prompt: nudge.prompt || null,
        icon: nudge.iconKey || null,
        backgroundColor: nudge.backgroundColor || null,
        ai_payload: aiPayload,
        template_type: nudge.templateType
      });
    }
    return results;
  }

  @Cacheable({
    key: (aiPayload: any) => {
      const userId = aiPayload?.user_id ?? '';
      const nudgeIds = Array.isArray(aiPayload?.nudges)
        ? aiPayload.nudges.map((n: any) => n.nudge_id).sort((a:any, b:any) => a - b).join(',')
        : '';
      return `user:${userId}_nudgeIds:${nudgeIds}`;
    },
    ttl: 21600, // cache time in seconds
  })
  async getNudgeParameterData(aiPayload: any, authHeader: string) {
    //Axios POST call
    let aiResponse;
    try {
      aiResponse = await axios.post(
        `${ENV.URL_AI_UTILITY_SERVICE}/get-nudge-data`,
        aiPayload,
        {
          headers: {
                Authorization: authHeader
          }
        }
      );
    } catch (error: any) {
      throw error;
    }
    // AI response
  const responseData = aiResponse.data;
  // Extract first key dynamically (Nudge_1_Response)
  const responseKey = Object.keys(responseData)[0];
  const nudgeResponse = responseData[responseKey];

  let finalTemplate = nudgeResponse.nudge_template;
  const data = nudgeResponse.data || {};
  // Replace placeholders with value wrapped in double #
  Object.entries(data).forEach(([key, value]) => {
    const safeValue =
      value === null || value === undefined || value === ''
        ? '--'
        : `##${String(value)}##`;

    finalTemplate = finalTemplate.replace(
      new RegExp(`{{${key}}}`, 'g'),
      safeValue
    );
  });
  // Replace any remaining placeholders with '--'
  finalTemplate = finalTemplate.replace(/{{(.*?)}}/g, '--');
  // Final response
  return {
      nudge_id: nudgeResponse.nudge_id,
      nudge_template: finalTemplate
    };
  }

}
