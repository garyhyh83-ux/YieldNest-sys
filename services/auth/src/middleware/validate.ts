import type { FastifyRequest, FastifyReply } from "fastify";
import type { ZodSchema } from "zod";

export function validate(schema: ZodSchema, source: "body" | "query" | "params" = "body") {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const data = request[source];
    const result = schema.safeParse(data);
    if (!result.success) {
      reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: result.error.flatten(),
        },
      });
    }
  };
}
