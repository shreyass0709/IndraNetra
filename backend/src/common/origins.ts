// Browser origins allowed to send the session cookie, for both HTTP (main.ts)
// and the Socket.IO gateway. FRONTEND_URL is added on top of the local dev
// origins so a deployed frontend works too. A function, not a constant, so it
// reads FRONTEND_URL after ConfigModule has loaded .env.
export function allowedOrigins(): string[] {
  const origins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
  ];
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL);
  }
  return origins;
}
