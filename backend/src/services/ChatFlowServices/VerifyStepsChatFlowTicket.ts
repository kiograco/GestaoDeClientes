/* eslint-disable no-return-assign */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import { Message as WbotMessage } from "whatsapp-web.js";
import socketEmit from "../../helpers/socketEmit";
import Ticket from "../../models/Ticket";
import CreateMessageSystemService from "../MessageServices/CreateMessageSystemService";
import CreateLogTicketService from "../TicketServices/CreateLogTicketService";
import BuildSendMessageService from "./BuildSendMessageService";
import DefinedUserBotService from "./DefinedUserBotService";
import IsContactTest from "./IsContactTest";

const isNextSteps = async (
  ticket: Ticket,
  chatFlow: LegacyAny,
  step: LegacyAny,
  stepCondition: LegacyAny
): Promise<void> => {
  // action = 0: enviar para proximo step: nextStepId
  if (stepCondition.action === 0) {
    await ticket.update({
      stepChatFlow: stepCondition.nextStepId,
      botRetries: 0,
      lastInteractionBot: new Date()
    });

    const nodesList = [...chatFlow.flow.nodeList];

    /// pegar os dados do proxumo step
    const nextStep = nodesList.find(
      (n: LegacyAny) => n.id === stepCondition.nextStepId
    );

    if (!nextStep) return;

    for (const interaction of nextStep.interactions) {
      await BuildSendMessageService({
        msg: interaction,
        tenantId: ticket.tenantId,
        ticket
      });
    }
    // await SetTicketMessagesAsRead(ticket);
  }
};

const isQueueDefine = async (
  ticket: Ticket,
  flowConfig: LegacyAny,
  step: LegacyAny,
  stepCondition: LegacyAny
): Promise<void> => {
  // action = 1: enviar para fila: queue
  if (stepCondition.action === 1) {
    ticket.update({
      queueId: stepCondition.queueId,
      chatFlowId: null,
      stepChatFlow: null,
      botRetries: 0,
      lastInteractionBot: new Date()
    });

    await CreateLogTicketService({
      ticketId: ticket.id,
      type: "queue",
      queueId: stepCondition.queueId
    });

    if (flowConfig?.configurations?.autoDistributeTickets) {
      await DefinedUserBotService(
        ticket,
        stepCondition.queueId,
        ticket.tenantId,
        flowConfig?.configurations?.autoDistributeTickets
      );
      ticket.reload();
    }

    socketEmit({
      tenantId: ticket.tenantId,
      type: "ticket:update",
      payload: ticket
    });
  }
};

const isUserDefine = async (
  ticket: Ticket,
  step: LegacyAny,
  stepCondition: LegacyAny
): Promise<void> => {
  // action = 2: enviar para determinado usuário
  if (stepCondition.action === 2) {
    ticket.update({
      userId: stepCondition.userIdDestination,
      // status: "pending",
      chatFlowId: null,
      stepChatFlow: null,
      botRetries: 0,
      lastInteractionBot: new Date()
    });

    ticket.reload();

    socketEmit({
      tenantId: ticket.tenantId,
      type: "ticket:update",
      payload: ticket
    });

    await CreateLogTicketService({
      userId: stepCondition.userIdDestination,
      ticketId: ticket.id,
      type: "userDefine"
    });
  }
};

// enviar mensagem de boas vindas à fila ou usuário
const sendWelcomeMessage = async (
  ticket: Ticket,
  flowConfig: LegacyAny
): Promise<void> => {
  if (flowConfig?.configurations?.welcomeMessage?.message) {
    const messageData = {
      body: flowConfig.configurations?.welcomeMessage.message,
      fromMe: true,
      read: true,
      sendType: "bot"
    };

    await CreateMessageSystemService({
      msg: messageData,
      tenantId: ticket.tenantId,
      ticket,
      sendType: messageData.sendType,
      status: "pending"
    });
  }
};

const isRetriesLimit = async (
  ticket: Ticket,
  flowConfig: LegacyAny
): Promise<boolean> => {
  // verificar o limite de retentativas e realizar ação
  const maxRetryNumber = flowConfig?.configurations?.maxRetryBotMessage?.number;
  if (
    flowConfig?.configurations?.maxRetryBotMessage &&
    maxRetryNumber &&
    ticket.botRetries >= maxRetryNumber - 1
  ) {
    const destinyType = flowConfig.configurations.maxRetryBotMessage.type;
    const { destiny } = flowConfig.configurations.maxRetryBotMessage;
    const updatedValues: LegacyAny = {
      chatFlowId: null,
      stepChatFlow: null,
      botRetries: 0,
      lastInteractionBot: new Date()
    };
    const logsRetry: LegacyAny = {
      ticketId: ticket.id,
      type: destinyType === 1 ? "retriesLimitQueue" : "retriesLimitUserDefine"
    };

    // enviar para fila
    if (destinyType === 1) {
      updatedValues.queueId = destiny;
      logsRetry.queueId = destiny;
    }
    // enviar para usuario
    if (destinyType === 2) {
      updatedValues.userId = destiny;
      logsRetry.userId = destiny;
    }

    ticket.update(updatedValues);
    socketEmit({
      tenantId: ticket.tenantId,
      type: "ticket:update",
      payload: ticket
    });
    await CreateLogTicketService(logsRetry);

    // enviar mensagem de boas vindas à fila ou usuário
    await sendWelcomeMessage(ticket, flowConfig);
    return true;
  }
  return false;
};

const isAnswerCloseTicket = async (
  flowConfig: LegacyAny,
  ticket: Ticket,
  message: string
): Promise<boolean> => {
  if (
    !flowConfig?.configurations?.answerCloseTicket ||
    flowConfig?.configurations?.answerCloseTicket?.length < 1
  ) {
    return false;
  }

  // verificar condição com a ação
  const params = flowConfig.configurations.answerCloseTicket.find(
    (condition: LegacyAny) => {
      return (
        String(condition).toLowerCase().trim() ===
        String(message).toLowerCase().trim()
      );
    }
  );

  if (params) {
    await ticket.update({
      chatFlowId: null,
      stepChatFlow: null,
      botRetries: 0,
      lastInteractionBot: new Date(),
      unreadMessages: 0,
      answered: false,
      status: "closed"
    });

    await CreateLogTicketService({
      ticketId: ticket.id,
      type: "autoClose"
    });

    socketEmit({
      tenantId: ticket.tenantId,
      type: "ticket:update",
      payload: ticket
    });

    return true;
  }
  return false;
};

const VerifyStepsChatFlowTicket = async (
  msg: WbotMessage | LegacyAny,
  ticket: Ticket | LegacyAny
): Promise<void> => {
  let celularTeste; // ticket.chatFlow?.celularTeste;

  if (
    ticket.chatFlowId &&
    ticket.status === "pending" &&
    !msg.fromMe &&
    !ticket.isGroup &&
    !ticket.answered
  ) {
    if (ticket.chatFlowId) {
      const chatFlow = await ticket.getChatFlow();
      if (chatFlow.celularTeste) {
        celularTeste = chatFlow.celularTeste.replace(/\s/g, ""); // retirar espaços
      }

      const step = chatFlow.flow.nodeList.find(
        (node: LegacyAny) => node.id === ticket.stepChatFlow
      );

      const flowConfig = chatFlow.flow.nodeList.find(
        (node: LegacyAny) => node.type === "configurations"
      );

      // verificar condição com a ação do step
      const stepCondition = step.conditions.find((conditions: LegacyAny) => {
        if (conditions.type === "US") return true;
        const newConditions = conditions.condition.map((c: LegacyAny) =>
          String(c).toLowerCase().trim()
        );
        const message = String(msg.body).toLowerCase().trim();
        return newConditions.includes(message);
      });

      if (
        !ticket.isCreated &&
        (await isAnswerCloseTicket(flowConfig, ticket, msg.body))
      )
        return;

      if (stepCondition && !ticket.isCreated) {
        // await CreateAutoReplyLogsService(stepAutoReplyAtual, ticket, msg.body);
        // Verificar se rotina em teste
        if (
          await IsContactTest(
            ticket.contact.number,
            celularTeste,
            ticket.channel
          )
        )
          return;

        // action = 0: enviar para proximo step: nextStepId
        await isNextSteps(ticket, chatFlow, step, stepCondition);

        // action = 1: enviar para fila: queue
        await isQueueDefine(ticket, flowConfig, step, stepCondition);

        // action = 2: enviar para determinado usuário
        await isUserDefine(ticket, step, stepCondition);

        socketEmit({
          tenantId: ticket.tenantId,
          type: "ticket:update",
          payload: ticket
        });

        if (stepCondition.action === 1 || stepCondition.action === 2) {
          await sendWelcomeMessage(ticket, flowConfig);
        }
      } else {
        // Verificar se rotina em teste
        if (
          await IsContactTest(
            ticket.contact.number,
            celularTeste,
            ticket.channel
          )
        )
          return;

        // se ticket tiver sido criado, ingnorar na primeria passagem
        if (!ticket.isCreated) {
          if (await isRetriesLimit(ticket, flowConfig)) return;

          const messageData = {
            body:
              flowConfig.configurations.notOptionsSelectMessage.message ||
              "Desculpe! Não entendi sua resposta. Vamos tentar novamente! Escolha uma opção válida.",
            fromMe: true,
            read: true,
            sendType: "bot"
          };
          await CreateMessageSystemService({
            msg: messageData,
            tenantId: ticket.tenantId,
            ticket,
            sendType: messageData.sendType,
            status: "pending"
          });

          // tratar o número de retentativas do bot
          await ticket.update({
            botRetries: ticket.botRetries + 1,
            lastInteractionBot: new Date()
          });
        }
        for (const interaction of step.interactions) {
          await BuildSendMessageService({
            msg: interaction,
            tenantId: ticket.tenantId,
            ticket
          });
        }
      }
      // await SetTicketMessagesAsRead(ticket);
      // await SetTicketMessagesAsRead(ticket);
    }
  }
};

export default VerifyStepsChatFlowTicket;
