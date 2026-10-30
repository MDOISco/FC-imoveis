"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LayerGroup, Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button, buttonClasses } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-dialog";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import {
  CATEGORIAS_LUGAR,
  CATEGORIA_POR_VALOR,
} from "@/lib/cidade/categorias";
import { ESTABELECIMENTOS } from "@/lib/cidade/estabelecimentos";
import {
  centroDoImovel,
  pertoDoImovel,
  PONTO_CENTRO,
  PRECISOES_PUBLICAS,
} from "@/lib/cidade/perto";
import { apiFetch, ApiError } from "@/lib/client-api";
import { cn } from "@/lib/cn";

/*
 * Painel "Localização no mapa" da ficha (SÓ a equipe: a ficha é protegida
 * por senha, então aqui a posição do imóvel pode vir ao navegador). Nunca
 * usar este componente em página pública.
 */

type Posicao = { lat: number; lng: number };
type Salvo = { pos: Posicao | null; precisao: string | null };
type Foco = Posicao & { zoom: number };

type RespostaLocalizacao = {
  ok: true;
  latitude: number | null;
  longitude: number | null;
  geoPrecision: string | null;
  resultado?: "localizado" | "nao-achou" | "sem-endereco" | "sem-mudanca";
};

const ESTABELECIMENTO_POR_ID = new Map(ESTABELECIMENTOS.map((e) => [e.id, e]));

// Até onde procuramos lugares (varia por tipo: mercado 2 km, hospital 5 km…)
const RAIO_MIN_KM = Math.min(...CATEGORIAS_LUGAR.map((c) => c.raio)) / 1000;
const RAIO_MAX_KM = Math.max(...CATEGORIAS_LUGAR.map((c) => c.raio)) / 1000;

const CENTRO_CIDADE: Foco = { ...PONTO_CENTRO, zoom: 13 };

// Marcador do imóvel: alfinete verde com a casinha (a ponta marca o lugar)
const ICONE_IMOVEL = `<div style="position:relative;width:44px;height:56px;cursor:grab"><div style="position:absolute;left:0;top:0;width:44px;height:44px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:var(--color-brand-800,#28443a);border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.45)"></div><div style="position:absolute;left:0;top:0;width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-size:22px;line-height:1">🏠</div></div>`;

const TOM_CLASSES = {
  ok: "bg-brand-50 text-brand-900",
  atencao: "bg-amber-50 text-amber-900",
  alerta: "border-2 border-amber-400 bg-amber-100 text-amber-950",
  neutro: "bg-stone-100 text-stone-700",
} as const;

type Tom = keyof typeof TOM_CLASSES;

const MENSAGEM_PROCURA: Record<
  NonNullable<RespostaLocalizacao["resultado"]>,
  { texto: string; tipo: "sucesso" | "erro" }
> = {
  localizado: { texto: "Pronto! Localizamos pelo endereço.", tipo: "sucesso" },
  "nao-achou": {
    texto:
      "Não achamos esse endereço no mapa. Arraste o marcador ou toque no mapa para marcar.",
    tipo: "erro",
  },
  "sem-endereco": {
    texto: "Preencha o endereço na etapa 2 do cadastro.",
    tipo: "erro",
  },
  "sem-mudanca": {
    texto: "Nada mudou. Recarregue a página e tente de novo.",
    tipo: "erro",
  },
};

function salvoDe(
  latitude: number | null,
  longitude: number | null,
  geoPrecision: string | null,
): Salvo {
  return {
    pos:
      latitude !== null && longitude !== null
        ? { lat: latitude, lng: longitude }
        : null,
    precisao: geoPrecision,
  };
}

function mesmoSalvo(a: Salvo, b: Salvo) {
  return (
    a.precisao === b.precisao &&
    a.pos?.lat === b.pos?.lat &&
    a.pos?.lng === b.pos?.lng
  );
}

// Só o bairro é aproximado: mostra mais em volta para a equipe achar a casa
function focoDe(s: Salvo): Foco | null {
  if (!s.pos) return null;
  return { ...s.pos, zoom: s.precisao === "BAIRRO" ? 15 : 16 };
}

// 6 casas decimais ≈ 10 cm: mais que isso é só ruído
const arred = (v: number) => Math.round(v * 1e6) / 1e6;

/** Frase da situação da posição (bem visível, acima do mapa). */
function situacao({
  salvo,
  tentou,
  temEndereco,
  tirado,
}: {
  salvo: Salvo;
  tentou: boolean;
  temEndereco: boolean;
  tirado: boolean;
}): { texto: string; tom: Tom } {
  if (salvo.pos) {
    switch (salvo.precisao) {
      case "MANUAL":
        return { texto: "✓ Posição marcada pela equipe", tom: "ok" };
      case "ENDERECO":
        return { texto: "Achado pelo endereço completo", tom: "ok" };
      case "RUA":
        return {
          texto: "Achado pela rua — confira se o marcador está no lugar certo",
          tom: "atencao",
        };
      case "CONDOMINIO":
        return {
          texto:
            "Posição do condomínio (aproximada) — se quiser, arraste até o imóvel",
          tom: "atencao",
        };
      case "BAIRRO":
        return {
          texto:
            "Só achamos o bairro. Arraste o marcador até o imóvel e toque em Salvar — até lá, o site NÃO mostra o que tem perto.",
          tom: "alerta",
        };
      default:
        return {
          texto:
            "Posição aproximada. Arraste o marcador até o imóvel e toque em Salvar.",
          tom: "alerta",
        };
    }
  }
  if (tirado) {
    return {
      texto: "Imóvel fora do mapa. Toque no mapa para marcar de novo.",
      tom: "neutro",
    };
  }
  if (!temEndereco) {
    return { texto: "Preencha o endereço (etapa 2) para localizar.", tom: "neutro" };
  }
  if (tentou) {
    return {
      texto: "Não achamos este endereço no mapa. Toque no mapa para marcar.",
      tom: "atencao",
    };
  }
  return {
    texto:
      "Localizando pelo endereço… recarregue a página em alguns segundos.",
    tom: "neutro",
  };
}

/** Mapa interno com o ponto do imóvel + prévia do "O que tem perto" do site. */
export function LocalizacaoImovel({
  propertyId,
  latitude,
  longitude,
  geoPrecision,
  addressVisibility,
  tentou,
  temEndereco,
}: {
  propertyId: string;
  latitude: number | null;
  longitude: number | null;
  geoPrecision: string | null; // ENDERECO | RUA | CONDOMINIO | BAIRRO | MANUAL
  addressVisibility: string;
  tentou: boolean; // o servidor já procurou este endereço no mapa
  temEndereco: boolean; // há endereço no cadastro para procurar
}) {
  const router = useRouter();
  const url = `/api/imoveis/${propertyId}/localizacao`;

  const divRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const marcadorRef = useRef<Marker | null>(null);
  const pontinhosRef = useRef<LayerGroup | null>(null);
  const [pronto, setPronto] = useState(false);

  const [salvo, setSalvo] = useState<Salvo>(() =>
    salvoDe(latitude, longitude, geoPrecision),
  );
  const [rascunho, setRascunho] = useState<Posicao | null>(null); // ainda não salvo
  const [foco, setFoco] = useState<Foco | null>(() =>
    focoDe(salvoDe(latitude, longitude, geoPrecision)),
  );
  const [ocupado, setOcupado] = useState<"salvar" | "procurar" | "tirar" | null>(
    null,
  );
  const [tentouAqui, setTentouAqui] = useState(false);
  const [tirado, setTirado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  // Depois do router.refresh() chegam dados novos do servidor (ex.: a
  // localização automática terminou): atualiza o painel e o mapa.
  const doServidor = salvoDe(latitude, longitude, geoPrecision);
  const [ultimoDoServidor, setUltimoDoServidor] = useState(doServidor);
  if (!mesmoSalvo(ultimoDoServidor, doServidor)) {
    setUltimoDoServidor(doServidor);
    if (!mesmoSalvo(salvo, doServidor)) {
      setSalvo(doServidor);
      setRascunho(null);
      setFoco(focoDe(doServidor));
    }
  }

  /* ---------- Mapa (Leaflet só no navegador) ---------- */

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelado || !divRef.current || mapRef.current) return;

      const map = L.map(divRef.current, {
        center: [CENTRO_CIDADE.lat, CENTRO_CIDADE.lng],
        zoom: CENTRO_CIDADE.zoom,
        scrollWheelZoom: false, // rolagem da página não "prende" no mapa
      });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      // Um toque no mapa leva o marcador até ali (ainda sem salvar)
      map.on("click", (e) => {
        setRascunho({ lat: e.latlng.lat, lng: e.latlng.lng });
      });

      pontinhosRef.current = L.layerGroup().addTo(map);
      leafletRef.current = L;
      mapRef.current = map;
      setPronto(true);
    })();
    return () => {
      cancelado = true;
      mapRef.current?.remove();
      mapRef.current = null;
      marcadorRef.current = null;
      pontinhosRef.current = null;
      setPronto(false);
    };
  }, []);

  // Leva a vista do mapa até a posição (ao abrir, procurar ou desfazer)
  useEffect(() => {
    if (!pronto || !foco) return;
    mapRef.current?.setView([foco.lat, foco.lng], foco.zoom);
  }, [pronto, foco]);

  // Marcador arrastável na posição atual (a salva ou a nova)
  const latMarcador = (rascunho ?? salvo.pos)?.lat ?? null;
  const lngMarcador = (rascunho ?? salvo.pos)?.lng ?? null;
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!pronto || !L || !map) return;
    if (latMarcador === null || lngMarcador === null) {
      marcadorRef.current?.remove();
      marcadorRef.current = null;
      return;
    }
    if (marcadorRef.current) {
      marcadorRef.current.setLatLng([latMarcador, lngMarcador]);
      return;
    }
    const marcador = L.marker([latMarcador, lngMarcador], {
      draggable: true,
      autoPan: true,
      zIndexOffset: 1000,
      title: "Imóvel — arraste para ajustar",
      icon: L.divIcon({
        className: "", // sem estilo padrão do Leaflet
        html: ICONE_IMOVEL,
        iconSize: [44, 56],
        iconAnchor: [22, 53],
      }),
    }).addTo(map);
    marcador.on("dragend", () => {
      const p = marcador.getLatLng();
      setRascunho({ lat: p.lat, lng: p.lng });
    });
    marcadorRef.current = marcador;
  }, [pronto, latMarcador, lngMarcador]);

  /* ---------- Prévia do site (mesma regra da página pública) ---------- */

  // Com posição nova ainda não salva, mostra como vai ficar depois de salvar
  const latPrevia = rascunho?.lat ?? salvo.pos?.lat ?? null;
  const lngPrevia = rascunho?.lng ?? salvo.pos?.lng ?? null;
  const precisaoPrevia = rascunho ? "MANUAL" : salvo.precisao;
  const previa = useMemo(() => {
    const geo = {
      latitude: latPrevia,
      longitude: lngPrevia,
      geoPrecision: precisaoPrevia,
      addressVisibility,
    };
    return { itens: pertoDoImovel(geo), centro: centroDoImovel(geo) };
  }, [latPrevia, lngPrevia, precisaoPrevia, addressVisibility]);

  // Pontinhos dos lugares da prévia, para a equipe conferir no mapa
  useEffect(() => {
    const L = leafletRef.current;
    const grupo = pontinhosRef.current;
    if (!pronto || !L || !grupo) return;
    grupo.clearLayers();
    for (const item of previa.itens) {
      const e = ESTABELECIMENTO_POR_ID.get(item.id);
      if (!e) continue;
      const cat = CATEGORIA_POR_VALOR[item.categoria];
      const rotulo = document.createElement("span");
      rotulo.style.fontSize = "15px";
      rotulo.textContent = `${cat.emoji} ${item.nome} · ${item.rotulo}`;
      L.circleMarker([e.lat, e.lng], {
        radius: 8,
        color: cat.cor,
        weight: 3,
        fillColor: "#ffffff",
        fillOpacity: 1,
        bubblingMouseEvents: false, // tocar no pontinho não move o marcador
      })
        .bindTooltip(rotulo)
        .addTo(grupo);
    }
  }, [pronto, previa]);

  /* ---------- Ações ---------- */

  async function salvar() {
    if (!rascunho) return;
    setOcupado("salvar");
    setAviso(null);
    try {
      const r = await apiFetch<RespostaLocalizacao>(url, {
        method: "PUT",
        body: { latitude: arred(rascunho.lat), longitude: arred(rascunho.lng) },
      });
      setSalvo(salvoDe(r.latitude, r.longitude, r.geoPrecision));
      setRascunho(null);
      setTentouAqui(true);
      setTirado(false);
      toast("Posição salva!");
      router.refresh();
    } catch (e) {
      toast(
        e instanceof ApiError ? e.message : "Não foi possível salvar a posição.",
        "erro",
      );
    } finally {
      setOcupado(null);
    }
  }

  function desfazer() {
    setRascunho(null);
    setFoco(focoDe(salvo));
  }

  async function procurar() {
    setOcupado("procurar");
    setAviso(null);
    try {
      const r = await apiFetch<RespostaLocalizacao>(url, { method: "POST" });
      const novo = salvoDe(r.latitude, r.longitude, r.geoPrecision);
      setSalvo(novo);
      setRascunho(null);
      setTentouAqui(true);
      setTirado(false);
      setFoco(focoDe(novo) ?? { ...CENTRO_CIDADE });
      const msg = MENSAGEM_PROCURA[r.resultado ?? "sem-mudanca"];
      setAviso(msg.texto);
      toast(msg.texto, msg.tipo);
      router.refresh();
    } catch (e) {
      // 503 = serviço de mapas fora do ar (a mensagem já diz o que fazer)
      const msg =
        e instanceof ApiError ? e.message : "Não foi possível procurar agora.";
      setAviso(msg);
      toast(msg, "erro");
    } finally {
      setOcupado(null);
    }
  }

  async function tirar() {
    setOcupado("tirar");
    setAviso(null);
    try {
      await apiFetch(url, { method: "DELETE" });
      setSalvo({ pos: null, precisao: null });
      setRascunho(null);
      setTentouAqui(true);
      setTirado(true);
      toast("Pronto, o imóvel saiu do mapa.");
      router.refresh();
    } catch (e) {
      toast(
        e instanceof ApiError ? e.message : "Não foi possível tirar do mapa.",
        "erro",
      );
    } finally {
      setOcupado(null);
    }
  }

  /* ---------- Tela ---------- */

  const sit = situacao({
    salvo,
    tentou: tentou || tentouAqui,
    temEndereco,
    tirado,
  });
  const localizando =
    !salvo.pos && !tirado && temEndereco && !(tentou || tentouAqui);
  const temMarcador = latMarcador !== null;

  const conteudoProcurar =
    ocupado === "procurar" ? (
      <>
        <Spinner /> Procurando no mapa…
      </>
    ) : (
      "🔎 Procurar pelo endereço de novo"
    );

  // Por que a prévia está vazia (ou o que falta)
  let motivoVazio: string | null = null;
  if (previa.itens.length === 0) {
    if (addressVisibility === "OCULTO") {
      motivoVazio =
        "Este imóvel está como 'não mostrar nem o bairro': o site não mostra o que tem perto.";
    } else if (latPrevia === null) {
      motivoVazio =
        "Ainda sem posição no mapa: o site não mostra o que tem perto.";
    } else if (!precisaoPrevia || !PRECISOES_PUBLICAS.includes(precisaoPrevia)) {
      motivoVazio =
        "Só sabemos o bairro: o site não mostra o que tem perto até a posição ser confirmada (arraste o marcador e toque em Salvar).";
    } else {
      motivoVazio = `Nenhum lugar da nossa lista fica perto deste ponto (procuramos de ${RAIO_MIN_KM} a ${RAIO_MAX_KM} km, conforme o tipo de lugar).`;
    }
  }

  return (
    <div className="space-y-5">
      <p
        className={cn(
          "rounded-xl px-4 py-3 text-lg font-semibold",
          TOM_CLASSES[sit.tom],
        )}
      >
        {sit.texto}
      </p>

      <p className="text-base text-stone-600">
        {temMarcador
          ? "Para ajustar: arraste o marcador 🏠 até o imóvel ou toque no mapa onde ele fica."
          : "Toque no mapa onde fica o imóvel para colocar o marcador 🏠."}
      </p>

      {/* isolate: o mapa não passa por cima das janelas de confirmação */}
      <div
        ref={divRef}
        className="isolate h-[360px] w-full overflow-hidden rounded-2xl border-2 border-stone-200"
        role="application"
        aria-label="Mapa para marcar onde fica o imóvel"
      >
        {!pronto && (
          <div className="flex h-full items-center justify-center bg-stone-100 text-lg text-stone-500">
            Carregando o mapa… 🗺️
          </div>
        )}
      </div>

      {rascunho && (
        <div className="space-y-3 rounded-xl border-2 border-gold-300 bg-gold-50 p-4">
          <p className="text-lg font-semibold text-gold-950">
            📌 Você mudou o marcador de lugar. Toque em “Salvar esta posição”
            para guardar.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              onClick={salvar}
              disabled={ocupado !== null}
            >
              {ocupado === "salvar" ? (
                <>
                  <Spinner className="border-white/40 border-t-white" />
                  Salvando…
                </>
              ) : (
                "Salvar esta posição"
              )}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={desfazer}
              disabled={ocupado !== null}
            >
              Desfazer
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {temEndereco ? (
          salvo.precisao === "MANUAL" && salvo.pos ? (
            // Troca o ponto marcado à mão: pede confirmação antes
            <ConfirmButton
              title="Procurar pelo endereço de novo?"
              message="A posição marcada pela equipe vai ser trocada pela que o mapa achar com o endereço do cadastro."
              confirmLabel="Sim, procurar"
              onConfirm={procurar}
              className={cn(ocupado !== null && "pointer-events-none opacity-50")}
            >
              {conteudoProcurar}
            </ConfirmButton>
          ) : (
            <Button
              variant="secondary"
              onClick={procurar}
              disabled={ocupado !== null}
            >
              {conteudoProcurar}
            </Button>
          )
        ) : (
          <Link
            href={`/imoveis/${propertyId}/editar?etapa=2`}
            className={buttonClasses("secondary", "md")}
          >
            ✏️ Preencher o endereço (etapa 2)
          </Link>
        )}

        {localizando && (
          <Button variant="secondary" onClick={() => router.refresh()}>
            🔄 Recarregar agora
          </Button>
        )}

        {salvo.pos && (
          <ConfirmButton
            title="Tirar o imóvel do mapa?"
            message="O marcador sai do mapa e o site deixa de mostrar o que tem perto deste imóvel (mercados, escolas, farmácias…). Dá para marcar de novo quando quiser."
            confirmLabel="Sim, tirar do mapa"
            onConfirm={tirar}
            className={cn(ocupado !== null && "pointer-events-none opacity-50")}
          >
            {ocupado === "tirar" ? (
              <>
                <Spinner /> Tirando…
              </>
            ) : (
              "Tirar do mapa"
            )}
          </ConfirmButton>
        )}
      </div>

      {aviso && (
        <p className="rounded-xl bg-stone-100 px-4 py-3 text-lg text-stone-800">
          {aviso}
        </p>
      )}

      <div className="rounded-xl border-2 border-stone-200 p-4">
        <h3 className="text-lg font-bold text-stone-900">
          {rascunho
            ? "Como o site vai ficar depois de salvar"
            : "O que o cliente vê no site"}
        </h3>
        <p className="mt-1 text-base text-stone-500">
          Na página do imóvel e no link exclusivo: só nomes de lugares e faixas
          de distância — nunca o endereço nem o ponto exato.
        </p>

        {previa.centro && (
          <p className="mt-3 text-lg font-semibold text-brand-900">
            <span aria-hidden="true">📍 </span>Fica {previa.centro}
          </p>
        )}

        {previa.itens.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {previa.itens.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1"
              >
                <span className="text-lg text-stone-800">
                  <span aria-hidden="true">
                    {CATEGORIA_POR_VALOR[item.categoria].emoji}{" "}
                  </span>
                  {item.nome}
                </span>
                <span className="shrink-0 rounded-full bg-brand-50 px-3 py-0.5 text-base font-bold text-brand-900">
                  {item.rotulo}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-lg text-stone-700">{motivoVazio}</p>
        )}
      </div>
    </div>
  );
}
