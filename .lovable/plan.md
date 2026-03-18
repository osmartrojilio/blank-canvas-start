

## Configurar domínio Resend na Hostinger

Para parar de usar `onboarding@resend.dev` e enviar e-mails como `noreply@gerenciarfrotas.com.br`, você precisa verificar o domínio no painel do Resend e adicionar os registros DNS na Hostinger.

### Passo a passo

**1. No painel do Resend (resend.com/domains):**
- Clique em **Add Domain**
- Digite: `gerenciarfrotas.com.br`
- O Resend vai gerar uma lista de registros DNS (geralmente 3 registros):
  - **2 registros CNAME** (para DKIM)
  - **1 registro TXT** (para SPF/verificação)

**2. Na Hostinger (hPanel → DNS Zone Editor):**
- Acesse **Domínios → gerenciarfrotas.com.br → DNS / Nameservers → Gerenciar registros DNS**
- Adicione cada registro exatamente como o Resend mostra (tipo, nome, valor)
- Salve

**3. De volta no Resend:**
- Clique em **Verify** no domínio
- A propagação pode levar de minutos a 48h

**4. Após verificação (eu faço no código):**
- Atualizar o remetente nas Edge Functions de `onboarding@resend.dev` para `noreply@gerenciarfrotas.com.br` (ou o endereço que preferir)
- Arquivos afetados:
  - `supabase/functions/send-verification-code/index.ts`
  - `supabase/functions/verify-email-code/index.ts`
  - `supabase/functions/send-invitation-email/index.ts`

### Resumo
Não há mudança de código agora — primeiro você precisa adicionar os registros DNS na Hostinger e verificar o domínio no Resend. Depois me avise que está verificado e eu atualizo o remetente em todas as funções.

