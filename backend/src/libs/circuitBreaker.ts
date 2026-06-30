import CircuitBreaker from "opossum";
import { logger } from "../utils/logger";

export type CircuitBreakerOptions = CircuitBreaker.Options;

const DEFAULT_OPTIONS: CircuitBreakerOptions = {
  timeout: 15000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
  rollingCountTimeout: 10000,
  rollingCountBuckets: 10,
  volumeThreshold: 5
};

export const createCircuitBreaker = <TArgs extends unknown[], TResult>(
  name: string,
  action: (...args: TArgs) => Promise<TResult>,
  options: CircuitBreakerOptions = {}
): CircuitBreaker<TArgs, TResult> => {
  const resolvedOptions = { ...DEFAULT_OPTIONS, ...options };
  const breaker = new CircuitBreaker(action, resolvedOptions);

  breaker.on("open", () =>
    logger.warn(
      `[CircuitBreaker:${name}] OPEN — falhas consecutivas detectadas, ` +
        `cortando chamadas por ${resolvedOptions.resetTimeout}ms`
    )
  );
  breaker.on("halfOpen", () =>
    logger.info(`[CircuitBreaker:${name}] HALF-OPEN — testando recuperação`)
  );
  breaker.on("close", () =>
    logger.info(`[CircuitBreaker:${name}] CLOSED — serviço normalizado`)
  );
  breaker.on("timeout", () =>
    logger.warn(`[CircuitBreaker:${name}] chamada excedeu o timeout`)
  );

  return breaker;
};
