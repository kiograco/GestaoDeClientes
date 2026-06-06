# Ordens de Servico e Agendamento

Modulo inicial para gerenciar tecnicos, ordens de servico e agenda de visitas em tempo real.

## Como rodar

1. Execute as migrations do backend.
2. Inicie backend e frontend normalmente.
3. Acesse `Ordens de Serviço` no menu lateral.

## Backend

Rotas autenticadas:

- `GET /service/attendants`
- `POST /service/attendants`
- `PUT /service/attendants/:attendantId`
- `GET /service/orders`
- `GET /service/orders-dashboard`
- `GET /service/orders/:serviceOrderId`
- `POST /service/orders`
- `PUT /service/orders/:serviceOrderId`
- `GET /service/orders/:serviceOrderId/document`
- `GET /service/orders/:serviceOrderId/document/internal`
- `POST /service/orders/:serviceOrderId/notify`

As consultas sempre filtram por `tenantId`. Ordens usam `contactId` para reutilizar clientes existentes.

## Regras Implementadas

- Cliente obrigatorio.
- Tecnico deve pertencer ao mesmo tenant e estar ativo.
- Horario final deve ser maior que horario inicial.
- Ordens fora de rascunho precisam de inicio e fim.
- Conflito de agenda e validado no backend para o mesmo tecnico.
- Criacao e alteracoes registram historico em `ServiceOrderLogs`.
- Eventos Socket.IO sao emitidos em `${tenantId}:serviceOrders`.
- Documento PDF do cliente e gerado com `pdfkit` e nao inclui `internalObservation`.
- Documento PDF interno inclui `internalObservation` apenas para perfis autorizados.
- Dashboard agrega total, agendadas, concluidas, canceladas, atrasadas, tempo medio, taxa de cancelamento, status, prioridade, tipo de servico, tecnico e visitas por dia.
- Notificacoes podem usar canal interno, e-mail via Resend e WhatsApp quando existir ticket/canal do cliente.
- Drag and drop no calendario reagenda a ordem para outro horario do dia; botoes `+` e `-` ajustam a duracao em blocos de 30 minutos.

## Limites Desta Etapa

- WhatsApp depende de ticket existente para o cliente e canal ativo no tenant.
- E-mail depende de `RESEND_API_KEY` e `RESEND_FROM_EMAIL`.
- O resize visual foi iniciado por botoes de incremento; ainda nao ha alca livre de redimensionamento com mouse.
