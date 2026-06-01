import axios, { AxiosInstance } from "axios";
import AppError from "../../errors/AppError";

interface CustomerInput {
  name: string;
  email: string;
  externalReference: string;
}

interface CustomerResponse {
  id: string;
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
  });
};

export const createAsaasCustomer = async (
  data: CustomerInput
): Promise<CustomerResponse> => {
  const response = await createClient().post<CustomerResponse>(
    "/customers",
    data
  );
  return response.data;
};

export const createAsaasPayment = async (
  data: PaymentInput
): Promise<AsaasPaymentResponse> => {
  const response = await createClient().post<AsaasPaymentResponse>(
    "/payments",
    data
  );
  return response.data;
};

export const getAsaasPixQrCode = async (
  paymentId: string
): Promise<AsaasPixQrCodeResponse> => {
  const response = await createClient().get<AsaasPixQrCodeResponse>(
    `/payments/${paymentId}/pixQrCode`
  );
  return response.data;
};

export const getAsaasPayment = async (
  paymentId: string
): Promise<AsaasPaymentResponse> => {
  const response = await createClient().get<AsaasPaymentResponse>(
    `/payments/${paymentId}`
  );
  return response.data;
};
