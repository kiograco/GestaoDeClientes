import { JobOptions } from "bull";
import { addSeconds, differenceInSeconds } from "date-fns";
import { zonedTimeToUtc } from "date-fns-tz";
import Campaign from "../../models/Campaign";
import AppError from "../../errors/AppError";
import CampaignContacts from "../../models/CampaignContacts";
import Queue from "../../libs/Queue";

interface Request {
  campaignId: string | number;
  tenantId: number | string;
  // eslint-disable-next-line @typescript-eslint/ban-types
  options?: JobOptions;
}

// const isValidDate = (date: Date) => {
//   return (
//     startOfDay(new Date(date)).getTime() >= startOfDay(new Date()).getTime()
//   );
// };

const cArquivoName = (url: string | null) => {
  if (!url) return "";
  const split = url.split("/");
  const name = split[split.length - 1];
  return name;
};

const randomInteger = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const mountMessageData = (
  campaign: Campaign,
  campaignContact: CampaignContacts,
  // eslint-disable-next-line @typescript-eslint/ban-types
  options: object | undefined
) => {
  const availableMessages = [
    { key: "message1", body: campaign.message1 },
    { key: "message2", body: campaign.message2 },
    { key: "message3", body: campaign.message3 }
  ].filter(message => message.body?.trim());

  if (!availableMessages.length) {
    throw new AppError("ERR_CAMPAIGN_MESSAGE_REQUIRED");
  }

  const messageRandom = randomInteger(0, availableMessages.length - 1);
  const message = availableMessages[messageRandom];

  return {
    whatsappId: campaign.sessionId,
    message: message.body,
    number: campaignContact.contact.number,
    mediaUrl: campaign.mediaUrl,
    mediaName: cArquivoName(campaign.mediaUrl),
    messageRandom: message.key,
    campaignContact,
    options
  };
};

const calcDelay = (nextDate: Date, delay: number) => {
  const diffSeconds = differenceInSeconds(nextDate, new Date());
  // se a diferença for negativa, a hora em que a tarefa está sendo
  // programada é menor que a
  // if (diffSeconds < 0)
  return diffSeconds * 1000 + delay;
};

const StartCampaignService = async ({
  campaignId,
  tenantId,
  options
}: Request): Promise<void> => {
  const campaign = await Campaign.findOne({
    where: { id: campaignId, tenantId },
    include: ["session"]
  });

  if (!campaign) {
    throw new AppError("ERROR_CAMPAIGN_NOT_EXISTS", 404);
  }

  // if (!isValidDate(campaign.start)) {
  //   throw new AppError("ERROR_CAMPAIGN_DATE_NOT_VALID", 404);
  // }

  const campaignContacts = await CampaignContacts.findAll({
    where: { campaignId },
    include: ["contact"]
  });

  if (!campaignContacts) {
    throw new AppError("ERR_CAMPAIGN_CONTACTS_NOT_EXISTS", 404);
  }

  const timeDelay = campaign.delay ? campaign.delay * 1000 : 20000;
  // const today = zonedTimeToUtc(new Date(), "America/Sao_Paulo");
  // let dateDelay = setHours(
  //   setMinutes(
  //     zonedTimeToUtc(campaign.start, "America/Sao_Paulo"),
  //     today.getMinutes() + 1
  //   ),
  //   today.getHours()
  // );
  let dateDelay = zonedTimeToUtc(campaign.start, "America/Sao_Paulo");
  const data = campaignContacts.map((campaignContact: CampaignContacts) => {
    dateDelay = addSeconds(dateDelay, timeDelay / 1000);
    return mountMessageData(campaign, campaignContact, {
      ...options,
      jobId: `campaginId_${campaign.id}_contact_${campaignContact.contactId}_id_${campaignContact.id}`,
      delay: calcDelay(dateDelay, timeDelay)
    });
  });

  Queue.add("SendMessageWhatsappCampaign", data);

  await campaign.update({
    status: "scheduled"
  });
};

export default StartCampaignService;
