// Acesso da equipe por senha única (DASHBOARD_SENHA).
// Sem a variável definida, o sistema fica aberto (modo desenvolvimento local).
// Usa Web Crypto para funcionar tanto no middleware (edge) quanto no Node.

const SALT = "fc-imoveis-acesso-v1";

export const ACCESS_COOKIE = "fc_acesso";

export async function tokenForPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(`${SALT}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
