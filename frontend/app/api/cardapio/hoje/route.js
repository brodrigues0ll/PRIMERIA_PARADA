import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import CardapioDoDia from "@/lib/models/CardapioDoDia";

function hoje() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

async function populateDoc(doc) {
  return doc.populate({
    path: "itens.menuItem",
    populate: { path: "categoria", select: "nome cor" },
    select: "nome preco categoria ativo",
  });
}

function filterAtivos(doc) {
  if (doc && doc.itens) {
    doc.itens = doc.itens.filter((i) => i.menuItem?.ativo !== false);
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await connectDB();

  let doc = await CardapioDoDia.findOne({ data: hoje() }).populate({
    path: "itens.menuItem",
    populate: { path: "categoria", select: "nome cor" },
    select: "nome preco categoria ativo vendavel",
  });

  if (!doc) {
    return NextResponse.json({ data: hoje(), itens: [] });
  }

  filterAtivos(doc);

  return NextResponse.json({
    data: doc.data,
    itens: doc.itens.map((i) => ({
      menuItem: {
        _id: i.menuItem._id,
        nome: i.menuItem.nome,
        preco: i.menuItem.preco,
        categoria: i.menuItem.categoria,
        vendavel: i.menuItem.vendavel,
      },
      nivel: i.nivel,
    })),
  });
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await connectDB();

  const body = await request.json();
  const itens = (body.itens ?? []).map((i) => ({
    menuItem: i.menuItemId,
    nivel: i.nivel,
  }));

  let doc = await CardapioDoDia.findOneAndUpdate(
    { data: hoje() },
    { $set: { itens } },
    { upsert: true, new: true }
  );

  doc = await doc.populate({
    path: "itens.menuItem",
    populate: { path: "categoria", select: "nome cor" },
    select: "nome preco categoria ativo",
  });

  filterAtivos(doc);

  return NextResponse.json({
    data: doc.data,
    itens: doc.itens.map((i) => ({
      menuItem: {
        _id: i.menuItem._id,
        nome: i.menuItem.nome,
        preco: i.menuItem.preco,
        categoria: i.menuItem.categoria,
      },
      nivel: i.nivel,
    })),
  });
}

export async function PATCH(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await connectDB();

  const body = await request.json();
  const { menuItemId, nivel } = body;

  if (!menuItemId)
    return NextResponse.json({ error: "menuItemId é obrigatório" }, { status: 400 });

  let doc;

  if (nivel == null) {
    // Remove item from today's itens
    doc = await CardapioDoDia.findOneAndUpdate(
      { data: hoje() },
      { $pull: { itens: { menuItem: menuItemId } } },
      { new: true, upsert: true }
    );
  } else {
    // Ensure today's doc exists first (upsert), then update or add the item
    await CardapioDoDia.findOneAndUpdate(
      { data: hoje() },
      { $setOnInsert: { itens: [] } },
      { upsert: true }
    );

    // Try to update existing entry with arrayFilters
    const updated = await CardapioDoDia.findOneAndUpdate(
      { data: hoje(), "itens.menuItem": menuItemId },
      { $set: { "itens.$[elem].nivel": nivel } },
      { arrayFilters: [{ "elem.menuItem": menuItemId }], new: true }
    );

    if (updated) {
      doc = updated;
    } else {
      // Item not in array yet — add it
      doc = await CardapioDoDia.findOneAndUpdate(
        { data: hoje() },
        { $addToSet: { itens: { menuItem: menuItemId, nivel } } },
        { new: true }
      );
    }
  }

  doc = await doc.populate({
    path: "itens.menuItem",
    populate: { path: "categoria", select: "nome cor" },
    select: "nome preco categoria ativo",
  });

  filterAtivos(doc);

  return NextResponse.json({
    data: doc.data,
    itens: doc.itens.map((i) => ({
      menuItem: {
        _id: i.menuItem._id,
        nome: i.menuItem.nome,
        preco: i.menuItem.preco,
        categoria: i.menuItem.categoria,
      },
      nivel: i.nivel,
    })),
  });
}

export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await connectDB();

  const body = await request.json();
  const { menuItemId } = body;

  if (!menuItemId)
    return NextResponse.json({ error: "menuItemId é obrigatório" }, { status: 400 });

  const doc = await CardapioDoDia.findOneAndUpdate(
    { data: hoje() },
    { $pull: { itens: { menuItem: menuItemId } } },
    { new: true }
  );

  if (!doc) return NextResponse.json({ error: "Cardápio de hoje não encontrado" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
