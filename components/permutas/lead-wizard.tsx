"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, PartyPopper, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CheckboxField } from "@/components/ui/checkbox";
import { CopyButton } from "@/components/ui/copy-button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { NumberStepper } from "@/components/ui/number-stepper";
import { RadioCards } from "@/components/ui/radio-cards";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Stepper } from "@/components/ui/stepper";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { apiFetch, ApiError } from "@/lib/client-api";
import {
  CASH_TOPUP_OPTIONS,
  labelOf,
  LEAD_OBJETIVO_OPTIONS,
  PROPERTY_TYPES,
} from "@/lib/constants";
import { maskCep, maskPhone, onlyDigits, parseAreaInput } from "@/lib/format";
import { useViaCep } from "@/lib/hooks/use-viacep";

export type LeadObjetivo = "PERMUTAR" | "VENDER" | "ALUGAR";

const BASE_STEPS = ["Seus dados", "Seu imóvel", "Fotos", "Sua descrição"];
const TRADE_STEP = "O que procura";
const REVIEW_STEP = "Revisar e enviar";

const OBJETIVO_HELP: Record<string, string> = Object.fromEntries(
  LEAD_OBJETIVO_OPTIONS.map((o) => [o.value, o.help]),
);

const TITLES: Record<LeadObjetivo, string> = {
  PERMUTAR: "Cadastre seu imóvel para permuta",
  VENDER: "Cadastre seu imóvel para vender",
  ALUGAR: "Cadastre seu imóvel para alugar",
};

const MAX_PHOTOS = 15;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

type LocalPhoto = { file: File; url: string };

export function LeadWizard({
  initialObjetivo,
}: {
  initialObjetivo?: LeadObjetivo;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [done, setDone] = useState<{ token: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const viaCep = useViaCep();

  // Passo 1
  const [objetivo, setObjetivo] = useState<LeadObjetivo | "">(
    initialObjetivo ?? "",
  );
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  // Passo 2
  const [propertyType, setPropertyType] = useState("");
  const [cep, setCep] = useState("");
  const [city, setCity] = useState("Bragança Paulista");
  const [neighborhood, setNeighborhood] = useState("");
  const [bedrooms, setBedrooms] = useState<number | null>(null);
  const [bathrooms, setBathrooms] = useState<number | null>(null);
  const [parking, setParking] = useState<number | null>(null);
  const [usableArea, setUsableArea] = useState("");
  const [totalArea, setTotalArea] = useState("");
  const [estimatedValue, setEstimatedValue] = useState<number | null>(null);
  // Passo 3
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  // Passo 4
  const [leadDescription, setLeadDescription] = useState("");
  // Passo 5 (só permuta)
  const [wantTypes, setWantTypes] = useState<string[]>([]);
  const [wantNeighborhoods, setWantNeighborhoods] = useState("");
  const [wantMinBedrooms, setWantMinBedrooms] = useState<number | null>(null);
  const [wantMinParking, setWantMinParking] = useState<number | null>(null);
  const [wantMaxValue, setWantMaxValue] = useState<number | null>(null);
  const [cashTopUp, setCashTopUp] = useState("INDIFERENTE");
  const [notes, setNotes] = useState("");

  const isPermuta = objetivo === "PERMUTAR";
  // Sem objetivo escolhido ainda, mostramos o caminho completo (6 etapas).
  const steps =
    isPermuta || objetivo === ""
      ? [...BASE_STEPS, TRADE_STEP, REVIEW_STEP]
      : [...BASE_STEPS, REVIEW_STEP];
  const reviewStep = steps.length;

  function addPhotos(files: FileList | File[]) {
    const incoming = Array.from(files).filter((f) =>
      f.type.startsWith("image/"),
    );
    const valid: LocalPhoto[] = [];
    for (const f of incoming) {
      if (f.size > MAX_PHOTO_BYTES) {
        toast(`${f.name}: maior que 10MB, foi ignorada.`, "erro");
        continue;
      }
      valid.push({ file: f, url: URL.createObjectURL(f) });
    }
    setPhotos((prev) => [...prev, ...valid].slice(0, MAX_PHOTOS));
  }

  function validateStep(s: number): string | null {
    if (s === 1) {
      if (!objetivo)
        return "Escolha o que você quer fazer com o seu imóvel.";
      if (name.trim().length < 2) return "Escreva o seu nome.";
      const d = onlyDigits(whatsapp);
      if (d.length < 10 || d.length > 11)
        return "Informe o seu WhatsApp com DDD (ex.: (11) 99999-0000).";
    }
    if (s === 2) {
      if (!propertyType) return "Escolha o tipo do seu imóvel.";
      if (!city.trim()) return "Informe a cidade do imóvel.";
    }
    if (s === 3 && photos.length === 0) {
      return "Adicione pelo menos 1 foto do seu imóvel.";
    }
    if (s === 4 && leadDescription.trim().length < 10) {
      return "Conte um pouco sobre o seu imóvel (pelo menos uma frase).";
    }
    return null;
  }

  function next() {
    const problem = validateStep(step);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, steps.length));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    setSending("Enviando o cadastro…");
    try {
      const res = await apiFetch<{ token: string }>("/api/permutas/cadastro", {
        method: "POST",
        body: {
          objetivo,
          lead: { name, whatsapp, email },
          property: {
            propertyType,
            city,
            neighborhood: neighborhood || undefined,
            cep: cep || undefined,
            bedrooms,
            bathrooms,
            parking,
            usableArea: parseAreaInput(usableArea),
            totalArea: parseAreaInput(totalArea),
            estimatedValue,
            leadDescription,
          },
          ...(isPermuta
            ? {
                preference: {
                  types: wantTypes,
                  neighborhoods: wantNeighborhoods
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                  minBedrooms: wantMinBedrooms,
                  minParking: wantMinParking,
                  minUsableArea: null,
                  maxValue: wantMaxValue,
                  cashTopUp,
                  notes: notes || undefined,
                },
              }
            : {}),
        },
      });

      // Envia as fotos em lotes de 5
      for (let i = 0; i < photos.length; i += 5) {
        setSending(
          `Enviando fotos (${Math.min(i + 5, photos.length)} de ${photos.length})…`,
        );
        const fd = new FormData();
        for (const p of photos.slice(i, i + 5)) fd.append("fotos", p.file);
        const up = await fetch(`/api/permutas/fotos/${res.token}`, {
          method: "POST",
          body: fd,
        });
        if (!up.ok) {
          const data = (await up.json().catch(() => null)) as {
            error?: string;
          } | null;
          toast(data?.error ?? "Algumas fotos não subiram.", "erro");
        }
      }

      setDone({ token: res.token });
      window.scrollTo({ top: 0 });
    } catch (err) {
      toast(
        err instanceof ApiError ? err.message : "Não foi possível enviar.",
        "erro",
      );
    } finally {
      setSending(null);
    }
  }

  /* ------------------------------ tela de sucesso ----------------------------- */
  if (done) {
    const link = `${window.location.origin}/permutas/painel/${done.token}`;
    const wa = `https://wa.me/?text=${encodeURIComponent(
      isPermuta
        ? `Meu painel de permutas na FC Imóveis: ${link}`
        : `Acompanhar meu imóvel na FC Imóveis: ${link}`,
    )}`;
    return (
      <div className="mx-auto max-w-lg space-y-6 rounded-3xl border border-stone-200 bg-white p-7 text-center">
        <PartyPopper className="mx-auto size-14 text-gold-600" />
        <h1 className="text-2xl font-extrabold text-stone-900">
          Imóvel enviado para análise!
        </h1>
        <p className="text-lg text-stone-600">
          {isPermuta
            ? "Nossa equipe vai revisar o cadastro. Enquanto isso, você já pode ver os imóveis disponíveis e demonstrar interesse."
            : "Nossa equipe vai avaliar seu imóvel e entrar em contato pelo seu WhatsApp. Guarde o link abaixo para acompanhar o andamento."}
        </p>
        <div className="space-y-3 rounded-2xl bg-gold-50 p-5 text-left">
          <p className="font-bold text-gold-900">
            🔐 Guarde o seu link de acesso:
          </p>
          <code className="block overflow-x-auto whitespace-nowrap rounded-lg bg-white px-3 py-2.5 font-mono text-sm text-stone-700">
            {link}
          </code>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={link} label="Copiar link" />
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center rounded-xl border-2 border-stone-300 bg-white px-5 font-semibold text-stone-800 hover:border-brand-600"
            >
              Enviar para meu WhatsApp
            </a>
          </div>
          <p className="text-sm text-gold-900">
            {isPermuta
              ? "É com esse link que você volta ao seu painel, de qualquer aparelho. Não compartilhe com estranhos."
              : "É com esse link que você acompanha o seu cadastro, de qualquer aparelho. Não compartilhe com estranhos."}
          </p>
        </div>
        <Button
          size="lg"
          className="w-full"
          onClick={() => router.push(`/permutas/painel/${done.token}`)}
        >
          {isPermuta ? "🔑 Começar a ver imóveis" : "Acompanhar meu cadastro"}
        </Button>
      </div>
    );
  }

  /* --------------------------------- o wizard -------------------------------- */
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-stone-900 sm:text-4xl">
          {objetivo ? TITLES[objetivo] : "Cadastre seu imóvel"}
        </h1>
        <p className="mt-1 text-base text-stone-500">
          É rápido e gratuito. Sem senha: no final você recebe um link privado
          de acesso.
        </p>
      </div>

      <Stepper steps={steps} current={step} />

      <div className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-7">
        {step === 1 && (
          <div className="space-y-5">
            <Field label="O que você quer fazer com seu imóvel?" required>
              <RadioCards
                name="objetivo"
                options={LEAD_OBJETIVO_OPTIONS}
                value={objetivo}
                onChange={(v) => {
                  setObjetivo(v as LeadObjetivo);
                  setError(null);
                }}
                columns={1}
                helpByValue={OBJETIVO_HELP}
              />
            </Field>
            <Field label="Seu nome" required htmlFor="lw-name">
              <Input
                id="lw-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </Field>
            <Field
              label="Seu WhatsApp"
              required
              help="É por ele que nossa equipe vai falar com você."
              htmlFor="lw-whats"
            >
              <Input
                id="lw-whats"
                inputMode="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(maskPhone(e.target.value))}
                placeholder="(11) 99999-0000"
                autoComplete="tel"
              />
            </Field>
            <Field label="Seu e-mail (opcional)" htmlFor="lw-email">
              <Input
                id="lw-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <Field label="Tipo do seu imóvel" required htmlFor="lw-type">
              <Select
                id="lw-type"
                options={PROPERTY_TYPES}
                placeholder="Escolha o tipo…"
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
              />
            </Field>
            <Field
              label="CEP (opcional)"
              help="Ajuda a preencher o bairro. O endereço exato nunca aparece no site."
              htmlFor="lw-cep"
              error={viaCep.error ?? undefined}
            >
              <div className="flex items-center gap-3">
                <Input
                  id="lw-cep"
                  inputMode="numeric"
                  className="max-w-44"
                  value={cep}
                  placeholder="00000-000"
                  onChange={async (e) => {
                    const masked = maskCep(e.target.value);
                    setCep(masked);
                    viaCep.clearError();
                    if (masked.length === 9) {
                      const r = await viaCep.lookup(masked);
                      if (r) {
                        if (r.neighborhood) setNeighborhood(r.neighborhood);
                        if (r.city) setCity(r.city);
                      }
                    }
                  }}
                />
                {viaCep.loading && <Spinner />}
              </div>
            </Field>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Cidade" required htmlFor="lw-city">
                <Input
                  id="lw-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </Field>
              <Field label="Bairro" htmlFor="lw-neigh">
                <Input
                  id="lw-neigh"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {(
                [
                  ["Quartos", bedrooms, setBedrooms],
                  ["Banheiros", bathrooms, setBathrooms],
                  ["Vagas", parking, setParking],
                ] as const
              ).map(([label, value, setter]) => (
                <div
                  key={label}
                  className="rounded-xl border-2 border-stone-200 px-4 py-3 text-center"
                >
                  <span className="block font-semibold text-stone-800">
                    {label}
                  </span>
                  <NumberStepper
                    className="mt-2 justify-center"
                    label={label}
                    value={value}
                    onChange={setter}
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Área construída (m²)" htmlFor="lw-area">
                <Input
                  id="lw-area"
                  inputMode="decimal"
                  value={usableArea}
                  onChange={(e) => setUsableArea(e.target.value)}
                  placeholder="Ex.: 120"
                />
              </Field>
              <Field label="Área do terreno (m²)" htmlFor="lw-total">
                <Input
                  id="lw-total"
                  inputMode="decimal"
                  value={totalArea}
                  onChange={(e) => setTotalArea(e.target.value)}
                  placeholder="Ex.: 300"
                />
              </Field>
            </div>
            <Field
              label={
                objetivo === "ALUGAR"
                  ? "Quanto você gostaria de receber de aluguel por mês? (opcional)"
                  : "Quanto você acha que ele vale? (opcional)"
              }
              help={
                isPermuta
                  ? "Um valor aproximado ajuda a encontrar trocas equilibradas."
                  : "Um valor aproximado ajuda a nossa equipe na avaliação."
              }
              htmlFor="lw-value"
            >
              <MoneyInput
                id="lw-value"
                value={estimatedValue}
                onChange={setEstimatedValue}
              />
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) addPhotos(e.target.files);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex min-h-36 w-full flex-col items-center justify-center gap-2 rounded-2xl border-[3px] border-dashed border-stone-300 bg-stone-50 p-6 text-center hover:border-brand-500 hover:bg-brand-50/50"
            >
              <ImagePlus className="size-9 text-brand-600" />
              <span className="text-lg font-semibold text-stone-700">
                Toque para escolher as fotos
              </span>
              <span className="text-base text-stone-500">
                Até {MAX_PHOTOS} fotos · a primeira será a capa
              </span>
            </button>
            {photos.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photos.map((p, i) => (
                  <div
                    key={p.url}
                    className="relative overflow-hidden rounded-xl border-2 border-stone-200"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.url}
                      alt={`Foto ${i + 1}`}
                      className="aspect-square w-full object-cover"
                    />
                    {i === 0 && (
                      <span className="absolute left-1.5 top-1.5 rounded-full bg-gold-400 px-2 py-0.5 text-xs font-bold text-gold-950">
                        Capa
                      </span>
                    )}
                    <button
                      type="button"
                      aria-label="Remover foto"
                      onClick={() =>
                        setPhotos((prev) => prev.filter((_, j) => j !== i))
                      }
                      className="absolute right-1.5 top-1.5 flex size-11 items-center justify-center rounded-full bg-black/60 text-white"
                    >
                      <Trash2 className="size-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <Field
              label="Conte sobre o seu imóvel, do seu jeito"
              required
              help="O que ele tem de bom? Como é morar nele? Nossa equipe revisa o texto antes de publicar — e pode te sugerir versões melhoradas."
              htmlFor="lw-desc"
            >
              <Textarea
                id="lw-desc"
                rows={8}
                value={leadDescription}
                onChange={(e) => setLeadDescription(e.target.value)}
                placeholder="Ex.: Casa muito bem cuidada, sol da manhã, quintal com espaço para churrasco…"
              />
            </Field>
          </div>
        )}

        {isPermuta && step === 5 && (
          <div className="space-y-6">
            <Field
              label="Que tipo de imóvel você aceita na troca?"
              help="Pode marcar mais de um. Em branco = tanto faz."
            >
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {PROPERTY_TYPES.map((t) => (
                  <CheckboxField
                    key={t.value}
                    label={t.label}
                    checked={wantTypes.includes(t.value)}
                    onChange={() =>
                      setWantTypes((prev) =>
                        prev.includes(t.value)
                          ? prev.filter((x) => x !== t.value)
                          : [...prev, t.value],
                      )
                    }
                  />
                ))}
              </div>
            </Field>
            <Field
              label="Bairros de preferência (opcional)"
              help="Separe por vírgula. Ex.: Centro, Jardim América"
              htmlFor="lw-wneigh"
            >
              <Input
                id="lw-wneigh"
                value={wantNeighborhoods}
                onChange={(e) => setWantNeighborhoods(e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border-2 border-stone-200 px-4 py-3 text-center">
                <span className="block font-semibold text-stone-800">
                  Quartos (mínimo)
                </span>
                <NumberStepper
                  className="mt-2 justify-center"
                  label="Quartos mínimos"
                  value={wantMinBedrooms}
                  onChange={setWantMinBedrooms}
                />
              </div>
              <div className="rounded-xl border-2 border-stone-200 px-4 py-3 text-center">
                <span className="block font-semibold text-stone-800">
                  Vagas (mínimo)
                </span>
                <NumberStepper
                  className="mt-2 justify-center"
                  label="Vagas mínimas"
                  value={wantMinParking}
                  onChange={setWantMinParking}
                />
              </div>
            </div>
            <Field
              label="Valor máximo do imóvel desejado (opcional)"
              htmlFor="lw-maxv"
            >
              <MoneyInput
                id="lw-maxv"
                value={wantMaxValue}
                onChange={setWantMaxValue}
              />
            </Field>
            <Field label="Sobre a diferença de valores (a 'volta')">
              <RadioCards
                name="cashTopUp"
                options={CASH_TOPUP_OPTIONS}
                value={cashTopUp}
                onChange={setCashTopUp}
                columns={1}
              />
            </Field>
            <Field label="Algo mais que devemos saber? (opcional)" htmlFor="lw-notes">
              <Textarea
                id="lw-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>
          </div>
        )}

        {objetivo !== "" && step === reviewStep && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-stone-900">
              Confira antes de enviar
            </h2>
            <dl className="divide-y divide-stone-100 rounded-2xl border-2 border-stone-200 px-4">
              {(
                [
                  ["Objetivo", labelOf(LEAD_OBJETIVO_OPTIONS, objetivo)],
                  ["Nome", name],
                  ["WhatsApp", whatsapp],
                  [
                    "Imóvel",
                    `${PROPERTY_TYPES.find((t) => t.value === propertyType)?.label ?? ""}${neighborhood ? ` · ${neighborhood}` : ""} · ${city}`,
                  ],
                  [
                    "Detalhes",
                    [
                      bedrooms && `${bedrooms} quartos`,
                      bathrooms && `${bathrooms} banheiros`,
                      parking && `${parking} vagas`,
                      usableArea && `${usableArea} m²`,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—",
                  ],
                  ["Fotos", `${photos.length} foto(s)`],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 py-3">
                  <dt className="font-semibold text-stone-500">{label}</dt>
                  <dd className="text-right text-stone-900">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="rounded-xl bg-brand-100 p-4 text-base text-brand-900">
              {isPermuta
                ? "Ao enviar, nossa equipe revisa o cadastro antes de publicar. O endereço exato nunca aparece no site — só cidade e bairro."
                : "Ao enviar, nossa equipe vai avaliar seu imóvel e entrar em contato pelo WhatsApp. O endereço exato nunca aparece no site — só cidade e bairro."}
            </p>
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-base font-semibold text-red-800"
          >
            {error}
          </p>
        )}

        <div className="mt-7 flex flex-col-reverse gap-3 border-t-2 border-stone-100 pt-5 sm:flex-row sm:justify-between">
          {step > 1 ? (
            <Button
              variant="ghost"
              size="lg"
              disabled={!!sending}
              onClick={() => {
                setError(null);
                setStep((s) => s - 1);
              }}
            >
              ← Voltar
            </Button>
          ) : (
            <span />
          )}
          {step < reviewStep ? (
            <Button size="lg" onClick={next}>
              Continuar →
            </Button>
          ) : (
            <Button size="lg" variant="gold" disabled={!!sending} onClick={submit}>
              {sending ? (
                <>
                  <Spinner className="border-gold-900/40 border-t-gold-950" />
                  {sending}
                </>
              ) : (
                "Enviar meu imóvel 🔑"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
