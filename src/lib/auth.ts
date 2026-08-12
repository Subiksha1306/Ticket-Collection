import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function getSession() {
  try {
    return await getServerSession(authOptions)
  } catch (error) {
    console.error("Session retrieval error (likely invalid old cookie):", error);
    return null;
  }
}
