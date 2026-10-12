import Link from "next/link";
import { notFound } from "next/navigation";
import { MeusMatches, type MatchItem } from "@/components/permutas/meus-matches";
import { SwipeDeck } from "@/components/permutas/swipe-deck";
import { Tabs } from "@/components/ui/tabs";
import { objetivoDoImovel, PROPERTY_TYPE_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { getLeadByToken } from "@/lib/permutas/auth";
import { toPublicProperty } from "@/lib/permutas/public-dto";

export const dynamic = "force-dynamic";

export const metadata = { robots: { index: false, follow: false }, title: "Meu painel" };

function StatusBanner({
  status,
  rejectionReason,
}: {
  status: string;
  rejectionReason: string | null;
}) {
  if (status === "EM_APROVACAO") {
    return (
      <p className="rounded-2xl bg-amber-50 px-5 py-4 text-base font-semibold text-amber-900">
        ⏳ Seu imóvel está <strong>em análise</strong> pela nossa equipe. Assim
        que for aprovado, ele aparece para os outros clientes — mas você já pode
        explorar e curtir imóveis agora mesmo!
      </p>
    );
  }
  if (status === "ATIVO") {
    return (
      <p className="rounded-2xl border-2 border-brand-200 bg-brand-100 px-5 py-4 text-base font-semibold text-brand-900">
        ✅ Seu imóvel foi <strong>aprovado</strong> e já aparece para outros
        clientes interessados em permuta.
      </p>
    );
  }
  if (status === "REPROVADO") {
    return (
      <div className="rounded-2xl bg-red-50 px-5 py-4 text-base text-red-900">
        <p className="font-semibold">
          ✋ Seu cadastro precisa de ajustes antes de ser publicado.
        </p>
        {rejectionReason && <p className="mt-1">Motivo: {rejectionReason}</p>}
        <p className="mt-1">
          Fale com a nossa equipe que a gente resolve junto!
        </p>
      </div>
    );
  }
  if (status === "DESATIVADO") {
    return (
      <p className="rounded-2xl bg-stone-100 px-5 py-4 text-base font-semibold text-stone-700">
        ⏸️ Seu imóvel está <strong>fora do ar</strong> no momento e não aparece
        para os outros clientes. Fale com a nossa equipe para publicar de novo.
      </p>
    );
  }
  return null;
}

/** Cartão de status para quem quer VENDER ou ALUGAR (não usa o deck). */
function StatusCardAvaliacao({
  status,
  objetivo,
  rejectionReason,
}: {
  status: string;
  objetivo: "VENDER" | "ALUGAR";
  rejectionReason: string | null;
}) {
  const anuncio = objetivo === "ALUGAR" ? "anúncio de locação" : "anúncio de venda";

  if (status === "EM_APROVACAO") {
    return (
      <div className="rounded-3xl border-2 border-amber-200 bg-amber-50 p-7 text-center">
        <p className="text-5xl">⏳</p>
        <h2 className="mt-3 text-2xl font-extrabold text-amber-950">
          Recebemos o seu imóvel!
        </h2>
        <p className="mx-auto mt-2 max-w-md text-lg text-amber-900">
          Nossa equipe está avaliando o cadastro e vai te chamar no WhatsApp
          para combinar os próximos passos. Não precisa fazer mais nada por
          enquanto.
        </p>
      </div>
    );
  }
  if (status === "ATIVO") {
    return (
      <div className="rounded-3xl border-2 border-brand-200 bg-brand-50 p-7 text-center">
        <p className="text-5xl">✅</p>
        <h2 className="mt-3 text-2xl font-extrabold text-brand-950">
          Aprovado!
        </h2>
        <p className="mx-auto mt-2 max-w-md text-lg text-brand-900">
          Nossa equipe está cuidando do seu {anuncio} e entra em contato pelo
          WhatsApp a cada novidade.
        </p>
      </div>
    );
  }
  if (status === "REPROVADO") {
    return (
      <div className="rounded-3xl border-2 border-red-200 bg-red-50 p-7 text-center">
        <p className="text-5xl">✋</p>
        <h2 className="mt-3 text-2xl font-extrabold text-red-950">
          Seu cadastro precisa de ajustes
        </h2>
        {rejectionReason && (
          <p className="mx-auto mt-2 max-w-md text-lg text-red-900">
            Motivo: {rejectionReason}
          </p>
        )}
        <p className="mx-auto mt-2 max-w-md text-lg text-red-900">
          Fale com a nossa equipe que a gente resolve junto!
        </p>
      </div>
    );
  }
  if (status === "DESATIVADO") {
    return (
      <div className="rounded-3xl border-2 border-stone-200 bg-stone-100 p-7 text-center">
        <p className="text-5xl">⏸️</p>
        <h2 className="mt-3 text-2xl font-extrabold text-stone-800">
          Cadastro pausado
        </h2>
        <p className="mx-auto mt-2 max-w-md text-lg text-stone-600">
          Seu cadastro está pausado no momento. Fale com a nossa equipe para
          retomar.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-3xl border-2 border-stone-200 bg-white p-7 text-center">
      <p className="text-5xl">🏡</p>
      <h2 className="mt-3 text-2xl font-extrabold text-stone-900">
        Cadastro recebido
      </h2>
      <p className="mx-auto mt-2 max-w-md text-lg text-stone-600">
        Nossa equipe está cuidando do seu imóvel. Qualquer novidade, falamos
        com você pelo WhatsApp.
      </p>
    </div>
  );
}

export default async function PainelLeadPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ aba?: string }>;
}) {
  const { token } = await params;
  const { aba } = await searchParams;
  const lead = await getLeadByToken(token);
  if (!lead) notFound();
  const property = lead.properties[0];
  // Cadastro excluído pela equipe: tela amigável em vez de erro 404.
  if (!property) {
    return (
      <div className="mx-auto max-w-xl space-y-5 rounded-3xl border-2 border-stone-200 bg-white p-8 text-center">
        <p className="text-5xl">🏡</p>
        <h1 className="text-2xl font-extrabold text-stone-900">
          Olá, {lead.name.split(" ")[0]}!
        </h1>
        <p className="text-lg text-stone-600">
          O cadastro do seu imóvel foi <strong>removido</strong>. Se foi um
          engano ou se quiser participar de novo, é só cadastrar outra vez —
          leva poucos minutos.
        </p>
        <Link
          href="/permutas/cadastrar"
          className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-brand-700 px-8 text-lg font-extrabold text-white hover:bg-brand-800"
        >
          Cadastrar meu imóvel de novo
        </Link>
      </div>
    );
  }

  const objetivo = objetivoDoImovel({
    purpose: property.purpose,
    acceptsTrade: property.acceptsTrade,
  });

  const header = (
    <div>
      <h1 className="font-display text-3xl font-bold text-stone-900 sm:text-4xl">
        Olá, {lead.name.split(" ")[0]}! 👋
      </h1>
      <p className="mt-1 text-base text-stone-500">
        Seu imóvel:{" "}
        <strong className="text-stone-700">
          {property.propertyType
            ? PROPERTY_TYPE_LABELS[property.propertyType]
            : "Imóvel"}
          {property.neighborhood ? ` · ${property.neighborhood}` : ""} ·{" "}
          {property.city}
        </strong>{" "}
        (ref. {property.refCode})
      </p>
    </div>
  );

  // Venda ou locação: sem deck/matches — só o acompanhamento do cadastro.
  if (objetivo !== "PERMUTAR") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        {header}
        <StatusCardAvaliacao
          status={property.status}
          objetivo={objetivo}
          rejectionReason={property.rejectionReason}
        />
        <p className="rounded-2xl border border-stone-200 bg-white px-5 py-4 text-base text-stone-600">
          💡 Guarde este link: é por ele que você acompanha o andamento do seu
          cadastro, de qualquer aparelho.
        </p>
      </div>
    );
  }

  const matches = await db.tradeMatch.findMany({
    where: {
      OR: [{ propertyAId: property.id }, { propertyBId: property.id }],
      status: { not: "CANCELADO" },
    },
    include: {
      propertyA: { include: { photos: { orderBy: { position: "asc" } } } },
      propertyB: { include: { photos: { orderBy: { position: "asc" } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const matchItems: MatchItem[] = matches.map((m) => {
    const isA = m.propertyAId === property.id;
    const other = isA ? m.propertyB : m.propertyA;
    return {
      id: m.id,
      createdAt: m.createdAt.toISOString(),
      seen: isA ? m.seenByA : m.seenByB,
      property: toPublicProperty(other),
    };
  });
  const unseenCount = matchItems.filter((m) => !m.seen).length;

  const active = aba === "matches" ? "matches" : "explorar";
  const base = `/permutas/painel/${token}`;

  return (
    <div className="space-y-6">
      {header}

      <StatusBanner
        status={property.status}
        rejectionReason={property.rejectionReason}
      />

      <Tabs
        items={[
          { value: "explorar", label: "🔑 Explorar imóveis", href: `${base}?aba=explorar` },
          {
            value: "matches",
            label: "Meus matches",
            href: `${base}?aba=matches`,
            count: unseenCount > 0 ? unseenCount : matchItems.length,
          },
        ]}
        active={active}
      />

      {active === "explorar" ? (
        <SwipeDeck
          token={token}
          defaults={{
            name: lead.name,
            email: lead.email ?? "",
            phone: lead.whatsapp,
          }}
        />
      ) : (
        <MeusMatches matches={matchItems} token={token} />
      )}
    </div>
  );
}
