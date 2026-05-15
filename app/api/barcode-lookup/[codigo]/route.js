import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const { codigo } = await params;

  if (!codigo || !/^\d{8,14}$/.test(codigo)) {
    return NextResponse.json({ error: "Código inválido" }, { status: 400 });
  }

  try {
    // Open Food Facts — gratuita, sem token, boa cobertura de alimentos/bebidas
    const apiRes = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${codigo}.json`,
      {
        headers: { "User-Agent": "PrimeiraParada/1.0 (restaurant management app)" },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!apiRes.ok) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    const json = await apiRes.json();

    if (json.status !== 1 || !json.product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    const p = json.product;

    // Prioridade: nome em pt, depois nome genérico, depois nome em en
    const nome =
      p.product_name_pt ||
      p.product_name ||
      p.product_name_en ||
      p.abbreviated_product_name ||
      null;

    // URL da imagem — prioriza pt, depois frente, depois qualquer
    const imgUrl =
      p.image_front_url ||
      p.image_url ||
      p.image_front_small_url ||
      null;

    let imagemBase64 = null;

    if (imgUrl) {
      try {
        const imgRes = await fetch(imgUrl, {
          signal: AbortSignal.timeout(6000),
        });
        if (imgRes.ok) {
          const contentType = imgRes.headers.get("content-type") || "image/jpeg";
          const buffer = await imgRes.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          imagemBase64 = `data:${contentType};base64,${base64}`;
        }
      } catch {
        // falhou ao baixar imagem mas nome pode estar ok
      }
    }

    if (!nome && !imagemBase64) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ nome, imagem: imagemBase64 });
  } catch (err) {
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      return NextResponse.json({ error: "Timeout ao consultar base de produtos" }, { status: 504 });
    }
    return NextResponse.json({ error: "Erro ao consultar base de produtos" }, { status: 500 });
  }
}
