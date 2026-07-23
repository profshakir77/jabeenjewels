// Vercel serverless entry — imports the pre-built Express app (no listen call).
// esbuild compiles this during the Vercel build step, so @vercel/node
// just runs plain JS with no TypeScript or ESM/CJS confusion.
export { default } from '../artifacts/api-server/dist/app.mjs';
