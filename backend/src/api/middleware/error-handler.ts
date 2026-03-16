import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export async function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler(
    (error: FastifyError, _request: FastifyRequest, reply: FastifyReply) => {
      const statusCode = error.statusCode ?? 500;
      const code = error.code ?? "internal_error";

      // Basic structured logging hook
      app.log.error({ err: error }, "request failed");

      const message =
        statusCode >= 500
          ? "An unexpected error occurred. Please try again later."
          : error.message;

      void reply.status(statusCode).send({
        code,
        message
      });
    }
  );
}

