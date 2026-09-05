import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PolicyRepository } from "./policy.repository";
import { IS_DEMO_ENVIRONMENT } from "../../../../service-lib/src/lib/environment";

@Injectable()
export class EndorsementCreationScheduler {
  private readonly logger = new Logger(EndorsementCreationScheduler.name);

  constructor(private readonly policyRepository: PolicyRepository) {}

  @Cron("*/2 * * * *")
  async handlePendingCreateEndorsements(): Promise<void> {
    if (IS_DEMO_ENVIRONMENT) {
      return;
    }
    const job = await this.policyRepository.getPendingCreateEndorsementJob();
    if (!job) {
      return;
    }

    try {
      await this.policyRepository.processCreateEndorsementJob(job);
      this.logger.log(`Processed create endorsement job ${job.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to process create endorsement job ${job.id}`,
        error instanceof Error ? error.stack : undefined
      );
      await this.policyRepository.markCreateEndorsementJobFailed(job.id);
    }
  }
}
