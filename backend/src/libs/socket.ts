import { Server as SocketIO } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import { Server } from "http";
import AppError from "../errors/AppError";
import decodeTokenSocket from "./decodeTokenSocket";
import { logger } from "../utils/logger";
import User from "../models/User";
import Tenant from "../models/Tenant";
import Chat from "./socketChat/Chat";
import { isTenantAccessActive } from "../helpers/TenantAccess";
import { getFrontendOrigins } from "../utils/frontendUrl";

let io: SocketIO;
const MAX_TIMEOUT_DELAY = 2147483647;

const scheduleTenantAccessCheck = (
  socket: LegacyAny,
  tenantId: number,
  accessExpiresAt?: Date
): void => {
  if (!accessExpiresAt) return;

  const delay = Math.max(
    0,
    new Date(accessExpiresAt).getTime() - Date.now() + 1000
  );
  let timeout: NodeJS.Timeout;
  const clearScheduledCheck = (): void => clearTimeout(timeout);
  timeout = setTimeout(async () => {
    socket.removeListener("disconnect", clearScheduledCheck);
    const tenant = await Tenant.findByPk(tenantId, {
      attributes: ["status", "accessExpiresAt"]
    });

    if (!isTenantAccessActive(tenant)) {
      socket.disconnect(true);
      return;
    }

    scheduleTenantAccessCheck(socket, tenantId, tenant?.accessExpiresAt);
  }, Math.min(delay, MAX_TIMEOUT_DELAY));

  socket.once("disconnect", clearScheduledCheck);
};

export const initIO = (httpServer: Server): SocketIO => {
  io = new SocketIO(httpServer, {
    cors: {
      origin: getFrontendOrigins(),
      credentials: true
    },
    pingTimeout: 180000,
    pingInterval: 60000
  });

  const redisOptions = {
    host: process.env.IO_REDIS_SERVER || "localhost",
    port: Number(process.env.IO_REDIS_PORT) || 6379,
    username: process.env.IO_REDIS_USERNAME,
    password: process.env.IO_REDIS_PASSWORD
  };

  const pubClient = new Redis(redisOptions);
  const subClient = pubClient.duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  io.use(async (socket, next) => {
    try {
      const token = socket?.handshake?.auth?.token;
      const verify = decodeTokenSocket(token);
      if (verify.isValid) {
        const auth = socket?.handshake?.auth;
        socket.handshake.auth = {
          ...auth,
          ...verify.data,
          id: String(verify.data.id),
          tenantId: String(verify.data.tenantId)
        };

        const user = await User.findByPk(verify.data.id, {
          attributes: [
            "id",
            "tenantId",
            "name",
            "email",
            "profile",
            "status",
            "lastLogin",
            "lastOnline"
          ],
          include: [
            { model: Tenant, attributes: ["status", "accessExpiresAt"] }
          ]
        });
        if (
          !user ||
          String(user.tenantId) !== String(verify.data.tenantId) ||
          user.profile !== verify.data.profile ||
          (user.profile !== "superadmin" && !isTenantAccessActive(user.tenant))
        ) {
          next(new Error("authentication error"));
          return;
        }
        socket.handshake.auth.user = user;
        next();
        return;
      }
      next(new Error("authentication error"));
    } catch (error) {
      logger.warn(`tokenInvalid: ${socket}`);
      socket.emit(`tokenInvalid:${socket.id}`);
      next(new Error("authentication error"));
    }
  });

  io.on("connection", socket => {
    const { tenantId } = socket.handshake.auth;
    const user = socket.handshake.auth.user as User | undefined;
    if (tenantId) {
      logger.info({
        message: "Client connected in tenant",
        data: socket.handshake.auth
      });

      // create room to tenant
      socket.join(tenantId.toString());
      if (user?.profile !== "superadmin") {
        scheduleTenantAccessCheck(
          socket,
          Number(tenantId),
          user?.tenant?.accessExpiresAt
        );
      }

      socket.on(`${tenantId}:joinChatBox`, ticketId => {
        logger.info(`Client joined a ticket channel ${tenantId}:${ticketId}`);
        socket.join(`${tenantId}:${ticketId}`);
      });

      socket.on(`${tenantId}:joinNotification`, () => {
        logger.info(
          `A client joined notification channel ${tenantId}:notification`
        );
        socket.join(`${tenantId}:notification`);
      });

      socket.on(`${tenantId}:joinTickets`, status => {
        logger.info(
          `A client joined to ${tenantId}:${status} tickets channel.`
        );
        socket.join(`${tenantId}:${status}`);
      });
      Chat.register(socket);
    }

    socket.on("disconnect", (reason: LegacyAny) => {
      logger.info({
        message: `SOCKET Client disconnected , ${tenantId}, ${reason}`
      });
    });
  });
  return io;
};

export const getIO = (): SocketIO => {
  if (!io) {
    throw new AppError("Socket IO not initialized");
  }
  return io;
};

export const disconnectTenantSockets = async (
  tenantId: number | string
): Promise<void> => {
  try {
    const socketServer = getIO();
    const sockets = await socketServer.in(String(tenantId)).fetchSockets();

    await Promise.all(
      sockets.map(async socket => {
        try {
          socket.disconnect(true);
        } catch (error) {
          logger.warn(
            `Unable to disconnect tenant socket ${socket.id}: ${error}`
          );
        }
      })
    );
  } catch (error) {
    logger.warn(`Unable to disconnect tenant ${tenantId} sockets: ${error}`);
  }
};
