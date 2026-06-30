import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { createCircuitBreaker } from "../../libs/circuitBreaker";

export const metaGraphBreaker = createCircuitBreaker(
  "waba-meta",
  (config: AxiosRequestConfig): Promise<AxiosResponse> => axios(config),
  { timeout: 15000 }
);
