"use client";

import { useId, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { chaveNome } from "@/lib/cidade/nomes";
import { Input } from "./input";

/**
 * Campo de texto com sugestões em botões grandes (lista oficial de bairros,
 * condomínios…). A pessoa pode escolher uma sugestão ou seguir digitando um
 * nome que não está na lista.
 */
export function CampoSugestoes({
  id,
  value,
  onChange,
  onBlur,
  onFocus,
  sugestoes,
  destaque,
  maximo = 6,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  sugestoes: string[];
  destaque?: (nome: string) => boolean;
  maximo?: number;
  placeholder?: string;
}) {
  const listaId = useId();
  const [aberto, setAberto] = useState(false);
  const [marcado, setMarcado] = useState(-1);

  const opcoes = useMemo(() => {
    const termo = chaveNome(value);
    if (termo.length < 2) return [];
    const palavras = termo.split(" ");
    return sugestoes
      .filter((s) => {
        const k = chaveNome(s);
        return k !== termo && palavras.every((p) => k.includes(p));
      })
      .slice(0, maximo);
  }, [value, sugestoes, maximo]);

  const mostrar = aberto && opcoes.length > 0;

  function escolher(nome: string) {
    onChange(nome);
    setAberto(false);
    setMarcado(-1);
  }

  return (
    <div className="relative">
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={mostrar}
        aria-controls={listaId}
        aria-autocomplete="list"
        onChange={(e) => {
          onChange(e.target.value);
          setAberto(true);
          setMarcado(-1);
        }}
        onFocus={() => {
          setAberto(true);
          onFocus?.();
        }}
        onBlur={() => {
          setAberto(false);
          onBlur?.();
        }}
        onKeyDown={(e) => {
          if (!mostrar) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setMarcado((i) => (i + 1) % opcoes.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setMarcado((i) => (i <= 0 ? opcoes.length - 1 : i - 1));
          } else if (e.key === "Enter" && marcado >= 0) {
            e.preventDefault();
            escolher(opcoes[marcado]);
          } else if (e.key === "Escape") {
            setAberto(false);
          }
        }}
      />
      {mostrar && (
        <ul
          id={listaId}
          role="listbox"
          className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl border-2 border-stone-200 bg-white shadow-xl"
        >
          {opcoes.map((nome, i) => (
            <li key={nome} role="option" aria-selected={i === marcado}>
              <button
                type="button"
                tabIndex={-1}
                // mousedown: escolhe antes de o campo perder o foco
                onMouseDown={(e) => {
                  e.preventDefault();
                  escolher(nome);
                }}
                className={cn(
                  "flex min-h-12 w-full items-center gap-2 px-4 text-left text-lg text-stone-900 hover:bg-brand-50",
                  i === marcado && "bg-brand-50",
                )}
              >
                {destaque?.(nome) && (
                  <span aria-label="Destaque" className="text-gold-500">
                    ★
                  </span>
                )}
                {nome}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
