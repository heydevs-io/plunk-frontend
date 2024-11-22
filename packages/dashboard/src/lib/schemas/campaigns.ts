import { z } from "zod";
import { CampaignSchemas } from "shared/dist";

export type CampaignCreateData = z.infer<typeof CampaignSchemas.create>;
export type CampaignUpdateData = z.infer<typeof CampaignSchemas.update>;
