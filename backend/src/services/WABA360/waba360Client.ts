import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { createCircuitBreaker } from "../../libs/circuitBreaker";

const waba360Breaker = createCircuitBreaker(
  "waba360",
  (config: AxiosRequestConfig): Promise<AxiosResponse> => axios(config),
  { timeout: 15000 }
);

const waba360MediaBreaker = createCircuitBreaker(
  "waba360-media",
  (config: AxiosRequestConfig): Promise<AxiosResponse> => axios(config),
  { timeout: 30000 }
);

export const request360 = (
  config: AxiosRequestConfig
): Promise<AxiosResponse> => waba360Breaker.fire(config);

export const request360Media = (
  config: AxiosRequestConfig
): Promise<AxiosResponse> => waba360MediaBreaker.fire(config);
