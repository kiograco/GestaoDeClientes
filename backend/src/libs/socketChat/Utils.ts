/* eslint-disable consistent-return */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {
  each,
  sortBy,
  fromPairs,
  map,
  forEach,
  isNull,
  findKey,
  isUndefined
} from "lodash";
import { Socket } from "socket.io";

export const sortByKeys = (obj: LegacyAny) => {
  const keys = Object.keys(obj);
  const sortedKeys = sortBy(keys);
  return fromPairs(
    map(sortedKeys, key => {
      return [key, obj[key]];
    })
  );
};

export const sendToSelf = (
  socket: Socket,
  method: LegacyAny,
  data: LegacyAny = {}
) => {
  socket.emit(method, data);
};

export const _sendToSelf = (
  io: { sockets: { sockets: LegacyAny } },
  socketId: LegacyAny,
  method: LegacyAny,
  data: LegacyAny
) => {
  each(io.sockets.sockets, socket => {
    if (socket.id === socketId) {
      socket.emit(method, data);
    }
  });
};

export const sendToAllConnectedClients = (
  socket: Socket,
  method: LegacyAny,
  data: LegacyAny
) => {
  socket.emit(method, data);
};

export const sendToAllClientsInRoom = (
  io: LegacyAny,
  room: LegacyAny,
  method: LegacyAny,
  data: LegacyAny
) => {
  io.sockets.in(room).emit(method, data);
};

export const sendToUser = (
  socketList: LegacyAny,
  userList: LegacyAny,
  username: LegacyAny,
  method: LegacyAny,
  data: LegacyAny
) => {
  let userOnline: LegacyAny = null;
  forEach(userList, (v, k) => {
    if (k.toLowerCase() === username.toLowerCase()) {
      userOnline = v;
      return true;
    }
  });

  if (isNull(userOnline)) return true;

  forEach(userOnline?.sockets, socket => {
    const o = findKey(socketList, { id: socket });
    if (o) {
      const i = o ? socketList[o] : null;
      if (isUndefined(i)) return true;
      i.emit(method, data);
    }
  });
};

export const sendToAllExcept = (
  io: LegacyAny,
  exceptSocketId: LegacyAny,
  method: LegacyAny,
  data: LegacyAny
) => {
  each(io.sockets.sockets, socket => {
    if (socket.id !== exceptSocketId) {
      socket.emit(method, data);
    }
  });
};

export const disconnectAllClients = (io: LegacyAny) => {
  Object.keys(io.sockets.sockets).forEach(sock => {
    io.sockets.sockets[sock].disconnect(true);
  });
};
