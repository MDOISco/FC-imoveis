"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  CalendarCheck2,
  CalendarDays,
  Camera,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import type { DiaDeSlots } from "@/lib/agenda/slots";
import { formatarDataHoraSP } from "@/lib/agenda/slots";
import { apiFetch, ApiError } from "@/lib/client-api";
import { cn } from "@/lib/cn";
import { maskPhone, onlyDigits } from "@/lib/format";

type ImovelResumo = {
  id: string;
  refCode: string;
  typeLabel: string;
  title: string;
  location: string;
  valueLabel: string;
  fotoUrl: string | null;
};

type SlotsResponse = {
  dias: DiaDeSlots[];
  corretor: string | null;
  imovel: ImovelResumo | null;
};

type Sucesso = {
  cancelToken: string;
  resumo: { quando: string; titulo: string; corretor: string | null };
};

function Passo({ numero, titulo }: { numero: number; titulo: string }) {
  return (
    <h2 className="flex items-center gap-3 text-xl font-bold text-stone-900">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-700 text-base font-bold text-white">
        {numero}
      </span>
      {titulo}
    </h2>
  );
}

/** Página pública de agendamento: dia -> horário -> dados -> confirmação. */
export function AgendarForm({ imovelId }: { imovelId: string | null }) {
  const [imovelAtual, setImovelAtual] = useState<string | null>(imovelId);
  const [tick, setTick] = useState(0);

  const [dados, setDados] = useState<SlotsResponse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [avisoImovel, setAvisoImovel] = useState<string | null>(null);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const [diaSel, setDiaSel] = useState<string | null>(null);
  const [inicioSel, setInicioSel] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [erroForm, setErroForm] = useState<string | null>(null);

  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState<Sucesso | null>(null);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErroGeral(null);
    setDados(null);
    setDiaSel(null);
    setInicioSel(null);
    (async () => {
      try {
        const url = imovelAtual
          ? `/api/agenda/slots?imovel=${encodeURIComponent(imovelAtual)}`
          : "/api/agenda/slots";
        const res = await apiFetch<SlotsResponse>(url);
        if (!ativo) return;
        setDados(res);
      } catch (e) {
        if (!ativo) return;
        if (imovelAtual) {
          // Imóvel saiu do ar: segue como atendimento na imobiliária.
          setAvisoImovel(
            e instanceof ApiError
              ? e.message
              : "Não foi possível carregar este imóvel.",
          );
          setImovelAtual(null);
        } else {
          setErroGeral(
            "Não foi possível carregar os horários. Tente de novo em instantes.",
          );
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [imovelAtual, tick]);

  async function enviar() {
    if (!inicioSel) return;
    if (nome.trim().length < 2) {
      setErroForm("Escreva o seu nome.");
      return;
    }
    const d = onlyDigits(whatsapp);
    if (d.length < 10 || d.length > 11) {
      setErroForm("Informe o seu WhatsApp com DDD (ex.: (11) 99999-0000).");
      return;
    }
    setErroForm(null);
    setEnviando(true);
    try {
      const res = await apiFetch<{ cancelToken: string; resumo: Sucesso["resumo"] }>(
        "/api/agenda/agendamentos",
        {
          method: "POST",
          body: {
            imovelId: imovelAtual ?? undefined,
            inicioISO: inicioSel,
            nome,
            whatsapp,
            email: email || undefined,
          },
        },
      );
      setSucesso({ cancelToken: res.cancelToken, resumo: res.resumo });
      window.scrollTo({ top: 0 });
    } catch (e) {
      toast(
        e instanceof ApiError ? e.message : "Não foi possível agendar.",
        "erro",
      );
      // Horário pode ter sido ocupado: recarrega a grade.
      setTick((t) => t + 1);
    } finally {
      setEnviando(false);
    }
  }

  /* ------------------------------ tela de sucesso ----------------------------- */
  if (sucesso) {
    return (
      <div className="mx-auto max-w-lg space-y-5 rounded-3xl border border-stone-200 bg-white p-6 text-center sm:p-8">
        <CalendarCheck2 className="mx-auto size-14 text-brand-700" />
        <h1 className="text-2xl font-extrabold text-stone-900">
          Visita agendada!
        </h1>
        <p className="text-lg text-stone-700">
          {sucesso.resumo.titulo} —{" "}
          <strong className="text-stone-900">{sucesso.resumo.quando}</strong>
          {sucesso.resumo.corretor && (
            <>
              , com <strong>{sucesso.resumo.corretor}</strong>
            </>
          )}
          .
        </p>
        <p className="text-base text-stone-600">
          Nossa equipe pode falar com você pelo WhatsApp para combinar os
          detalhes e o ponto de encontro.
        </p>
        <a
          href={`/api/agenda/ics/${sucesso.cancelToken}`}
          className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gold-400 px-6 text-lg font-extrabold text-gold-950 shadow-sm transition-colors hover:bg-gold-300"
        >
          📅 Baixar lembrete para meu calendário
        </a>
        <Link
          href={`/agendar/cancelar/${sucesso.cancelToken}`}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border-2 border-stone-300 bg-white px-5 font-semibold text-stone-700 hover:border-brand-600"
        >
          Precisa desmarcar? Cancele por aqui
        </Link>
        <p className="text-sm text-stone-500">
          Guarde o lembrete ou o link de cancelamento: eles são só seus.
        </p>
      </div>
    );
  }

  /* --------------------------------- carregando -------------------------------- */
  if (carregando) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-stone-600">
        <Spinner className="size-10" />
        <p className="text-lg">Carregando os horários…</p>
      </div>
    );
  }

  if (erroGeral || !dados) {
    return (
      <div className="mx-auto max-w-lg space-y-5 rounded-3xl border border-stone-200 bg-white p-7 text-center">
        <p className="text-lg text-stone-700">
          {erroGeral ?? "Não foi possível carregar os horários."}
        </p>
        <Button size="lg" onClick={() => setTick((t) => t + 1)}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  const diasDisponiveis = dados.dias.filter((dia) =>
    dia.slots.some((s) => s.disponivel),
  );
  const diaAberto = dados.dias.find((dia) => dia.chave === diaSel) ?? null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-stone-900 sm:text-4xl">
          Agendar visita
        </h1>
        <p className="mt-1 text-base text-stone-500">
          Escolha o dia e o horário — é rápido e sem compromisso.
        </p>
      </div>

      {avisoImovel && (
        <p
          role="alert"
          className="rounded-2xl bg-gold-100 px-5 py-4 text-base font-semibold text-gold-900"
        >
          {avisoImovel} Você pode agendar um atendimento na imobiliária, ou
          escolher outro imóvel na vitrine.
        </p>
      )}

      {/* Contexto: imóvel escolhido ou atendimento na imobiliária */}
      {dados.imovel ? (
        <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white">
          <div className="flex gap-4 p-4">
            {dados.imovel.fotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={dados.imovel.fotoUrl}
                alt={dados.imovel.title}
                className="aspect-[4/3] w-28 shrink-0 rounded-xl object-cover sm:w-36"
              />
            ) : (
              <div className="flex aspect-[4/3] w-28 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-400 sm:w-36">
                <Camera className="size-8" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-gold-700">
                {dados.imovel.refCode} · {dados.imovel.typeLabel}
              </p>
              <h2 className="text-lg font-bold leading-snug text-stone-900">
                {dados.imovel.title}
              </h2>
              <p className="text-base text-stone-600">
                📍 {dados.imovel.location}
              </p>
              <p className="font-display text-xl font-bold text-brand-900">
                {dados.imovel.valueLabel}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setImovelAtual(null)}
            className="flex min-h-12 w-full items-center justify-center gap-2 border-t border-stone-200 bg-stone-50 px-4 text-base font-semibold text-brand-800 hover:bg-brand-50"
          >
            <Building2 className="size-5" /> Quero um atendimento na
            imobiliária, sem imóvel específico
          </button>
        </div>
      ) : (
        <div className="rounded-3xl border border-stone-200 bg-white p-5">
          <p className="flex items-center gap-2 text-lg font-bold text-stone-900">
            <Building2 className="size-6 text-brand-700" /> Atendimento na
            imobiliária
          </p>
          <p className="mt-1 text-base text-stone-600">
            Você conversa com a nossa equipe pessoalmente. Se preferir visitar
            um imóvel específico, escolha-o na{" "}
            <Link href="/site" className="font-semibold text-brand-700 underline">
              vitrine do site
            </Link>{" "}
            e toque em “Agendar visita”.
          </p>
        </div>
      )}

      <div className="space-y-7 rounded-3xl border border-stone-200 bg-white p-5 sm:p-7">
        {/* Passo 1 — dia */}
        <div className="space-y-4">
          <Passo numero={1} titulo="Escolha o dia" />
          {diasDisponiveis.length === 0 ? (
            <p className="rounded-2xl bg-stone-100 px-5 py-4 text-base text-stone-600">
              Nenhum horário livre nos próximos dias. Tente de novo mais tarde
              ou fale com a nossa equipe.
            </p>
          ) : (
            <div className="flex gap-2.5 overflow-x-auto pb-2">
              {diasDisponiveis.map((dia) => {
                const ativo = diaSel === dia.chave;
                return (
                  <button
                    key={dia.chave}
                    type="button"
                    onClick={() => {
                      setDiaSel(dia.chave);
                      setInicioSel(null);
                    }}
                    aria-pressed={ativo}
                    className={cn(
                      "inline-flex min-h-14 shrink-0 items-center gap-2 rounded-2xl border-2 px-5 text-lg font-bold transition-colors",
                      ativo
                        ? "border-brand-700 bg-brand-700 text-white"
                        : "border-stone-300 bg-white text-stone-800 hover:border-brand-500",
                    )}
                  >
                    <CalendarDays className="size-5" />
                    {dia.rotulo}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Passo 2 — horário */}
        {diaAberto && (
          <div className="space-y-4">
            <Passo numero={2} titulo="Escolha o horário" />
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {diaAberto.slots.map((s) => {
                const ativo = inicioSel === s.inicioISO;
                return (
                  <button
                    key={s.inicioISO}
                    type="button"
                    disabled={!s.disponivel}
                    onClick={() => setInicioSel(s.inicioISO)}
                    aria-pressed={ativo}
                    className={cn(
                      "inline-flex min-h-14 items-center justify-center gap-1.5 rounded-xl border-2 text-lg font-bold transition-colors",
                      ativo
                        ? "border-brand-700 bg-brand-700 text-white"
                        : s.disponivel
                          ? "border-stone-300 bg-white text-stone-800 hover:border-brand-500"
                          : "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400 line-through",
                    )}
                  >
                    <Clock className="size-4" />
                    {s.rotulo}
                  </button>
                );
              })}
            </div>
            <p className="text-sm text-stone-500">
              Horários riscados já estão ocupados.
            </p>
          </div>
        )}

        {/* Passo 3 — dados + confirmação */}
        {inicioSel && (
          <div className="space-y-5">
            <Passo numero={3} titulo="Seus dados" />
            <Field label="Seu nome" required htmlFor="ag-nome">
              <Input
                id="ag-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                autoComplete="name"
              />
            </Field>
            <Field
              label="Seu WhatsApp"
              required
              help="É por ele que confirmamos a visita com você."
              htmlFor="ag-whats"
            >
              <Input
                id="ag-whats"
                inputMode="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(maskPhone(e.target.value))}
                placeholder="(11) 99999-0000"
                autoComplete="tel"
              />
            </Field>
            <Field label="Seu e-mail (opcional)" htmlFor="ag-email">
              <Input
                id="ag-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </Field>

            <div className="rounded-2xl bg-brand-100 px-5 py-4 text-lg text-brand-900">
              {dados.imovel ? (
                <>
                  Visita ao <strong>{dados.imovel.typeLabel}</strong> em{" "}
                  <strong>{dados.imovel.location}</strong>
                </>
              ) : (
                <>Atendimento na imobiliária</>
              )}{" "}
              — <strong>{formatarDataHoraSP(new Date(inicioSel))}</strong>.
              {dados.corretor && (
                <>
                  {" "}
                  Quem recebe você: <strong>{dados.corretor}</strong>.
                </>
              )}
            </div>

            {erroForm && (
              <p
                role="alert"
                className="rounded-xl bg-red-50 px-4 py-3 text-base font-semibold text-red-800"
              >
                {erroForm}
              </p>
            )}

            <Button
              size="lg"
              variant="gold"
              className="w-full"
              disabled={enviando}
              onClick={enviar}
            >
              {enviando ? (
                <>
                  <Spinner className="border-gold-900/40 border-t-gold-950" />
                  Agendando…
                </>
              ) : (
                "Confirmar agendamento ✔"
              )}
            </Button>
            <p className="text-center text-sm text-stone-500">
              Por segurança, o endereço exato é combinado com a nossa equipe.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
