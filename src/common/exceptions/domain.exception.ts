import { GraphQLError } from "graphql";
import { ApplicationException } from "./application.exception";

export const MapGraphQLError = (error: ApplicationException) => {
  throw new GraphQLError(error.message || "internal server error", {
    extensions: {
      statusCode: error.statusCode,
    },
  });
};

export class BadRequestException extends ApplicationException {
  constructor(message: string = "BadRequest", cause?: unknown) {
    super(message, 400, { cause });
  }
}

export class ConflictException extends ApplicationException {
  constructor(message: string = "Conflict", cause?: unknown) {
    super(message, 409, { cause });
  }
}

export class NotFoundException extends ApplicationException {
  constructor(message: string = "NotFound", cause?: unknown) {
    super(message, 404, { cause });
  }
}

export class UnauthorizedException extends ApplicationException {
  constructor(message: string = "Unauthorized", cause?: unknown) {
    super(message, 401, { cause });
  }
}

export class ForbiddenException extends ApplicationException {
  constructor(message: string = "Forbidden", cause?: unknown) {
    super(message, 403, { cause });
  }
}
