import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    return NextResponse.json(
      { detail: "URL da API nao configurada no ambiente." },
      { status: 500 },
    );
  }

  const payload = await request.json().catch(() => null);

  if (!payload) {
    return NextResponse.json(
      { detail: "Corpo da requisicao invalido." },
      { status: 400 },
    );
  }

  const cleanApiUrl = apiUrl.replace(/\/$/, "");

  try {
    const backendResponse = await fetch(`${cleanApiUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await backendResponse.json().catch(() => null);

    if (!backendResponse.ok) {
      return NextResponse.json(
        data ?? { detail: "Nao foi possivel concluir o cadastro." },
        { status: backendResponse.status },
      );
    }

    return NextResponse.json(data ?? { message: "Conta criada com sucesso." }, { status: backendResponse.status });
  } catch {
    return NextResponse.json(
      { detail: "Erro ao conectar com o servidor." },
      { status: 502 },
    );
  }
}
