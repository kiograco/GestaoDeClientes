import { BullAdapter, setQueues, router as bullRoute } from "bull-board";
import { Application } from "express";
import Queue from "../libs/Queue";

export default async function bullMQ(app: Application): Promise<void> {
  console.info("bullMQ started");
  await Queue.process();

  // await Queue.add("VerifyScheduleMessages", {});
  await Queue.add("VerifyTicketsChatBotInactives", {});
  await Queue.add("SendMessageSchenduled", {});

  if (process.env.NODE_ENV !== "production") {
    setQueues(
      Queue.queues.map((q: LegacyAny) => new BullAdapter(q.bull) as LegacyAny)
    );
    app.use("/admin/queues", bullRoute);
  }
}
