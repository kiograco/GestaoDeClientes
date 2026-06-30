/* eslint-disable @typescript-eslint/no-explicit-any */
import Redis from "ioredis";

const redisClient = new Redis({
  port: Number(process.env.IO_REDIS_PORT), // Redis port
  host: process.env.IO_REDIS_SERVER,
  db: Number(process.env.IO_REDIS_DB_SESSION) || 9,
  password: process.env.IO_REDIS_PASSWORD || undefined
});

export { redisClient };

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const getValue = (key: string) => {
  return new Promise((resolve, reject) => {
    redisClient.get(key, (err, value): LegacyAny => {
      if (err) return reject(err);
      let data: LegacyAny;
      if (value) {
        try {
          data = JSON.parse(value || "");
        } catch (error) {
          data = String(value);
        }
      } else {
        data = value;
      }
      return resolve(data);
    });
  });
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const setValue = (
  key: string,
  value: LegacyAny,
  ttlSeconds?: number
) => {
  return new Promise((resolve, reject) => {
    let stringfy: LegacyAny;
    if (typeof value === "object") {
      stringfy = JSON.stringify(value);
    } else {
      stringfy = String(value);
    }
    const callback = (err: LegacyAny): LegacyAny => {
      if (err) return reject(err);
      return resolve(stringfy);
    };
    if (ttlSeconds) {
      redisClient.set(key, stringfy, "EX", ttlSeconds, callback);
    } else {
      redisClient.set(key, stringfy, callback);
    }
  });
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const removeValue = (key: string) => {
  return new Promise((resolve, reject) => {
    redisClient.del(key, err => {
      if (err) return reject(err);
      return resolve(true);
    });
  });
};
