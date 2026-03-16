import prisma from "../db/client.js";
import type { Customer } from "../../prisma/generated/prisma/client/client.js";

export type { Customer };

export interface CustomerCreateInput {
  email: string;
  password: string;
  name: string;
}

/**
 * Get customer by ID.
 */
export async function getCustomerById(id: string): Promise<Customer | null> {
  return prisma.customer.findUnique({
    where: { id }
  });
}

/**
 * Get customer by email.
 */
export async function getCustomerByEmail(email: string): Promise<Customer | null> {
  return prisma.customer.findUnique({
    where: { email: email.toLowerCase() }
  });
}

/**
 * Create a customer (password must be already hashed by caller).
 */
export async function createCustomer(data: {
  email: string;
  password: string;
  name: string;
}): Promise<Customer> {
  return prisma.customer.create({
    data: {
      email: data.email.toLowerCase(),
      password: data.password,
      name: data.name
    }
  });
}
