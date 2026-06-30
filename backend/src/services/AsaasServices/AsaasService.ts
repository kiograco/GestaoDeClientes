import axios, { AxiosInstance } from "axios";
import AppError from "../../errors/AppError";
import { logger } from "../../utils/logger";

interface CustomerInput {
  name: string;
  cpfCnpj: string;
  email: string;
  externalReference: string;
}

interface CustomerResponse {
  id: string;
}

interface AsaasErrorResponse {
  errors?: Array<{
    code?: string;
    description?: string;
  }>;
}

interface PaymentInput {
  customer: string;
  billingType: "PIX" | "UNDEFINED";
  value: number;
  dueDate: string;
  description: string;
  externalReference: string;
}

export interface AsaasPaymentResponse {
  id: string;
  status: string;
  value: number;
  dueDate: string;
  invoiceUrl?: string;
  billingType: string;
}

export interface AsaasPixQrCodeResponse {
  encodedImage?: string;
  payload?: string;
  expirationDate?: string;
}

const createClient = (): AxiosInstance => {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) {
    throw new AppError("ERR_ASAAS_NOT_CONFIGURED", 503);
  }

  return axios.create({
    baseURL: process.env.ASAAS_API_URL || "https://api.asaas.com/v3",
    timeout: 15000,
    headers: {
      access_token: apiKey,
      "Content-Type": "application/json",
      "User-Agent": "NCProgrammers CRM"
    }
  } as LegacyAny);
};

const requestAsaas = async <T>(request: () => Promise<T>): Promise<T> => {
  try {
    return await request();
  } catch (error) {
    if (!axios.isAxiosError(error)) throw error;

    const status = error.response?.status;
    const data = error.response?.data as AsaasErrorResponse | undefined;
    const details = data?.errors
      ?.map(item => item.description || item.code)
      .filter(Boolean)
      .join(" ");

    logger.error(
      `Asaas request failed: status=${status || "network"} details=${
        details || error.message
      }`
    );

    if (status === 401) {
      throw new AppError("ERR_ASAAS_AUTHENTICATION", 502);
    }
    if (details) {
      throw new AppError(`ERR_ASAAS_REQUEST: ${details}`, 502);
    }
    throw new AppError("ERR_ASAAS_UNAVAILABLE", 502);
  }
};

export const createAsaasCustomer = async (
  data: CustomerInput
): Promise<CustomerResponse> => {
  const response = await requestAsaas(() =>
    createClient().post<CustomerResponse>("/customers", data)
  );
  return response.data;
};

export const createAsaasPayment = async (
  data: PaymentInput
): Promise<AsaasPaymentResponse> => {
  const response = await requestAsaas(() =>
    createClient().post<AsaasPaymentResponse>("/payments", data)
  );
  return response.data;
};

export const getAsaasPixQrCode = async (
  paymentId: string
): Promise<AsaasPixQrCodeResponse> => {
  const response = await requestAsaas(() =>
    createClient().get<AsaasPixQrCodeResponse>(
      `/payments/${paymentId}/pixQrCode`
    )
  );
  return response.data;
};

export const getAsaasPayment = async (
  paymentId: string
): Promise<AsaasPaymentResponse> => {
  const response = await requestAsaas(() =>
    createClient().get<AsaasPaymentResponse>(`/payments/${paymentId}`)
  );
  return response.data;
};
