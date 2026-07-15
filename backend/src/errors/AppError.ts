export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: string[]
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, 'NOT_FOUND', message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(details: string[]) {
    super(422, 'VALIDATION_ERROR', 'Validation failed', details);
    this.name = 'ValidationError';
  }
}

export class InvalidTransitionError extends AppError {
  constructor(from: string, to: string) {
    super(
      422,
      'INVALID_TRANSITION',
      `Cannot move from ${from} to ${to}`,
      [from, to]
    );
    this.name = 'InvalidTransitionError';
  }
}
