import prisma from "../db/client.js";
import type { PaymentMethodConfig } from "../../prisma/generated/prisma/client/client.js";

export type { PaymentMethodConfig };

export type PaymentMethod = "stripe" | "paypal" | "cash" | "invoice" | "po" | "quote_request";

export interface PaymentMethodConfigUpdateInput {
  enabled?: boolean;
  sortOrder?: number;
  configJson?: object | null;
}

/**
 * List all payment method configs, ordered by sortOrder.
 */
export async function listPaymentMethodConfigs(): Promise<PaymentMethodConfig[]> {
  return prisma.paymentMethodConfig.findMany({
    orderBy: { sortOrder: "asc" }
  });
}

/**
 * List only enabled payment methods (for checkout).
 */
export async function listEnabledPaymentMethods(): Promise<PaymentMethodConfig[]> {
  return prisma.paymentMethodConfig.findMany({
    where: { enabled: true },
    orderBy: { sortOrder: "asc" }
  });
}

/**
 * Get config by method name.
 */
export async function getPaymentMethodConfigByMethod(
  method: string
): Promise<PaymentMethodConfig | null> {
  return prisma.paymentMethodConfig.findUnique({
    where: { method }
  });
}

/**
 * Update payment method config (e.g. enable/disable).
 */
export async function updatePaymentMethodConfig(
  id: string,
  data: PaymentMethodConfigUpdateInput
): Promise<PaymentMethodConfig> {
  return prisma.paymentMethodConfig.update({
    where: { id },
    data: {
      ...data,
      configJson: data.configJson === undefined ? undefined : (data.configJson as object)
    }
  });
}

/**
 * Upsert by method name (for admin or seed).
 */
export async function upsertPaymentMethodConfig(params: {
  method: string;
  enabled?: boolean;
  sortOrder?: number;
  configJson?: object | null;
}): Promise<PaymentMethodConfig> {
  return prisma.paymentMethodConfig.upsert({
    where: { method: params.method },
    create: {
      method: params.method,
      enabled: params.enabled ?? false,
      sortOrder: params.sortOrder ?? 0,
      configJson: (params.configJson ?? undefined) as object | undefined
    },
    update: {
      enabled: params.enabled,
      sortOrder: params.sortOrder,
      configJson: params.configJson as object | undefined
    }
  });
}
