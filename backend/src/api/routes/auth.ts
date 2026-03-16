import type { FastifyInstance } from "fastify";
import { register, login, AuthServiceError } from "../../services/auth-service.js";

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post<{
    Body: { email: string; password: string; name: string };
  }>("/api/v1/auth/register", async (request, reply) => {
    const { email, password, name } = request.body ?? {};
    if (!email || !password || !name) {
      return reply.status(400).send({
        code: "invalid_request",
        message: "email, password, and name are required."
      });
    }
    try {
      const result = await register({ email, password, name });
      return reply.status(201).send(result);
    } catch (error) {
      if (error instanceof AuthServiceError) {
        const status = error.code === "EMAIL_TAKEN" ? 409 : 400;
        return reply.status(status).send({ code: error.code, message: error.message });
      }
      throw error;
    }
  });

  app.post<{
    Body: { email: string; password: string };
  }>("/api/v1/auth/login", async (request, reply) => {
    const { email, password } = request.body ?? {};
    if (!email || !password) {
      return reply.status(400).send({
        code: "invalid_request",
        message: "email and password are required."
      });
    }
    try {
      const result = await login({ email, password });
      return reply.send(result);
    } catch (error) {
      if (error instanceof AuthServiceError) {
        return reply.status(401).send({ code: error.code, message: error.message });
      }
      throw error;
    }
  });
}
