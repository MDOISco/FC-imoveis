import { Toaster } from "@/components/ui/toast";

// Página de cliente com senha: fora do Google e sem menu do site —
// quem recebe o link vê SÓ o imóvel preparado para ele.
export const metadata = {
  title: { absolute: "Apresentação exclusiva · FC Imóveis" },
  robots: { index: false, follow: false },
};

export default function ExclusivoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-stone-50">
      {children}
      <Toaster />
    </div>
  );
}
