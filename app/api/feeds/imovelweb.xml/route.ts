import { serveFeed } from "@/lib/feeds/serve";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Feed para o portal Imovelweb (formato VRSync). */
export async function GET() {
  return serveFeed("IMOVELWEB", ["IMOVELWEB"]);
}
