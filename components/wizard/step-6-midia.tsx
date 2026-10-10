"use client";

import { toast } from "@/components/ui/toast";
import type { WizardProperty } from "@/lib/wizard-dto";
import { PhotoGrid } from "./photo-grid";
import { PhotoUploader } from "./photo-uploader";
import { useStepSave } from "./use-step-save";
import { VideoUploader } from "./video-uploader";
import { WizardNav } from "./wizard-nav";

export function Step6Midia({
  property,
  watermarkDefault,
}: {
  property: WizardProperty;
  watermarkDefault: boolean;
  step?: number;
}) {
  const { save, saving, savedAt } = useStepSave(property.id);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await save({}, 6, { goTo: 7 });
      }}
      className="space-y-8"
    >
      <section>
        <h2 className="mb-1 text-xl font-bold text-stone-900">
          Fotos do imóvel
        </h2>
        <p className="mb-4 text-base text-stone-600">
          As fotos são tratadas automaticamente (tamanho e qualidade)
          {watermarkDefault && " e recebem a marca d'água da imobiliária"}. Você
          pode ajustar foto por foto depois do envio.
        </p>
        <PhotoUploader uploadUrl={`/api/imoveis/${property.id}/fotos`} />
        <div className="mt-6">
          <PhotoGrid propertyId={property.id} photos={property.photos} />
        </div>
      </section>

      <section className="border-t-2 border-stone-100 pt-6">
        <h2 className="mb-1 text-xl font-bold text-stone-900">
          Vídeo do imóvel
        </h2>
        <p className="mb-4 text-base text-stone-600">
          Opcional, mas ajuda muito o anúncio. Grave na horizontal, com calma,
          mostrando os ambientes.
        </p>
        <VideoUploader
          videoUrl={`/api/imoveis/${property.id}/video`}
          video={property.video}
        />
      </section>

      <WizardNav
        propertyId={property.id}
        step={6}
        saving={saving}
        savedAt={savedAt}
        onSaveDraft={async () => {
          const ok = await save({}, 6);
          if (ok) toast("Rascunho salvo!");
        }}
      />
    </form>
  );
}
