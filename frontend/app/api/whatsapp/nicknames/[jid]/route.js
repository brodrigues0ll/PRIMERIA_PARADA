import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import WaContactNickname from "@/lib/models/WaContactNickname";

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  await connectDB();
  const jid = decodeURIComponent(params.jid);
  await WaContactNickname.deleteOne({ jid });
  return NextResponse.json({ ok: true });
}
