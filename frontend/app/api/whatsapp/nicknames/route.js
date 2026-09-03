import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import WaContactNickname from "@/lib/models/WaContactNickname";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  await connectDB();
  const list = await WaContactNickname.find({}).select("jid name -_id").lean();
  return NextResponse.json(list);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  await connectDB();
  const { jid, name } = await request.json();
  if (!jid || !name?.trim()) return NextResponse.json({ error: "jid e name são obrigatórios" }, { status: 400 });
  const doc = await WaContactNickname.findOneAndUpdate(
    { jid },
    { jid, name: name.trim() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return NextResponse.json({ jid: doc.jid, name: doc.name });
}
