# CareerOS Backend Rules

## Architecture
Follow:
Routes → Controller → Service → Database/External Services

- Routes: endpoints + middleware only.
- Controllers: request/response handling only.
- Services: business logic.
- Utils: shared reusable logic.

## Authentication
- Use Clerk for authentication.
- Never trust userId from request body.
- Get userId from Clerk JWT using getAuth(req).
- Verify resource ownership before reading/updating/deleting.

## Validation & Errors
- Validate all required input and files.
- Use `throw new AppError(message, statusCode)`.
- Use CatchAsync for controllers.
- Don't duplicate error-handling logic.
- Warp the logic in try-catch and always use AppError for error handling.

## Files
For file operations:
- Validate before upload.
- If database operation fails after upload, delete the uploaded file.
- Prevent orphan files.
- Keep file-related functions focused: one function should have one responsibility/purpose.

## Database
- Use Prisma in services.
- Use transactions for multi-step database operations when necessary.
- Use reusable utilities for repeated logic.

## API
Use REST conventions and consistent responses:

{
  success: true,
  message: "...",
  data: {}
}