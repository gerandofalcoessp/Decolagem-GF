// Vercel serverless function entry point
import { VercelRequest, VercelResponse } from '@vercel/node';
import '../backend/src/server';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // This will be handled by the Express app
  return;
}