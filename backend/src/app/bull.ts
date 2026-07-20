import { createBullBoard } from "@bull-board/api";
import { BullAdapter } from "@bull-board/api/dist/queueAdapters/bull.js";
import { ExpressAdapter } from "@bull-board/express";
import { Application } from "express";
import Queue from "../libs/Queue";
import {
  bullBoardAuth,
  isBullBoardConfigured
} from "../middleware/bullBoardAuth";

export default async function bullMQ(app: Application): Promise<void> {
  await Queue.process();

  await Queue.add("VerifyTicketsChatBotInactives", {});
  await Queue.add("SendMessageSchenduled", {});

  if (isBullBoardConfigured()) {
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath("/admin/queues");

    createBullBoard({
      queues: Queue.queues.map((q: LegacyAny) => new BullAdapter(q.bull)),
      serverAdapter
    });

    app.use("/admin/queues", bullBoardAuth, serverAdapter.getRouter());
  } else {
    app.use("/admin/queues", bullBoardAuth);
  }
}
