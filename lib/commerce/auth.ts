import { NextRequest } from 'next/server';

/**
 * Validates COMMERCE_API_KEY from request headers
 * Header name: x-commerce-api-key
 * Returns true if valid, false otherwise
 */
export function validateCommerceKey(req: NextRequest): boolean {
  const authHeader = req.headers.get('x-commerce-api-key');
  const validKey = process.env.COMMERCE_API_KEY;

  if (!authHeader || !validKey) {
    return false;
  }

  return authHeader === validKey;
}
