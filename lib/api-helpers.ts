import { NextResponse } from "next/server";

export function jsonError(
  message: string,
  status = 400,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export async function readJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/** Primeira mensagem legível de um erro do zod (já vêm em pt-BR dos schemas). */
export function firstZodMessage(error: {
  issues: Array<{ message: string }>;
}): string {
  return error.issues[0]?.message ?? "Dados inválidos";
}
