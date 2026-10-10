import { serveFeed } from "@/lib/feeds/serve";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Feed Canal Pro (Grupo OLX): ZAP Imóveis + VivaReal + OLX, num só XML. */
export async function GET() {
  return serveFeed("CANALPRO", ["ZAP", "VIVAREAL", "OLX"]);
}
