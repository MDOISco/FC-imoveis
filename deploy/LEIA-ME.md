# Colocando o FC Imóveis no ar — de graça (Oracle Cloud)

Este guia coloca o sistema na internet com **custo R$ 0/mês**, com um
endereço de teste (ex.: `fcimoveis.duckdns.org`) que a equipe já pode usar.
Quando o domínio oficial (Hostinger) chegar, a troca leva 5 minutos e
**nenhum dado é perdido**.

Tempo total: ~30 a 40 minutos (a maior parte é o cadastro na Oracle).

---

## Passo 1 — Criar a conta gratuita na Oracle Cloud (~15 min)

1. Acesse **https://www.oracle.com/br/cloud/free/** e clique em
   "Comece gratuitamente".
2. Preencha os dados. Vai pedir **cartão de crédito só para verificação**
   (não é cobrado; o que usamos aqui é do nível "Always Free", gratuito
   para sempre).
3. **Importante:** quando pedir a região principal ("home region"),
   escolha **Brazil East (Sao Paulo)**. Essa escolha não pode ser mudada
   depois.
4. Aguarde o e-mail de confirmação e entre no painel (console) da Oracle.

## Passo 2 — Criar o servidor (VM) (~10 min)

1. No console: menu ☰ → **Compute → Instances → Create instance**.
2. Nome: `fc-imoveis`.
3. Em **Image and shape**:
   - Image: **Ubuntu 22.04** (Canonical Ubuntu); se escolher o shape ARM,
     a imagem precisa ser a versão **aarch64**.
   - Shape: clique em "Change shape" → **Ampere (Arm)** →
     **VM.Standard.A1.Flex** → 2 OCPUs e 12 GB de RAM (dentro do
     gratuito). Se aparecer "out of capacity", tente outro horário ou
     reduza para 1 OCPU/6GB.
4. Em **Networking**, deixe criar a rede (VCN) nova e marque
   **Assign a public IPv4 address**.
5. Em **Add SSH keys**, escolha "Generate a key pair for me" e **baixe a
   chave privada** (guarde bem esse arquivo).
6. Clique **Create** e aguarde ficar verde (RUNNING). **Anote o
   "Public IP address"** — esse número é o endereço do servidor.

### Liberar as portas 80 e 443 (necessário para o site abrir)

1. Na página da instância, clique no link da **Virtual cloud network**.
2. **Security Lists** → clique na lista default → **Add Ingress Rules**:
   - Regra 1: Source CIDR `0.0.0.0/0` · IP Protocol **TCP** ·
     Destination Port Range **80**
   - Regra 2: igual, com porta **443**

## Passo 3 — Endereço de teste gratuito (DuckDNS) (~3 min)

1. Acesse **https://www.duckdns.org** e entre com uma conta Google.
2. Em "domains", digite por exemplo `fcimoveis` e clique **add domain**
   → você ganha `fcimoveis.duckdns.org`.
3. No campo **current ip**, cole o IP público da VM e clique **update ip**.

## Passo 4 — Instalar o sistema (1 comando) (~5 min)

1. Na página da instância na Oracle, use **Console connection →
   Launch Cloud Shell connection** (terminal pelo navegador), ou conecte
   por SSH com a chave baixada:
   `ssh -i chave-privada.key ubuntu@IP_PUBLICO`
2. Cole este comando (troque o domínio e defina a senha da equipe):

```bash
curl -fsSL https://raw.githubusercontent.com/MDOISco/FC-imoveis/claude/happy-meitner-2lkcyr/deploy/instalar.sh \
  | sudo bash -s -- fcimoveis.duckdns.org "SENHA-FORTE-DA-EQUIPE" --demo
```

- `--demo` carrega os imóveis de exemplo (bom para a equipe explorar).
  Para começar vazio, é só tirar o `--demo`.
3. Ao terminar, abra **https://fcimoveis.duckdns.org** → digite a senha →
   pronto! Os corretores já podem usar de qualquer lugar. 🎉
   A página pública de permutas fica em `/permutas` (sem senha).

## Quando chegar o domínio oficial (Hostinger)

1. No painel da Hostinger, crie um registro **DNS tipo A** do domínio
   (ex.: `sistema.fcimoveis.com.br`) apontando para o **IP público da VM**.
2. No servidor, rode: `sudo fc-dominio sistema.fcimoveis.com.br`
3. Pronto — mesmo servidor, mesmos dados, HTTPS automático no novo
   endereço. Atualize também o "Endereço público do sistema" em
   Configurações → Portais.

## Comandos do dia a dia (no servidor)

| Comando | O que faz |
|---|---|
| `sudo fc-atualizar` | Instala a versão mais nova do sistema (GitHub) |
| `sudo fc-dominio NOVO.DOMINIO` | Troca o domínio |
| `sudo systemctl status fc-imoveis` | Vê se o sistema está rodando |
| `sudo journalctl -u fc-imoveis -f` | Acompanha os logs ao vivo |

Backups automáticos diários (banco + fotos) ficam em
`/var/backups/fc-imoveis` (últimos 14 dias).

## Problemas comuns

- **"Out of capacity" ao criar a VM ARM**: a cota gratuita ARM de São
  Paulo esgota às vezes. Tente em outro horário, reduza para 1 OCPU/6GB,
  ou crie com shape **VM.Standard.E2.1.Micro** (x86, 1GB — funciona,
  porém mais apertado).
- **Site não abre**: confira as regras de porta 80/443 (Passo 2) e se o
  IP no DuckDNS está igual ao da VM.
- **Esqueci a senha da equipe**: no servidor, edite
  `/etc/systemd/system/fc-imoveis.service` (linha `DASHBOARD_SENHA`),
  depois `sudo systemctl daemon-reload && sudo systemctl restart fc-imoveis`.
