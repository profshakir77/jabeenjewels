// Vercel serverless entry point — re-exports the Express app.
// Vercel's @vercel/node runtime understands Express apps exported as default.
export { default } from '../artifacts/api-server/src/app';
