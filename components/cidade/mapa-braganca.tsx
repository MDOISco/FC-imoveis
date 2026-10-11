"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  CENTRO_BRAGANCA,
  PONTOS_TURISTICOS,
  type PontoTuristico,
} from "@/lib/cidade/pontos";
import { cn } from "@/lib/cn";

/**
 * Mapa interativo de Bragança Paulista (Leaflet + OpenStreetMap, sem chave).
 * O Leaflet mexe em `window`, então é carregado só no navegador (useEffect).
 */
export function MapaBraganca() {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Record<string, Marker>>({});
  const [pronto, setPronto] = useState(false);
  const [ativo, setAtivo] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelado || !divRef.current || mapRef.current) return;

      const map = L.map(divRef.current, {
        center: CENTRO_BRAGANCA,
        zoom: 14,
        scrollWheelZoom: false, // rolagem da página não "prende" no mapa
      });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      for (const p of PONTOS_TURISTICOS) {
        const icone = L.divIcon({
          className: "", // sem estilo padrão do Leaflet
          html: `<div style="display:flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:9999px;background:#fff;border:3px solid #166534;box-shadow:0 2px 8px rgba(0,0,0,.35);font-size:22px;line-height:1">${p.emoji}</div>`,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
          popupAnchor: [0, -24],
        });
        const marker = L.marker([p.lat, p.lng], { icon: icone, title: p.nome })
          .addTo(map)
          .bindPopup(
            `<div style="max-width:240px;font-size:15px;line-height:1.45"><strong style="font-size:16px">${p.emoji} ${p.nome}</strong><br/><span style="color:#57534e">${p.curiosidade}</span></div>`,
          );
        marker.on("click", () => setAtivo(p.id));
        markersRef.current[p.id] = marker;
      }

      mapRef.current = map;
      setPronto(true);
    })();
    return () => {
      cancelado = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  }, []);

  function irPara(p: PontoTuristico) {
    setAtivo(p.id);
    const map = mapRef.current;
    const marker = markersRef.current[p.id];
    if (!map || !marker) return;
    map.flyTo([p.lat, p.lng], 16, { duration: 0.8 });
    marker.openPopup();
    divRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="space-y-5">
      <div
        ref={divRef}
        className="h-[420px] w-full overflow-hidden rounded-3xl border-2 border-stone-200 sm:h-[520px]"
        role="application"
        aria-label="Mapa interativo de Bragança Paulista"
      >
        {!pronto && (
          <div className="flex h-full items-center justify-center bg-stone-100 text-lg text-stone-500">
            Carregando o mapa de Bragança… 🗺️
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {PONTOS_TURISTICOS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => irPara(p)}
            className={cn(
              "flex min-h-14 items-start gap-3 rounded-2xl border-2 p-4 text-left transition-colors",
              ativo === p.id
                ? "border-brand-600 bg-brand-50"
                : "border-stone-200 bg-white hover:border-brand-400",
            )}
          >
            <span className="text-3xl leading-none">{p.emoji}</span>
            <span>
              <span className="block text-lg font-bold text-stone-900">
                {p.nome}
              </span>
              <span className="block text-sm font-semibold uppercase tracking-wide text-brand-700">
                {p.categoria} · toque para ver no mapa
              </span>
              {ativo === p.id && (
                <span className="mt-1 block text-base text-stone-600">
                  {p.curiosidade}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
