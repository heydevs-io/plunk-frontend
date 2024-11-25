import { Contact } from "@prisma/client";
import { CampaignCreateData } from "../schemas/campaigns";

export const formatData = (data: CampaignCreateData, contacts: Contact[]) => ({
  ...data,
  recipients:
    data.recipients.length === contacts.filter((c) => c.subscribed).length
      ? ["all"]
      : data.recipients,
});
