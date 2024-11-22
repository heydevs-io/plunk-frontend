import useSWR from "swr";
import { Campaign, Contact } from "@prisma/client";
import { useActiveProject } from "./projects";
import { useEffect, useState } from "react";
import { CampaignCreateData, CampaignUpdateData } from "../schemas/campaigns";
import { network } from "../network";
import { CampaignSchemas } from "shared/dist";
import { formatData } from "../utils/campaigns";
import { FieldErrors } from "react-hook-form";

/**
 *
 * @param id
 */
export function useCampaign(id: string) {
  return useSWR(`/v1/campaigns/${id}`);
}

/**
 *
 */
export function useCampaigns() {
  const activeProject = useActiveProject();

  return useSWR<
    (Campaign & {
      emails: {
        id: string;
        status: string;
      }[];
      tasks: {
        id: string;
      }[];
      recipients: {
        id: string;
      }[];
    })[]
  >(activeProject ? `/projects/id/${activeProject.id}/campaigns` : null);
}

const TEN_MINUTES = 10 * 60 * 1000;

type AutoSaveDraftProps = {
  time?: number;
  formData: CampaignCreateData | CampaignUpdateData;
  draftId?: string;
  contacts: Contact[];
  projectSecret: string;
  errors: FieldErrors;
  isRunning: boolean;
};

export const useAutoSaveDraftByTime = ({
  time = TEN_MINUTES,
  formData,
  draftId,
  contacts,
  projectSecret,
  errors,
  isRunning,
}: AutoSaveDraftProps) => {
  const [id, setId] = useState(draftId);

  useEffect(() => {
    const { email, subject, body, style, emailJson } = formData;

    const isValid = !!(
      isRunning &&
      projectSecret &&
      Object.keys(errors).length === 0 &&
      email &&
      subject &&
      body &&
      (style === "PLUNK" ? emailJson : true)
    );

    if (isValid) {
      const saveDraft = async () => {
        if (id) {
          await network.mock<Campaign, typeof CampaignSchemas.update>(
            projectSecret,
            "PUT",
            "/v1/campaigns",
            {
              id,
              ...formatData(formData, contacts),
            }
          );
        } else {
          const { id: newId } = await network.mock<
            Campaign,
            typeof CampaignSchemas.create
          >(
            projectSecret,
            "POST",
            "/v1/campaigns",
            formatData(formData, contacts)
          );
          setId(newId);
        }
      };

      const interval = setInterval(saveDraft, time);
      return () => clearInterval(interval);
    }
  }, [time, formData, id, contacts, projectSecret, isRunning]);

  useEffect(() => {
    setId(draftId);
  }, [draftId]);

  return { id };
};
