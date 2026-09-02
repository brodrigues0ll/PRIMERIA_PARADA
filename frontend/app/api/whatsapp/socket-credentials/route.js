import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return new Response(null, { status: 401 })

  const base = process.env.NEXT_PUBLIC_WA_URL ?? "http://localhost:3099"
  const token = process.env.WA_API_KEY ?? ""

  // OpenWA expõe Socket.IO no namespace /events
  return Response.json({ url: `${base}/events`, token })
}
