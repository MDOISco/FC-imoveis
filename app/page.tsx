import { redirect } from "next/navigation";

/**
 * Endereço principal do domínio = site público. O painel da equipe mora em
 * /painel (protegido por senha no middleware).
 */
export default function RaizPage() {
  redirect("/site");
}
