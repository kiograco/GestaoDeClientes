# E-mail transacional com Resend

## Credenciais

1. Crie uma API key restrita a envio no painel da Resend.
2. Armazene-a somente no ambiente do backend. Nunca prefixe a variavel com nomes expostos pelo frontend.
3. Configure e reinicie o backend:

```env
RESEND_API_KEY=re_xxxxxxxxx
MAIL_FROM=Ebenezer Saude Ambiental <os@ebenezersaudeambiental.com.br>
MAIL_REPLY_TO=atendimento@ebenezersaudeambiental.com.br
```

O endereco usado em `MAIL_FROM` precisa pertencer ao dominio verificado. Os enderecos padronizados sao `contato@`, `atendimento@`, `os@`, `financeiro@` e `suporte@ebenezersaudeambiental.com.br`. Eles nao precisam ser caixas de entrada para envio, mas `MAIL_REPLY_TO` deve receber mensagens.

## DNS e verificacao do dominio

No painel Resend, abra **Domains > Add Domain**, informe `ebenezersaudeambiental.com.br` e escolha a regiao de envio. Crie no provedor DNS exatamente os registros exibidos pela Resend. Os valores DKIM e Return-Path sao exclusivos da conta e, portanto, nao podem ser definidos no repositorio.

A tela normalmente apresenta estes registros:

| Finalidade | Tipo | Nome/host | Valor |
| --- | --- | --- | --- |
| DKIM | TXT | Nome indicado pela Resend (seletor `_domainkey`) | Chave publica indicada pela Resend |
| SPF do Return-Path | TXT | Subdominio `send` indicado pela Resend | Valor SPF indicado pela Resend, normalmente incluindo Amazon SES |
| Return-Path | MX | Mesmo subdominio `send` | Host e prioridade indicados pela Resend |

Nao substitua valores gerados por exemplos e nao crie dois registros SPF no mesmo host. Se ja houver SPF, mescle os mecanismos num unico TXT. Aguarde a propagacao e use **Verify DNS Records** ate o dominio aparecer como `Verified`. DMARC nao e exigido pela API, mas e recomendado iniciar com `p=none`, monitorar relatórios e endurecer a politica gradualmente.

## Banco e teste

Execute a migracao antes do primeiro envio:

```bash
npm --prefix backend run db:migrate
```

Um administrador autenticado pode enviar um teste somente para o proprio e-mail, evitando relay arbitrario:

```http
POST /tenants/email-settings/test
Authorization: Bearer <token>
```

Configure nome, resposta e assinatura por empresa em `PUT /tenants/email-settings`. Consulte falhas em `GET /tenants/email-logs?limit=50`; cada registro contem status, id retornado pelo provedor e mensagem de erro, sem armazenar corpo, token ou anexo.

## PDFs

Os anexos aceitos pelo servico central devem ser `Buffer`, ter nome sem caminho, MIME `application/pdf` e no maximo 10 MB:

```ts
await sendInspectionReport({
  tenantId,
  to: cliente.email,
  subject: "Relatorio tecnico",
  variables: { client_name: cliente.nome, report_type: "Laudo", reference: "OS 123" },
  attachments: [{ filename: "laudo-123.pdf", content: pdfBuffer, contentType: "application/pdf" }]
});
```

Notificacoes de OS por e-mail ja geram e anexam o PDF publico. Erros do provedor ficam em `email_logs` e tambem retornam no campo `failed.email` do fluxo de notificacao.

## Entregabilidade

Envie apenas mensagens transacionais esperadas, mantenha listas limpas, processe bounces/complaints antes de aumentar volume e acompanhe limites do plano no painel. O plano gratuito serve para homologacao e volume inicial, mas os limites vigentes devem ser conferidos na conta antes da entrada em producao.
