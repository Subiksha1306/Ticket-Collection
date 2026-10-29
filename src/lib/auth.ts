import { cache } from 'react';
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export const getSession = cache(async () => {
  try {
    return await getServerSession(authOptions)
  } catch (error) {
    console.error("Session retrieval error (likely invalid old cookie):", error);
    return null;
  }
});

export const ADMIN_EMAILS = [
  'arun@techxle.com',
  'subiksha@techxle.com',
  'ramesh@techxle.com'
];

export function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
