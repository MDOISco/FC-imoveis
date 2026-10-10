import { serveFeed } from "@/lib/feeds/serve";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Feed para o portal Chaves na Mão (formato VRSync). */
export async function GET() {
  return serveFeed("CHAVES_NA_MAO", ["CHAVES_NA_MAO"]);
}
