"use client";

import { useEffect, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  CATEGORIAS_LUGAR,
  CATEGORIA_POR_VALOR,
  type CategoriaLugar,
} from "@/lib/cidade/categorias";
import {
  CONDOMINIOS,
  CONDOMINIO_DESTAQUE,
  ordemCondominios,
  type Condominio,
} from "@/lib/cidade/condominios";
import { ESTABELECIMENTOS } from "@/lib/cidade/estabelecimentos";
import { CENTRO_BRAGANCA } from "@/lib/cidade/pontos";
import { cn } from "@/lib/cn";

/**
 * Mapa "Onde fica cada coisa" (/cidade): mercados, farmácias, escolas etc.
 * + os condomínios. Leaflet + OpenStreetMap, sem chave, só no navegador.
 * Só mostra lugares públicos (comércio/instituições/condomínios) — nunca a
 * posição de imóvel.
 */

type Grupo = CategoriaLugar | "CONDOMINIO";
type Selecao = Grupo | "TODOS";

type Lugar = {
  id: string;
  grupo: Grupo;
  nome: string; // já com ★ no condomínio destaque
  nomeOrdem: string; // nome sem ★, para ordenar
  tipo: string;
  endereco: string; // "endereço — bairro" (ou a referência do condomínio)
  bairro: string; // linha de baixo da lista
  obs?: string;
  lat: number;
  lng: number;
  emoji: string;
  cor: string;
  destaque: boolean;
};

const ZOOM_INICIAL = 13;
const COR_DOURADA = "#cda45c";
const COR_CONDOMINIO = "#166534"; // verde da marca
const EMOJI_CONDOMINIO = "🏘️";

const TIPO_CONDOMINIO: Record<Condominio["tipo"], string> = {
  Horizontal: "Condomínio de casas",
  Chácaras: "Condomínio de chácaras",
  Náutico: "Condomínio náutico (represa)",
  Vertical: "Prédio de apartamentos",
  Comercial: "Condomínio comercial",
};

const ESTAB: Lugar[] = ESTABELECIMENTOS.map((e) => {
  const cat = CATEGORIA_POR_VALOR[e.categoria];
  return {
    id: e.id,
    grupo: e.categoria,
    nome: e.nome,
    nomeOrdem: e.nome,
    tipo: e.tipo,
    endereco: [e.endereco, e.bairro].filter(Boolean).join(" — "),
    bairro: e.bairro,
    obs: e.obs,
    lat: e.lat,
    lng: e.lng,
    emoji: cat.emoji,
    cor: cat.cor,
    destaque: false,
  };
});

// Só os condomínios que têm coordenada entram no mapa.
const CONDS: Lugar[] = CONDOMINIOS.filter(
  (c): c is Condominio & { lat: number; lng: number } =>
    typeof c.lat === "number" && typeof c.lng === "number",
).map((c) => {
  const destaque = c.nome === CONDOMINIO_DESTAQUE;
  return {
    id: `condominio-${c.nome}`,
    grupo: "CONDOMINIO",
    nome: destaque ? `★ ${c.nome}` : c.nome,
    nomeOrdem: c.nome,
    tipo: TIPO_CONDOMINIO[c.tipo],
    endereco: c.local ?? "",
    bairro: c.local ?? "",
    obs: c.obs,
    lat: c.lat,
    lng: c.lng,
    emoji: EMOJI_CONDOMINIO,
    cor: destaque ? COR_DOURADA : COR_CONDOMINIO,
    destaque,
  };
});

const LUGARES: Lugar[] = [...ESTAB, ...CONDS];

// Botões: só as categorias com pelo menos 1 lugar, na ordem oficial.
const GRUPOS: { value: Grupo; label: string; emoji: string; total: number }[] = [
  ...CATEGORIAS_LUGAR.map((c) => ({
    value: c.value as Grupo,
    label: c.label,
    emoji: c.emoji,
    total: ESTAB.filter((l) => l.grupo === c.value).length,
  })).filter((g) => g.total > 0),
  ...(CONDS.length > 0
    ? [{ value: "CONDOMINIO" as Grupo, label: "Condomínios", emoji: EMOJI_CONDOMINIO, total: CONDS.length }]
    : []),
];

/** Lista de uma categoria: A–Z; condomínios com o Jardim das Palmeiras primeiro. */
function lugaresDoGrupo(g: Grupo): Lugar[] {
  const lista = LUGARES.filter((l) => l.grupo === g);
  if (g === "CONDOMINIO") {
    return lista.sort((a, b) => ordemCondominios(a.nomeOrdem, b.nomeOrdem));
  }
  return lista.sort(
    (a, b) =>
      a.nomeOrdem.localeCompare(b.nomeOrdem, "pt-BR") ||
      a.bairro.localeCompare(b.bairro, "pt-BR"),
  );
}

/** Texto seguro dentro do HTML do popup (há nomes com apóstrofo). */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function linkComoChegar(l: Lugar): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lng}`;
}

function htmlPopup(l: Lugar): string {
  const linhas = [
    `<strong style="font-size:17px">${escapeHtml(`${l.emoji} ${l.nome}`)}</strong>`,
    `<span style="color:#57534e">${escapeHtml(l.tipo)}</span>`,
  ];
  if (l.endereco) linhas.push(`<span>${escapeHtml(l.endereco)}</span>`);
  if (l.obs) linhas.push(`<em style="color:#57534e">${escapeHtml(l.obs)}</em>`);
  linhas.push(
    `<a href="${escapeHtml(linkComoChegar(l))}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-top:4px;padding:4px 0;font-weight:700;color:#166534">Como chegar ↗</a>`,
  );
  return `<div style="max-width:260px;font-size:16px;line-height:1.45">${linhas.join("<br/>")}</div>`;
}

export function MapaEstabelecimentos() {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Record<string, Marker>>({});
  const camadasRef = useRef<Partial<Record<Grupo, LayerGroup>>>({});
  const [pronto, setPronto] = useState(false);
  const [selecao, setSelecao] = useState<Selecao>("TODOS");
  const [ativo, setAtivo] = useState<string | null>(null);

  // Cria o mapa e TODOS os marcadores uma vez só (uma camada por categoria).
  useEffect(() => {
    let cancelado = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelado || !divRef.current || mapRef.current) return;

      const map = L.map(divRef.current, {
        center: CENTRO_BRAGANCA,
        zoom: ZOOM_INICIAL,
        scrollWheelZoom: false, // rolagem da página não "prende" no mapa
      });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const camadas: Partial<Record<Grupo, LayerGroup>> = {};
      for (const g of GRUPOS) camadas[g.value] = L.layerGroup().addTo(map);

      for (const l of LUGARES) {
        const camada = camadas[l.grupo];
        if (!camada) continue;
        const tam = l.destaque ? 48 : 36;
        const icone = L.divIcon({
          className: "", // sem estilo padrão do Leaflet
          html: `<div style="display:flex;align-items:center;justify-content:center;width:${tam}px;height:${tam}px;border-radius:9999px;background:#fff;border:${l.destaque ? 4 : 3}px solid ${l.cor};box-shadow:0 2px 8px rgba(0,0,0,.35);font-size:${l.destaque ? 24 : 18}px;line-height:1">${l.emoji}</div>`,
          iconSize: [tam, tam],
          iconAnchor: [tam / 2, tam / 2],
          popupAnchor: [0, -(tam / 2 + 2)],
        });
        const marker = L.marker([l.lat, l.lng], {
          icon: icone,
          title: l.nome,
          zIndexOffset: l.destaque ? 1000 : 0, // Jardim das Palmeiras por cima
        })
          .addTo(camada)
          .bindPopup(htmlPopup(l));
        marker.on("click", () => setAtivo(l.id));
        markersRef.current[l.id] = marker;
      }

      camadasRef.current = camadas;
      mapRef.current = map;
      setPronto(true);
    })();
    return () => {
      cancelado = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = {};
      camadasRef.current = {};
    };
  }, []);

  // Troca de categoria: mostra só as camadas certas e enquadra o mapa.
  useEffect(() => {
    const map = mapRef.current;
    if (!pronto || !map) return;
    for (const g of GRUPOS) {
      const camada = camadasRef.current[g.value];
      if (!camada) continue;
      const mostrar = selecao === "TODOS" || selecao === g.value;
      if (mostrar && !map.hasLayer(camada)) camada.addTo(map);
      if (!mostrar && map.hasLayer(camada)) map.removeLayer(camada);
    }
    map.closePopup();
    if (selecao === "TODOS") {
      map.setView(CENTRO_BRAGANCA, ZOOM_INICIAL);
    } else {
      const pontos = LUGARES.filter((l) => l.grupo === selecao).map(
        (l) => [l.lat, l.lng] as [number, number],
      );
      if (pontos.length > 0) map.fitBounds(pontos, { padding: [40, 40], maxZoom: 16 });
    }
  }, [selecao, pronto]);

  function escolher(s: Selecao) {
    setSelecao(s);
    setAtivo(null);
  }

  function irPara(l: Lugar) {
    setAtivo(l.id);
    const map = mapRef.current;
    const marker = markersRef.current[l.id];
    if (!map || !marker) return;
    map.flyTo([l.lat, l.lng], 16, { duration: 0.8 });
    marker.openPopup();
    divRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const grupoAtual = selecao === "TODOS" ? null : GRUPOS.find((g) => g.value === selecao);
  const lista = grupoAtual ? lugaresDoGrupo(grupoAtual.value) : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Escolha uma categoria">
        <BotaoCategoria
          ativo={selecao === "TODOS"}
          onClick={() => escolher("TODOS")}
          emoji="📍"
          label="Todos"
          total={LUGARES.length}
        />
        {GRUPOS.map((g) => (
          <BotaoCategoria
            key={g.value}
            ativo={selecao === g.value}
            onClick={() => escolher(g.value)}
            emoji={g.emoji}
            label={g.label}
            total={g.total}
          />
        ))}
      </div>

      <div
        ref={divRef}
        className="h-[420px] w-full overflow-hidden rounded-3xl border-2 border-stone-200 sm:h-[520px]"
        role="application"
        aria-label="Mapa dos estabelecimentos e condomínios de Bragança Paulista"
      >
        {!pronto && (
          <div className="flex h-full items-center justify-center bg-stone-100 text-lg text-stone-500">
            Carregando o mapa… 🛒
          </div>
        )}
      </div>

      {grupoAtual ? (
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-stone-900">
            {grupoAtual.emoji} {grupoAtual.label}{" "}
            <span className="font-semibold text-stone-500">
              ({grupoAtual.total} {grupoAtual.total === 1 ? "lugar" : "lugares"})
            </span>
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {lista.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => irPara(l)}
                className={cn(
                  "flex min-h-14 items-start gap-3 rounded-2xl border-2 p-4 text-left transition-colors",
                  ativo === l.id
                    ? "border-brand-600 bg-brand-50"
                    : l.destaque
                      ? "border-gold-400 bg-gold-50 hover:border-brand-400"
                      : "border-stone-200 bg-white hover:border-brand-400",
                )}
              >
                <span className="text-3xl leading-none">{l.emoji}</span>
                <span>
                  <span className="block text-lg font-bold text-stone-900">
                    {l.nome}
                  </span>
                  <span className="block text-base text-stone-600">
                    {[l.tipo, l.bairro].filter(Boolean).join(" · ")}
                  </span>
                  {ativo === l.id && l.grupo !== "CONDOMINIO" && l.endereco && (
                    <span className="mt-1 block text-base text-stone-600">
                      📍 {l.endereco}
                    </span>
                  )}
                  {ativo === l.id && l.obs && (
                    <span className="mt-1 block text-base text-stone-600">
                      {l.obs}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="rounded-2xl bg-stone-100 p-4 text-lg text-stone-600">
          👆 Escolha uma categoria acima para ver a lista com os nomes.
        </p>
      )}

      <p className="text-base text-stone-500">
        Lista de referência montada pela FC Imóveis (out/2026) com dados do
        Google Maps e do OpenStreetMap. Não inclui todos os estabelecimentos da
        cidade; endereços e horários podem mudar.
      </p>
    </div>
  );
}

function BotaoCategoria({
  ativo,
  onClick,
  emoji,
  label,
  total,
}: {
  ativo: boolean;
  onClick: () => void;
  emoji: string;
  label: string;
  total: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={cn(
        "inline-flex min-h-12 items-center gap-2 rounded-full border-2 px-4 text-lg font-semibold transition-colors",
        ativo
          ? "border-brand-700 bg-brand-700 text-white"
          : "border-stone-300 bg-white text-stone-800 hover:border-brand-400",
      )}
    >
      <span aria-hidden="true">{emoji}</span>
      <span>{label}</span>
      <span
        className={cn(
          "rounded-full px-2 text-base font-bold",
          ativo ? "bg-white/20 text-white" : "bg-stone-100 text-stone-600",
        )}
      >
        {total}
      </span>
    </button>
  );
}
