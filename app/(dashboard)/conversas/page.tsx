import { MessageCircle } from "lucide-react";
import {
  ConversasAdmin,
  type ConversaResumo,
} from "@/components/chat/conversas-admin";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = { title: "Conversas" };

export default async function ConversasPage() {
  // Primeira carga no servidor; depois o componente mantém tudo por polling.
  const threads = await db.chatThread.findMany({
    orderBy: [{ status: "asc" }, { lastMessageAt: "desc" }], // ABERTO primeiro
    include: {
      messages: { orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 1 },
      _count: {
        select: {
          messages: { where: { from: "CLIENTE", readByTeam: false } },
        },
      },
    },
    take: 200,
  });

  const conversas: ConversaResumo[] = threads.map((t) => ({
    id: t.id,
    nome: t.name,
    phone: t.phone,
    status: t.status === "ENCERRADO" ? "ENCERRADO" : "ABERTO",
    lastMessageAt: t.lastMessageAt.toISOString(),
    naoLidas: t._count.messages,
    ultimaPrevia: t.messages[0]?.text.slice(0, 80) ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-3 font-display text-4xl font-bold text-stone-900">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-gold-400 text-gold-950">
            <MessageCircle className="size-7" />
          </span>
          Conversas
        </h1>
        <p className="mt-2 text-lg text-stone-600">
          Bate-papo do site: os clientes escrevem pelo botão dourado e você
          responde aqui, na hora.
        </p>
      </div>
      <ConversasAdmin conversasIniciais={conversas} />
    </div>
  );
}
