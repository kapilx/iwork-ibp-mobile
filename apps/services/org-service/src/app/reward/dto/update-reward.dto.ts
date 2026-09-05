import { PartialType } from "@nestjs/swagger";
import { CreateRewardDto } from "./create-reward.dto";

// Same shape as create; rewardCategoryLid is ignored on update (immutable, BR-001).
export class UpdateRewardDto extends PartialType(CreateRewardDto) {}
