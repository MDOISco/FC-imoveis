// Helper de chamadas à API usado pelos componentes de cliente.

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export async function apiFetch<T = unknown>(
  url: string,
  options?: {
    method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
    body?: unknown;
    /** Páginas PÚBLICAS (ex.: senha do link exclusivo) passam false: um 401
     *  ali é "senha errada", não "sessão da equipe expirou" — não pode jogar
     *  o cliente na tela de entrada do painel. */
    redirecionar401?: boolean;
  },
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: options?.method ?? "GET",
      headers:
        options?.body !== undefined
          ? { "Content-Type": "application/json" }
          : undefined,
      body:
        options?.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(
      "Sem conexão. Verifique a internet e tente novamente.",
      0,
    );
  }
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // respostas sem corpo
  }
  if (!res.ok) {
    const message =
      (data as { error?: string } | null)?.error ??
      "Algo deu errado. Tente novamente.";
    // Sessão expirada ou senha trocada: leva de volta à tela de entrada
    if (
      res.status === 401 &&
      options?.redirecionar401 !== false &&
      typeof window !== "undefined"
    ) {
      const de = encodeURIComponent(
        window.location.pathname + window.location.search,
      );
      window.location.assign(`/entrar?de=${de}`);
    }
    throw new ApiError(message, res.status, data);
  }
  return data as T;
}
