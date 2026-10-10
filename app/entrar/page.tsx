import { Suspense } from "react";
import { FormEntrar } from "./form-entrar";

export const dynamic = "force-dynamic";

export const metadata = { title: "Entrar" };

export default function EntrarPage() {
  return (
    <Suspense>
      <FormEntrar />
    </Suspense>
  );
}
