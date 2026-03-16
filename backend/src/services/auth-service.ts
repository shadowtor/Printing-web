import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { getCustomerByEmail, createCustomer } from "../models/customer.js";

const scryptAsync = promisify(scrypt);

const SALT_LEN = 16;
const KEY_LEN = 64;

export class AuthServiceError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = "AuthServiceError";
  }
}

/**
 * Hash a password with salt using scrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LEN).toString("hex");
  const key = (await scryptAsync(password, salt, KEY_LEN)) as Buffer;
  return `${salt}:${key.toString("hex")}`;
}

/**
 * Verify password against stored hash (salt:key hex).
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, keyHex] = stored.split(":");
  if (!salt || !keyHex) return false;
  const key = (await scryptAsync(password, salt, KEY_LEN)) as Buffer;
  const keyStored = Buffer.from(keyHex, "hex");
  if (key.length !== keyStored.length) return false;
  return timingSafeEqual(key, keyStored);
}

/**
 * Simple token format for customer auth: "customer:<id>".
 * In production replace with JWT or session store.
 */
export function formatCustomerToken(customerId: string): string {
  return `customer:${customerId}`;
}

export function parseCustomerToken(token: string): string | null {
  if (token.startsWith("customer:")) {
    return token.slice("customer:".length) || null;
  }
  return null;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LEN = 8;

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  customerId: string;
  email: string;
  name: string;
  token: string;
}

/**
 * Register a new customer. Throws AuthServiceError if email exists or validation fails.
 */
export async function register(input: RegisterInput): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    throw new AuthServiceError("Invalid email format", "INVALID_EMAIL");
  }
  if (input.password.length < MIN_PASSWORD_LEN) {
    throw new AuthServiceError(
      `Password must be at least ${MIN_PASSWORD_LEN} characters`,
      "WEAK_PASSWORD"
    );
  }
  if (!input.name.trim()) {
    throw new AuthServiceError("Name is required", "INVALID_NAME");
  }

  const existing = await getCustomerByEmail(email);
  if (existing) {
    throw new AuthServiceError("Email already registered", "EMAIL_TAKEN");
  }

  const hashed = await hashPassword(input.password);
  const customer = await createCustomer({
    email,
    password: hashed,
    name: input.name.trim()
  });

  return {
    customerId: customer.id,
    email: customer.email,
    name: customer.name,
    token: formatCustomerToken(customer.id)
  };
}

/**
 * Login: verify credentials and return customer + token.
 */
export async function login(input: LoginInput): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  const customer = await getCustomerByEmail(email);
  if (!customer) {
    throw new AuthServiceError("Invalid email or password", "INVALID_CREDENTIALS");
  }
  const ok = await verifyPassword(input.password, customer.password);
  if (!ok) {
    throw new AuthServiceError("Invalid email or password", "INVALID_CREDENTIALS");
  }
  return {
    customerId: customer.id,
    email: customer.email,
    name: customer.name,
    token: formatCustomerToken(customer.id)
  };
}
