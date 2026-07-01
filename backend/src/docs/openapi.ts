/* eslint-disable @typescript-eslint/no-explicit-any */
const bearerAuth = { bearerAuth: [] as string[] };
const adminAuth = { adminAuth: [] as string[] };

const idParam = (name: string, desc: string) => ({
  name,
  in: "path" as const,
  required: true,
  schema: { type: "string" },
  description: desc
});

const pageParams = [
  {
    name: "pageNumber",
    in: "query",
    schema: { type: "string" },
    description: "Página (padrão: 1)"
  },
  {
    name: "searchParam",
    in: "query",
    schema: { type: "string" },
    description: "Busca textual"
  }
];

const ok = (desc: string, schema?: any) => ({
  200: {
    description: desc,
    content: schema ? { "application/json": { schema } } : undefined
  },
  401: { description: "Não autenticado" },
  403: { description: "Acesso negado" }
});

const created = (desc: string) => ({
  200: { description: desc },
  201: { description: desc },
  400: { description: "Dados inválidos" },
  401: { description: "Não autenticado" },
  403: { description: "Acesso negado" }
});

const noContent = () => ({
  200: { description: "Operação realizada com sucesso" },
  401: { description: "Não autenticado" },
  403: { description: "Acesso negado" },
  404: { description: "Não encontrado" }
});

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "CRM API",
    version: "1.0.0",
    description:
      "API REST multi-tenant do CRM. Autenticação via Bearer JWT (obtido em `POST /auth/login`). " +
      "A maioria dos endpoints requer o header `Authorization: Bearer <token>`. " +
      "A API externa usa token próprio via query param `token`."
  },
  servers: [
    {
      url: "{backendUrl}/api/v1",
      variables: {
        backendUrl: {
          default: "http://localhost:3100",
          description: "URL base do backend (BACKEND_URL)"
        }
      }
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Token JWT obtido em POST /auth/login"
      },
      adminAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Token JWT de superadmin"
      },
      apiToken: {
        type: "apiKey",
        in: "header",
        name: "Authorization",
        description: "Token de API externa (api-config)"
      }
    },
    schemas: {
      Error: {
        type: "object",
        properties: { error: { type: "string", example: "ERR_FORBIDDEN" } }
      },
      PaginatedMeta: {
        type: "object",
        properties: {
          count: { type: "integer", example: 42 },
          hasMore: { type: "boolean", example: true }
        }
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "João Silva" },
          email: { type: "string", format: "email" },
          profile: { type: "string", enum: ["admin", "user", "superadmin"] },
          tenantId: { type: "integer" },
          isOnline: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      Contact: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          number: { type: "string", example: "5511999990000" },
          email: { type: "string", format: "email", nullable: true },
          profilePicUrl: { type: "string", nullable: true },
          isGroup: { type: "boolean" },
          tenantId: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      Ticket: {
        type: "object",
        properties: {
          id: { type: "integer" },
          status: { type: "string", enum: ["open", "pending", "closed"] },
          unreadMessages: { type: "integer" },
          lastMessage: { type: "string", nullable: true },
          contactId: { type: "integer" },
          userId: { type: "string", format: "uuid", nullable: true },
          whatsappId: { type: "integer", nullable: true },
          queueId: { type: "integer", nullable: true },
          tenantId: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      Message: {
        type: "object",
        properties: {
          id: { type: "string" },
          body: { type: "string" },
          fromMe: { type: "boolean" },
          mediaUrl: { type: "string", nullable: true },
          mediaType: { type: "string", nullable: true },
          read: { type: "boolean" },
          ticketId: { type: "integer" },
          contactId: { type: "integer", nullable: true },
          createdAt: { type: "string", format: "date-time" }
        }
      },
      Whatsapp: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          status: {
            type: "string",
            enum: ["CONNECTED", "DISCONNECTED", "qrcode", "OPENING"]
          },
          qrcode: { type: "string", nullable: true },
          channel: { type: "string", enum: ["baileys", "meta", "360dialog"] },
          tenantId: { type: "integer" }
        }
      },
      Queue: {
        type: "object",
        properties: {
          id: { type: "integer" },
          queue: { type: "string" },
          isActive: { type: "boolean" },
          userId: { type: "string", format: "uuid", nullable: true },
          tenantId: { type: "integer" }
        }
      },
      Tag: {
        type: "object",
        properties: {
          id: { type: "integer" },
          tag: { type: "string" },
          color: { type: "string", example: "#FF5733" },
          tenantId: { type: "integer" }
        }
      },
      FastReply: {
        type: "object",
        properties: {
          id: { type: "integer" },
          key: { type: "string" },
          message: { type: "string" },
          tenantId: { type: "integer" }
        }
      },
      Setting: {
        type: "object",
        properties: {
          key: { type: "string" },
          value: { type: "string" },
          tenantId: { type: "integer" }
        }
      }
    }
  },
  tags: [
    { name: "Auth", description: "Autenticação e sessão" },
    { name: "Users", description: "Gerenciamento de usuários" },
    { name: "Contacts", description: "Gerenciamento de contatos" },
    { name: "Tickets", description: "Atendimentos" },
    { name: "Messages", description: "Mensagens de atendimento" },
    { name: "WhatsApp", description: "Canais WhatsApp" },
    { name: "WhatsApp Session", description: "Sessões QR/reconnect" },
    {
      name: "WhatsApp Meta OAuth",
      description: "OAuth WhatsApp Business via Meta"
    },
    { name: "Webhooks", description: "Webhooks de plataformas externas" },
    { name: "Settings", description: "Configurações do tenant" },
    { name: "Queues", description: "Filas de atendimento" },
    { name: "Tags", description: "Etiquetas" },
    { name: "Fast Reply", description: "Respostas rápidas" },
    { name: "Auto Reply", description: "Respostas automáticas e chatbot" },
    { name: "Chat Flow", description: "Fluxos de chatbot" },
    { name: "Campaigns", description: "Campanhas de disparo em massa" },
    { name: "Campaign Contacts", description: "Contatos de campanhas" },
    { name: "Statistics", description: "Relatórios e estatísticas" },
    { name: "API Config", description: "Configurações de API externa" },
    { name: "API External", description: "API pública para disparo via token" },
    { name: "Tenant", description: "Horários, e-mail e logo do tenant" },
    { name: "Billing", description: "Faturamento e assinaturas (Asaas)" },
    { name: "Admin", description: "Painel superadmin" },
    {
      name: "Delivery - Catalog",
      description: "Catálogo de produtos e categorias"
    },
    { name: "Delivery - Address", description: "Endereços e zonas de entrega" },
    {
      name: "Delivery - Orders",
      description: "Pedidos e pagamentos de entrega"
    },
    { name: "Sales - Customers", description: "Clientes e consulta CNPJ" },
    { name: "Sales - Pipeline", description: "Pipeline de vendas e propostas" },
    {
      name: "Service Orders",
      description: "Ordens de serviço, inventário e técnicos"
    },
    {
      name: "Monitoring",
      description: "Monitoramento de pragas (armadilhas, plantas baixas)"
    },
    { name: "Base Registers", description: "Cadastros base por módulo" },
    { name: "Attendance Types", description: "Tipos de atendimento" }
  ],
  paths: {
    // ── AUTH ──────────────────────────────────────────────────────────────────
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Autenticar usuário e obter token JWT",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", format: "password" },
                  mfaCode: {
                    type: "string",
                    description: "OTP de 6 dígitos (obrigatório se MFA ativo)"
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Login realizado com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    token: { type: "string" },
                    user: { $ref: "#/components/schemas/User" },
                    usuariosOnline: { type: "array", items: { type: "object" } }
                  }
                }
              }
            }
          },
          401: { description: "Credenciais inválidas ou MFA obrigatório" }
        }
      }
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Encerrar sessão atual",
        security: [bearerAuth],
        responses: { ...noContent() }
      }
    },
    "/auth/refresh_token": {
      post: {
        tags: ["Auth"],
        summary: "Renovar token JWT via refresh token (cookie jrt)",
        responses: {
          200: {
            description: "Token renovado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    token: { type: "string" },
                    user: { $ref: "#/components/schemas/User" }
                  }
                }
              }
            }
          },
          401: { description: "Refresh token ausente ou expirado" }
        }
      }
    },
    "/auth/branding": {
      get: {
        tags: ["Auth"],
        summary: "Obter branding público do tenant (logo, nome) pelo domínio",
        responses: {
          200: { description: "Dados de branding" }
        }
      }
    },
    "/auth/signup/plans": {
      get: {
        tags: ["Auth"],
        summary: "Listar planos disponíveis para cadastro",
        responses: { 200: { description: "Lista de planos" } }
      }
    },
    "/auth/signup": {
      post: {
        tags: ["Auth"],
        summary: "Cadastrar novo tenant e usuário admin",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password", "phone"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                  phone: { type: "string" },
                  planId: { type: "integer" }
                }
              }
            }
          }
        },
        responses: { ...created("Tenant criado") }
      }
    },
    "/auth/mfa/setup": {
      post: {
        tags: ["Auth"],
        summary: "Iniciar configuração de MFA (retorna QR code base32)",
        security: [bearerAuth],
        responses: {
          200: { description: "Dados de configuração MFA" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/auth/mfa/confirm": {
      post: {
        tags: ["Auth"],
        summary: "Confirmar código MFA e ativar autenticação em dois fatores",
        security: [bearerAuth],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["mfaCode"],
                properties: { mfaCode: { type: "string" } }
              }
            }
          }
        },
        responses: {
          200: { description: "MFA ativado" },
          400: { description: "Código inválido" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/auth/mfa/disable": {
      post: {
        tags: ["Auth"],
        summary: "Desativar MFA",
        security: [bearerAuth],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["password"],
                properties: { password: { type: "string" } }
              }
            }
          }
        },
        responses: {
          200: { description: "MFA desativado" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/auth/password-reset/request": {
      post: {
        tags: ["Auth"],
        summary: "Solicitar redefinição de senha (envia e-mail)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: { email: { type: "string", format: "email" } }
              }
            }
          }
        },
        responses: { 200: { description: "E-mail enviado (se conta existir)" } }
      }
    },
    "/auth/password-reset/confirm": {
      post: {
        tags: ["Auth"],
        summary: "Redefinir senha com token de e-mail",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token", "password"],
                properties: {
                  token: { type: "string" },
                  password: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Senha redefinida" },
          400: { description: "Token inválido ou expirado" }
        }
      }
    },

    // ── USERS ─────────────────────────────────────────────────────────────────
    "/users": {
      get: {
        tags: ["Users"],
        summary: "Listar usuários do tenant",
        security: [bearerAuth],
        parameters: pageParams,
        responses: {
          ...ok("Lista de usuários", {
            type: "object",
            properties: {
              users: {
                type: "array",
                items: { $ref: "#/components/schemas/User" }
              },
              count: { type: "integer" },
              hasMore: { type: "boolean" }
            }
          })
        }
      },
      post: {
        tags: ["Users"],
        summary: "Criar novo usuário (requer perfil admin)",
        security: [bearerAuth],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password", "profile"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                  profile: { type: "string", enum: ["admin", "user"] }
                }
              }
            }
          }
        },
        responses: { ...created("Usuário criado") }
      }
    },
    "/users/{userId}": {
      get: {
        tags: ["Users"],
        summary: "Obter dados de um usuário",
        security: [bearerAuth],
        parameters: [idParam("userId", "ID do usuário (UUID)")],
        responses: { ...ok("Usuário", { $ref: "#/components/schemas/User" }) }
      },
      put: {
        tags: ["Users"],
        summary: "Atualizar dados de um usuário",
        security: [bearerAuth],
        parameters: [idParam("userId", "ID do usuário")],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                  profile: { type: "string", enum: ["admin", "user"] }
                }
              }
            }
          }
        },
        responses: { ...noContent() }
      },
      delete: {
        tags: ["Users"],
        summary: "Remover usuário",
        security: [bearerAuth],
        parameters: [idParam("userId", "ID do usuário")],
        responses: { ...noContent() }
      }
    },
    "/users/{userId}/configs": {
      put: {
        tags: ["Users"],
        summary:
          "Atualizar configurações pessoais do usuário (permissões, preferências)",
        security: [bearerAuth],
        parameters: [idParam("userId", "ID do usuário")],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                description: "Objeto de configurações livre"
              }
            }
          }
        },
        responses: { ...noContent() }
      }
    },

    // ── CONTACTS ──────────────────────────────────────────────────────────────
    "/contacts": {
      get: {
        tags: ["Contacts"],
        summary: "Listar contatos do tenant",
        security: [bearerAuth],
        parameters: [
          ...pageParams,
          {
            name: "isGroup",
            in: "query",
            schema: { type: "boolean" },
            description: "Filtrar grupos"
          }
        ],
        responses: {
          ...ok("Lista de contatos", {
            type: "object",
            properties: {
              contacts: {
                type: "array",
                items: { $ref: "#/components/schemas/Contact" }
              },
              count: { type: "integer" },
              hasMore: { type: "boolean" }
            }
          })
        }
      },
      post: {
        tags: ["Contacts"],
        summary: "Criar contato",
        security: [bearerAuth],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "number"],
                properties: {
                  name: { type: "string" },
                  number: { type: "string", example: "5511999990000" },
                  email: { type: "string", format: "email" },
                  extraInfo: { type: "array", items: { type: "object" } }
                }
              }
            }
          }
        },
        responses: { ...created("Contato criado") }
      }
    },
    "/contacts/import": {
      post: {
        tags: ["Contacts"],
        summary: "Importar contatos do telefone (JSON)",
        security: [bearerAuth],
        responses: { ...created("Importação realizada") }
      }
    },
    "/contacts/upload": {
      post: {
        tags: ["Contacts"],
        summary: "Upload de planilha CSV para importar contatos",
        security: [bearerAuth],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: {
                    type: "array",
                    items: { type: "string", format: "binary" }
                  }
                }
              }
            }
          }
        },
        responses: { ...created("Contatos importados") }
      }
    },
    "/contacts/export": {
      post: {
        tags: ["Contacts"],
        summary: "Exportar contatos como arquivo",
        security: [bearerAuth],
        responses: {
          200: { description: "Arquivo exportado" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/contacts/sync": {
      post: {
        tags: ["Contacts"],
        summary: "Sincronizar contatos com o canal WhatsApp",
        security: [bearerAuth],
        responses: { ...created("Sincronização iniciada") }
      }
    },
    "/contacts/{contactId}": {
      get: {
        tags: ["Contacts"],
        summary: "Obter dados de um contato",
        security: [bearerAuth],
        parameters: [idParam("contactId", "ID do contato")],
        responses: {
          ...ok("Contato", { $ref: "#/components/schemas/Contact" })
        }
      },
      put: {
        tags: ["Contacts"],
        summary: "Atualizar contato",
        security: [bearerAuth],
        parameters: [idParam("contactId", "ID do contato")],
        responses: { ...noContent() }
      },
      delete: {
        tags: ["Contacts"],
        summary: "Remover contato",
        security: [bearerAuth],
        parameters: [idParam("contactId", "ID do contato")],
        responses: { ...noContent() }
      }
    },
    "/contact-tags/{contactId}": {
      put: {
        tags: ["Contacts"],
        summary: "Atualizar etiquetas de um contato",
        security: [bearerAuth],
        parameters: [idParam("contactId", "ID do contato")],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  tags: { type: "array", items: { type: "integer" } }
                }
              }
            }
          }
        },
        responses: { ...noContent() }
      }
    },
    "/contact-wallet/{contactId}": {
      put: {
        tags: ["Contacts"],
        summary: "Atualizar carteira (responsável) de um contato",
        security: [bearerAuth],
        parameters: [idParam("contactId", "ID do contato")],
        responses: { ...noContent() }
      }
    },

    // ── TICKETS ───────────────────────────────────────────────────────────────
    "/tickets": {
      get: {
        tags: ["Tickets"],
        summary: "Listar tickets",
        security: [bearerAuth],
        parameters: [
          ...pageParams,
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["open", "pending", "closed"] }
          },
          { name: "queueId", in: "query", schema: { type: "integer" } },
          { name: "userId", in: "query", schema: { type: "string" } },
          { name: "withoutUser", in: "query", schema: { type: "boolean" } },
          {
            name: "isNotAssignedUser",
            in: "query",
            schema: { type: "boolean" }
          },
          {
            name: "includeNotQueueDefined",
            in: "query",
            schema: { type: "boolean" }
          }
        ],
        responses: {
          ...ok("Lista de tickets", {
            type: "object",
            properties: {
              tickets: {
                type: "array",
                items: { $ref: "#/components/schemas/Ticket" }
              },
              count: { type: "integer" },
              hasMore: { type: "boolean" }
            }
          })
        }
      },
      post: {
        tags: ["Tickets"],
        summary: "Criar ticket",
        security: [bearerAuth],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["contactId", "status", "whatsappId"],
                properties: {
                  contactId: { type: "integer" },
                  status: { type: "string", enum: ["open", "pending"] },
                  whatsappId: { type: "integer" },
                  userId: { type: "string", format: "uuid" },
                  queueId: { type: "integer" }
                }
              }
            }
          }
        },
        responses: { ...created("Ticket criado") }
      }
    },
    "/tickets/{ticketId}": {
      get: {
        tags: ["Tickets"],
        summary: "Obter ticket por ID",
        security: [bearerAuth],
        parameters: [idParam("ticketId", "ID do ticket")],
        responses: { ...ok("Ticket", { $ref: "#/components/schemas/Ticket" }) }
      },
      put: {
        tags: ["Tickets"],
        summary: "Atualizar ticket (status, agente, fila etc.)",
        security: [bearerAuth],
        parameters: [idParam("ticketId", "ID do ticket")],
        responses: { ...noContent() }
      },
      delete: {
        tags: ["Tickets"],
        summary: "Remover ticket",
        security: [bearerAuth],
        parameters: [idParam("ticketId", "ID do ticket")],
        responses: { ...noContent() }
      }
    },
    "/tickets/{ticketId}/logs": {
      get: {
        tags: ["Tickets"],
        summary: "Listar logs de auditoria de um ticket",
        security: [bearerAuth],
        parameters: [idParam("ticketId", "ID do ticket")],
        responses: {
          200: { description: "Logs do ticket" },
          401: { description: "Não autenticado" }
        }
      }
    },

    // ── MESSAGES ──────────────────────────────────────────────────────────────
    "/messages/{ticketId}": {
      get: {
        tags: ["Messages"],
        summary: "Listar mensagens de um ticket",
        security: [bearerAuth],
        parameters: [
          idParam("ticketId", "ID do ticket"),
          { name: "pageNumber", in: "query", schema: { type: "string" } }
        ],
        responses: {
          ...ok("Mensagens", {
            type: "object",
            properties: {
              messages: {
                type: "array",
                items: { $ref: "#/components/schemas/Message" }
              },
              count: { type: "integer" },
              hasMore: { type: "boolean" }
            }
          })
        }
      },
      post: {
        tags: ["Messages"],
        summary: "Enviar mensagem em um ticket (suporta mídia via multipart)",
        security: [bearerAuth],
        parameters: [idParam("ticketId", "ID do ticket")],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  body: { type: "string", description: "Texto da mensagem" },
                  medias: {
                    type: "array",
                    items: { type: "string", format: "binary" }
                  }
                }
              }
            }
          }
        },
        responses: { ...created("Mensagem enviada") }
      }
    },
    "/messages/{messageId}": {
      delete: {
        tags: ["Messages"],
        summary: "Deletar mensagem",
        security: [bearerAuth],
        parameters: [idParam("messageId", "ID da mensagem")],
        responses: { ...noContent() }
      }
    },
    "/forward-messages/": {
      post: {
        tags: ["Messages"],
        summary: "Encaminhar mensagens para outro ticket",
        security: [bearerAuth],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["messagesIds", "ticketId"],
                properties: {
                  messagesIds: { type: "array", items: { type: "string" } },
                  ticketId: { type: "integer" }
                }
              }
            }
          }
        },
        responses: { ...created("Mensagens encaminhadas") }
      }
    },

    // ── WHATSAPP ──────────────────────────────────────────────────────────────
    "/whatsapp/": {
      get: {
        tags: ["WhatsApp"],
        summary: "Listar canais WhatsApp do tenant",
        security: [bearerAuth],
        responses: {
          ...ok("Canais", {
            type: "array",
            items: { $ref: "#/components/schemas/Whatsapp" }
          })
        }
      }
    },
    "/whatsapp": {
      post: {
        tags: ["WhatsApp"],
        summary: "Criar canal WhatsApp",
        security: [bearerAuth],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "channel"],
                properties: {
                  name: { type: "string" },
                  channel: {
                    type: "string",
                    enum: ["baileys", "meta", "360dialog"]
                  },
                  tokenAPI: { type: "string" },
                  phoneNumberId: { type: "string" },
                  wabaid: { type: "string" }
                }
              }
            }
          }
        },
        responses: { ...created("Canal criado") }
      }
    },
    "/whatsapp/{whatsappId}": {
      get: {
        tags: ["WhatsApp"],
        summary: "Obter canal por ID",
        security: [bearerAuth],
        parameters: [idParam("whatsappId", "ID do canal")],
        responses: { ...ok("Canal", { $ref: "#/components/schemas/Whatsapp" }) }
      },
      put: {
        tags: ["WhatsApp"],
        summary: "Atualizar canal",
        security: [bearerAuth],
        parameters: [idParam("whatsappId", "ID do canal")],
        responses: { ...noContent() }
      },
      delete: {
        tags: ["WhatsApp"],
        summary: "Remover canal (soft delete — marca isDeleted)",
        security: [bearerAuth],
        parameters: [idParam("whatsappId", "ID do canal")],
        responses: { ...noContent() }
      }
    },

    // ── WHATSAPP SESSION ──────────────────────────────────────────────────────
    "/whatsappsession/{whatsappId}": {
      post: {
        tags: ["WhatsApp Session"],
        summary: "Iniciar / reiniciar sessão WhatsApp (gera QR code)",
        security: [bearerAuth],
        parameters: [idParam("whatsappId", "ID do canal")],
        responses: {
          200: { description: "Sessão iniciada" },
          401: { description: "Não autenticado" }
        }
      },
      put: {
        tags: ["WhatsApp Session"],
        summary: "Reconectar sessão existente",
        security: [bearerAuth],
        parameters: [idParam("whatsappId", "ID do canal")],
        responses: {
          200: { description: "Reconexão solicitada" },
          401: { description: "Não autenticado" }
        }
      },
      delete: {
        tags: ["WhatsApp Session"],
        summary: "Desconectar sessão / fazer logout do WhatsApp",
        security: [bearerAuth],
        parameters: [idParam("whatsappId", "ID do canal")],
        responses: {
          200: { description: "Sessão encerrada" },
          401: { description: "Não autenticado" }
        }
      }
    },

    // ── WHATSAPP META OAUTH ───────────────────────────────────────────────────
    "/whatsapp/meta/signup": {
      get: {
        tags: ["WhatsApp Meta OAuth"],
        summary: "Obter URL de autorização OAuth do WhatsApp Business via Meta",
        security: [bearerAuth],
        responses: {
          200: { description: "URL de autorização" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/whatsapp/meta/callback": {
      get: {
        tags: ["WhatsApp Meta OAuth"],
        summary:
          "Callback OAuth Meta (acesso público — redirecionado pelo Meta)",
        parameters: [
          {
            name: "code",
            in: "query",
            schema: { type: "string" },
            description: "Código de autorização OAuth"
          }
        ],
        responses: {
          200: { description: "Autorização concluída" },
          400: { description: "Código inválido" }
        }
      }
    },

    // ── WEBHOOKS ─────────────────────────────────────────────────────────────
    "/wabahooks/meta/{token}": {
      get: {
        tags: ["Webhooks"],
        summary: "Verificação de webhook Meta (challenge)",
        parameters: [
          idParam("token", "Token de verificação do canal"),
          { name: "hub.mode", in: "query", schema: { type: "string" } },
          { name: "hub.verify_token", in: "query", schema: { type: "string" } },
          { name: "hub.challenge", in: "query", schema: { type: "string" } }
        ],
        responses: {
          200: { description: "Challenge retornado" },
          403: { description: "Token inválido" }
        }
      },
      post: {
        tags: ["Webhooks"],
        summary: "Receber evento de webhook Meta (mensagem, status etc.)",
        parameters: [idParam("token", "Token de verificação do canal")],
        requestBody: {
          content: { "application/json": { schema: { type: "object" } } }
        },
        responses: { 200: { description: "Evento processado" } }
      }
    },

    // ── SETTINGS ─────────────────────────────────────────────────────────────
    "/settings": {
      get: {
        tags: ["Settings"],
        summary: "Listar todas as configurações do tenant",
        security: [bearerAuth],
        responses: {
          ...ok("Configurações", {
            type: "array",
            items: { $ref: "#/components/schemas/Setting" }
          })
        }
      }
    },
    "/settings/{settingKey}": {
      put: {
        tags: ["Settings"],
        summary: "Atualizar valor de uma configuração",
        security: [bearerAuth],
        parameters: [idParam("settingKey", "Chave da configuração")],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["value"],
                properties: { value: { type: "string" } }
              }
            }
          }
        },
        responses: { ...noContent() }
      }
    },

    // ── QUEUES ────────────────────────────────────────────────────────────────
    "/queue": {
      get: {
        tags: ["Queues"],
        summary: "Listar filas do tenant",
        security: [bearerAuth],
        responses: {
          ...ok("Filas", {
            type: "array",
            items: { $ref: "#/components/schemas/Queue" }
          })
        }
      },
      post: {
        tags: ["Queues"],
        summary: "Criar fila",
        security: [bearerAuth],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["queue"],
                properties: {
                  queue: { type: "string" },
                  userId: { type: "string" }
                }
              }
            }
          }
        },
        responses: { ...created("Fila criada") }
      }
    },
    "/queue/{queueId}": {
      put: {
        tags: ["Queues"],
        summary: "Atualizar fila",
        security: [bearerAuth],
        parameters: [idParam("queueId", "ID da fila")],
        responses: { ...noContent() }
      },
      delete: {
        tags: ["Queues"],
        summary: "Remover fila",
        security: [bearerAuth],
        parameters: [idParam("queueId", "ID da fila")],
        responses: { ...noContent() }
      }
    },

    // ── TAGS ──────────────────────────────────────────────────────────────────
    "/tags": {
      get: {
        tags: ["Tags"],
        summary: "Listar etiquetas do tenant",
        security: [bearerAuth],
        responses: {
          ...ok("Etiquetas", {
            type: "array",
            items: { $ref: "#/components/schemas/Tag" }
          })
        }
      },
      post: {
        tags: ["Tags"],
        summary: "Criar etiqueta",
        security: [bearerAuth],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["tag", "color"],
                properties: {
                  tag: { type: "string" },
                  color: { type: "string" }
                }
              }
            }
          }
        },
        responses: { ...created("Etiqueta criada") }
      }
    },
    "/tags/{tagId}": {
      put: {
        tags: ["Tags"],
        summary: "Atualizar etiqueta",
        security: [bearerAuth],
        parameters: [idParam("tagId", "ID da etiqueta")],
        responses: { ...noContent() }
      },
      delete: {
        tags: ["Tags"],
        summary: "Remover etiqueta",
        security: [bearerAuth],
        parameters: [idParam("tagId", "ID da etiqueta")],
        responses: { ...noContent() }
      }
    },

    // ── FAST REPLY ────────────────────────────────────────────────────────────
    "/fastreply": {
      get: {
        tags: ["Fast Reply"],
        summary: "Listar respostas rápidas",
        security: [bearerAuth],
        responses: {
          ...ok("Respostas rápidas", {
            type: "array",
            items: { $ref: "#/components/schemas/FastReply" }
          })
        }
      },
      post: {
        tags: ["Fast Reply"],
        summary: "Criar resposta rápida",
        security: [bearerAuth],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["key", "message"],
                properties: {
                  key: { type: "string" },
                  message: { type: "string" }
                }
              }
            }
          }
        },
        responses: { ...created("Resposta criada") }
      }
    },
    "/fastreply/{fastReplyId}": {
      put: {
        tags: ["Fast Reply"],
        summary: "Atualizar resposta rápida",
        security: [bearerAuth],
        parameters: [idParam("fastReplyId", "ID da resposta")],
        responses: { ...noContent() }
      },
      delete: {
        tags: ["Fast Reply"],
        summary: "Remover resposta rápida",
        security: [bearerAuth],
        parameters: [idParam("fastReplyId", "ID da resposta")],
        responses: { ...noContent() }
      }
    },

    // ── AUTO REPLY ────────────────────────────────────────────────────────────
    "/auto-reply": {
      get: {
        tags: ["Auto Reply"],
        summary: "Listar regras de resposta automática",
        security: [bearerAuth],
        responses: {
          200: { description: "Lista de regras" },
          401: { description: "Não autenticado" }
        }
      },
      post: {
        tags: ["Auto Reply"],
        summary: "Criar regra de resposta automática",
        security: [bearerAuth],
        responses: { ...created("Regra criada") }
      }
    },
    "/auto-reply/{autoReplyId}": {
      put: {
        tags: ["Auto Reply"],
        summary: "Atualizar regra de resposta automática",
        security: [bearerAuth],
        parameters: [idParam("autoReplyId", "ID da regra")],
        responses: { ...noContent() }
      },
      delete: {
        tags: ["Auto Reply"],
        summary: "Remover regra de resposta automática",
        security: [bearerAuth],
        parameters: [idParam("autoReplyId", "ID da regra")],
        responses: { ...noContent() }
      }
    },
    "/auto-reply/{idAutoReply}/steps": {
      post: {
        tags: ["Auto Reply"],
        summary: "Adicionar etapa à regra de resposta automática",
        security: [bearerAuth],
        parameters: [idParam("idAutoReply", "ID da regra")],
        responses: { ...created("Etapa criada") }
      }
    },
    "/auto-reply/{idAutoReply}/steps/{stepsReplyId}": {
      put: {
        tags: ["Auto Reply"],
        summary: "Atualizar etapa",
        security: [bearerAuth],
        parameters: [
          idParam("idAutoReply", "ID da regra"),
          idParam("stepsReplyId", "ID da etapa")
        ],
        responses: { ...noContent() }
      },
      delete: {
        tags: ["Auto Reply"],
        summary: "Remover etapa",
        security: [bearerAuth],
        parameters: [
          idParam("idAutoReply", "ID da regra"),
          idParam("stepsReplyId", "ID da etapa")
        ],
        responses: { ...noContent() }
      }
    },
    "/auto-reply-action": {
      post: {
        tags: ["Auto Reply"],
        summary: "Criar ação em etapa de resposta automática",
        security: [bearerAuth],
        responses: { ...created("Ação criada") }
      }
    },
    "/auto-reply-action/{stepsReplyActionId}": {
      put: {
        tags: ["Auto Reply"],
        summary: "Atualizar ação",
        security: [bearerAuth],
        parameters: [idParam("stepsReplyActionId", "ID da ação")],
        responses: { ...noContent() }
      },
      delete: {
        tags: ["Auto Reply"],
        summary: "Remover ação",
        security: [bearerAuth],
        parameters: [idParam("stepsReplyActionId", "ID da ação")],
        responses: { ...noContent() }
      }
    },

    // ── CHAT FLOW ─────────────────────────────────────────────────────────────
    "/chat-flow": {
      get: {
        tags: ["Chat Flow"],
        summary: "Listar fluxos de chatbot",
        security: [bearerAuth],
        responses: {
          200: { description: "Lista de fluxos" },
          401: { description: "Não autenticado" }
        }
      },
      post: {
        tags: ["Chat Flow"],
        summary: "Criar fluxo de chatbot",
        security: [bearerAuth],
        responses: { ...created("Fluxo criado") }
      }
    },
    "/chat-flow/{chatFlowId}": {
      put: {
        tags: ["Chat Flow"],
        summary: "Atualizar fluxo",
        security: [bearerAuth],
        parameters: [idParam("chatFlowId", "ID do fluxo")],
        responses: { ...noContent() }
      },
      delete: {
        tags: ["Chat Flow"],
        summary: "Remover fluxo",
        security: [bearerAuth],
        parameters: [idParam("chatFlowId", "ID do fluxo")],
        responses: { ...noContent() }
      }
    },

    // ── CAMPAIGNS ─────────────────────────────────────────────────────────────
    "/campaigns": {
      get: {
        tags: ["Campaigns"],
        summary: "Listar campanhas",
        security: [bearerAuth],
        responses: {
          200: { description: "Lista de campanhas" },
          401: { description: "Não autenticado" }
        }
      },
      post: {
        tags: ["Campaigns"],
        summary: "Criar campanha (suporta mídias via multipart)",
        security: [bearerAuth],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["name", "message1"],
                properties: {
                  name: { type: "string" },
                  message1: { type: "string" },
                  message2: { type: "string" },
                  message3: { type: "string" },
                  medias: {
                    type: "array",
                    items: { type: "string", format: "binary" }
                  },
                  start: { type: "string", format: "date-time" },
                  closeTicket: { type: "boolean" }
                }
              }
            }
          }
        },
        responses: { ...created("Campanha criada") }
      }
    },
    "/campaigns/{campaignId}": {
      put: {
        tags: ["Campaigns"],
        summary: "Atualizar campanha",
        security: [bearerAuth],
        parameters: [idParam("campaignId", "ID da campanha")],
        responses: { ...noContent() }
      },
      delete: {
        tags: ["Campaigns"],
        summary: "Remover campanha",
        security: [bearerAuth],
        parameters: [idParam("campaignId", "ID da campanha")],
        responses: { ...noContent() }
      }
    },
    "/campaigns/start/{campaignId}": {
      post: {
        tags: ["Campaigns"],
        summary: "Iniciar disparo da campanha",
        security: [bearerAuth],
        parameters: [idParam("campaignId", "ID da campanha")],
        responses: {
          200: { description: "Campanha iniciada" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/campaigns/cancel/{campaignId}": {
      post: {
        tags: ["Campaigns"],
        summary: "Cancelar disparo da campanha",
        security: [bearerAuth],
        parameters: [idParam("campaignId", "ID da campanha")],
        responses: {
          200: { description: "Campanha cancelada" },
          401: { description: "Não autenticado" }
        }
      }
    },

    // ── CAMPAIGN CONTACTS ─────────────────────────────────────────────────────
    "/campaigns/contacts/{campaignId}": {
      get: {
        tags: ["Campaign Contacts"],
        summary: "Listar contatos de uma campanha",
        security: [bearerAuth],
        parameters: [idParam("campaignId", "ID da campanha")],
        responses: {
          200: { description: "Contatos da campanha" },
          401: { description: "Não autenticado" }
        }
      },
      post: {
        tags: ["Campaign Contacts"],
        summary: "Adicionar contato(s) à campanha",
        security: [bearerAuth],
        parameters: [idParam("campaignId", "ID da campanha")],
        responses: { ...created("Contatos adicionados") }
      }
    },
    "/campaigns/contacts/{campaignId}/{contactId}": {
      delete: {
        tags: ["Campaign Contacts"],
        summary: "Remover contato individual da campanha",
        security: [bearerAuth],
        parameters: [
          idParam("campaignId", "ID da campanha"),
          idParam("contactId", "ID do contato")
        ],
        responses: { ...noContent() }
      }
    },
    "/campaigns/deleteall/contacts/{campaignId}": {
      delete: {
        tags: ["Campaign Contacts"],
        summary: "Remover todos os contatos de uma campanha",
        security: [bearerAuth],
        parameters: [idParam("campaignId", "ID da campanha")],
        responses: { ...noContent() }
      }
    },

    // ── STATISTICS ────────────────────────────────────────────────────────────
    "/dash-tickets-queues": {
      get: {
        tags: ["Statistics"],
        summary: "Tickets abertos por fila (dashboard)",
        security: [bearerAuth],
        responses: {
          200: { description: "Dados do dashboard" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/contacts-report": {
      get: {
        tags: ["Statistics"],
        summary: "Relatório de contatos",
        security: [bearerAuth],
        responses: {
          200: { description: "Relatório de contatos" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/statistics-per-users": {
      get: {
        tags: ["Statistics"],
        summary: "Estatísticas de atendimento por agente",
        security: [bearerAuth],
        parameters: [
          {
            name: "startDate",
            in: "query",
            schema: { type: "string", format: "date" }
          },
          {
            name: "endDate",
            in: "query",
            schema: { type: "string", format: "date" }
          }
        ],
        responses: {
          200: { description: "Estatísticas por agente" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/statistics-tickets-times": {
      get: {
        tags: ["Statistics"],
        summary: "TMA e TME de tickets",
        security: [bearerAuth],
        responses: {
          200: { description: "Tempos médios" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/statistics-tickets-channels": {
      get: {
        tags: ["Statistics"],
        summary: "Tickets por canal",
        security: [bearerAuth],
        responses: {
          200: { description: "Distribuição por canal" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/statistics-tickets-evolution-channels": {
      get: {
        tags: ["Statistics"],
        summary: "Evolução de tickets por canal ao longo do tempo",
        security: [bearerAuth],
        responses: {
          200: { description: "Série temporal por canal" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/statistics-tickets-evolution-by-period": {
      get: {
        tags: ["Statistics"],
        summary: "Evolução de tickets por período",
        security: [bearerAuth],
        responses: {
          200: { description: "Série temporal por período" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/statistics-tickets-per-users-detail": {
      get: {
        tags: ["Statistics"],
        summary: "Detalhe de tickets por agente",
        security: [bearerAuth],
        responses: {
          200: { description: "Detalhe por agente" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/statistics-tickets-queue": {
      get: {
        tags: ["Statistics"],
        summary: "Tickets por fila",
        security: [bearerAuth],
        responses: {
          200: { description: "Distribuição por fila" },
          401: { description: "Não autenticado" }
        }
      }
    },

    // ── API CONFIG ────────────────────────────────────────────────────────────
    "/api-config": {
      get: {
        tags: ["API Config"],
        summary: "Listar configurações de API externa",
        security: [bearerAuth],
        responses: {
          200: { description: "Configurações" },
          401: { description: "Não autenticado" }
        }
      },
      post: {
        tags: ["API Config"],
        summary: "Criar configuração de API externa",
        security: [bearerAuth],
        responses: { ...created("Configuração criada") }
      }
    },
    "/api-config/{apiId}": {
      put: {
        tags: ["API Config"],
        summary: "Atualizar configuração de API externa",
        security: [bearerAuth],
        parameters: [idParam("apiId", "ID da configuração")],
        responses: { ...noContent() }
      },
      delete: {
        tags: ["API Config"],
        summary: "Remover configuração de API externa",
        security: [bearerAuth],
        parameters: [idParam("apiId", "ID da configuração")],
        responses: { ...noContent() }
      }
    },
    "/api-config/renew-token/{apiId}": {
      put: {
        tags: ["API Config"],
        summary: "Gerar novo token para a configuração de API",
        security: [bearerAuth],
        parameters: [idParam("apiId", "ID da configuração")],
        responses: {
          200: { description: "Novo token gerado" },
          401: { description: "Não autenticado" }
        }
      }
    },

    // ── API EXTERNAL ──────────────────────────────────────────────────────────
    "/v1/api/external/{apiId}": {
      post: {
        tags: ["API External"],
        summary:
          "Enviar mensagem via API externa (usa token de API, não Bearer JWT)",
        security: [{ apiToken: [] }],
        parameters: [idParam("apiId", "ID da configuração de API")],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["number", "body"],
                properties: {
                  number: { type: "string", example: "5511999990000" },
                  body: { type: "string" },
                  media: { type: "string", format: "binary" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Mensagem enviada" },
          401: { description: "Token inválido" },
          429: { description: "Rate limit excedido" }
        }
      }
    },
    "/v1/api/external/{apiId}/start-session": {
      post: {
        tags: ["API External"],
        summary: "Iniciar sessão WhatsApp via API externa",
        security: [{ apiToken: [] }],
        parameters: [idParam("apiId", "ID da configuração de API")],
        responses: {
          200: { description: "Sessão iniciada" },
          401: { description: "Token inválido" }
        }
      }
    },

    // ── TENANT ────────────────────────────────────────────────────────────────
    "/tenants/business-hours/": {
      get: {
        tags: ["Tenant"],
        summary: "Obter horários de atendimento e mensagem de fora do horário",
        security: [bearerAuth],
        responses: {
          200: { description: "Horários" },
          401: { description: "Não autenticado" }
        }
      },
      put: {
        tags: ["Tenant"],
        summary: "Atualizar horários de atendimento",
        security: [bearerAuth],
        responses: { ...noContent() }
      }
    },
    "/tenants/message-business-hours/": {
      put: {
        tags: ["Tenant"],
        summary: "Atualizar mensagem de fora do horário comercial",
        security: [bearerAuth],
        responses: { ...noContent() }
      }
    },
    "/tenants/email-settings": {
      get: {
        tags: ["Tenant"],
        summary: "Obter configurações de e-mail do tenant",
        security: [bearerAuth],
        responses: {
          200: { description: "Configurações de e-mail" },
          401: { description: "Não autenticado" }
        }
      },
      put: {
        tags: ["Tenant"],
        summary: "Atualizar configurações de e-mail (SMTP/Resend)",
        security: [bearerAuth],
        responses: { ...noContent() }
      }
    },
    "/tenants/email-settings/test": {
      post: {
        tags: ["Tenant"],
        summary: "Enviar e-mail de teste com as configurações atuais",
        security: [bearerAuth],
        responses: {
          200: { description: "E-mail de teste enviado" },
          401: { description: "Não autenticado" },
          429: { description: "Rate limit" }
        }
      }
    },
    "/tenants/email-logs": {
      get: {
        tags: ["Tenant"],
        summary: "Listar logs de e-mails enviados pelo tenant",
        security: [bearerAuth],
        responses: {
          200: { description: "Logs de e-mail" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/tenants/logo": {
      put: {
        tags: ["Tenant"],
        summary: "Atualizar logotipo do tenant (JPG ou PNG, máx 2 MB)",
        security: [bearerAuth],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: { logo: { type: "string", format: "binary" } }
              }
            }
          }
        },
        responses: {
          200: { description: "Logo atualizado" },
          400: { description: "Arquivo inválido" },
          401: { description: "Não autenticado" }
        }
      }
    },

    // ── BILLING ───────────────────────────────────────────────────────────────
    "/webhooks/asaas": {
      post: {
        tags: ["Billing"],
        summary:
          "Receber webhook de cobrança do Asaas (sem autenticação — verificado internamente)",
        responses: { 200: { description: "Evento processado" } }
      }
    },
    "/billing/plans": {
      get: {
        tags: ["Billing"],
        summary: "Listar planos de faturamento",
        security: [bearerAuth],
        responses: {
          200: { description: "Planos disponíveis" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/billing/subscription": {
      get: {
        tags: ["Billing"],
        summary: "Obter assinatura atual do tenant",
        security: [bearerAuth],
        responses: {
          200: { description: "Assinatura ativa" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/billing/payments": {
      post: {
        tags: ["Billing"],
        summary: "Criar pagamento / assinar plano",
        security: [bearerAuth],
        responses: { ...created("Pagamento criado") }
      }
    },

    // ── ADMIN ─────────────────────────────────────────────────────────────────
    "/admin/users": {
      get: {
        tags: ["Admin"],
        summary: "[Superadmin] Listar todos os usuários da plataforma",
        security: [adminAuth],
        responses: {
          200: { description: "Usuários" },
          401: { description: "Não autenticado" },
          403: { description: "Acesso negado" }
        }
      }
    },
    "/admin/users/{userId}": {
      put: {
        tags: ["Admin"],
        summary: "[Superadmin] Atualizar usuário",
        security: [adminAuth],
        parameters: [idParam("userId", "ID do usuário")],
        responses: { ...noContent() }
      }
    },
    "/admin/tenants": {
      get: {
        tags: ["Admin"],
        summary: "[Superadmin] Listar todos os tenants",
        security: [adminAuth],
        responses: {
          200: { description: "Tenants" },
          401: { description: "Não autenticado" }
        }
      },
      post: {
        tags: ["Admin"],
        summary: "[Superadmin] Criar tenant",
        security: [adminAuth],
        responses: { ...created("Tenant criado") }
      }
    },
    "/admin/tenants/{tenantId}": {
      put: {
        tags: ["Admin"],
        summary: "[Superadmin] Atualizar tenant (status, plano, expiração)",
        security: [adminAuth],
        parameters: [idParam("tenantId", "ID do tenant")],
        responses: { ...noContent() }
      }
    },
    "/admin/plans": {
      get: {
        tags: ["Admin"],
        summary: "[Superadmin] Listar planos",
        security: [adminAuth],
        responses: {
          200: { description: "Planos" },
          401: { description: "Não autenticado" }
        }
      },
      post: {
        tags: ["Admin"],
        summary: "[Superadmin] Criar plano",
        security: [adminAuth],
        responses: { ...created("Plano criado") }
      }
    },
    "/admin/plans/{planId}": {
      put: {
        tags: ["Admin"],
        summary: "[Superadmin] Atualizar plano",
        security: [adminAuth],
        parameters: [idParam("planId", "ID do plano")],
        responses: { ...noContent() }
      }
    },
    "/admin/chatflow/{tenantId}": {
      get: {
        tags: ["Admin"],
        summary: "[Superadmin] Listar fluxos de chatbot de um tenant",
        security: [adminAuth],
        parameters: [idParam("tenantId", "ID do tenant")],
        responses: {
          200: { description: "Fluxos" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/admin/settings/{tenantId}": {
      put: {
        tags: ["Admin"],
        summary: "[Superadmin] Atualizar configurações de um tenant",
        security: [adminAuth],
        parameters: [idParam("tenantId", "ID do tenant")],
        responses: { ...noContent() }
      }
    },
    "/admin/channels": {
      get: {
        tags: ["Admin"],
        summary: "[Superadmin] Listar todos os canais da plataforma",
        security: [adminAuth],
        responses: {
          200: { description: "Canais" },
          401: { description: "Não autenticado" }
        }
      },
      post: {
        tags: ["Admin"],
        summary: "[Superadmin] Criar canal",
        security: [adminAuth],
        responses: { ...created("Canal criado") }
      }
    },

    // ── DELIVERY - CATALOG ────────────────────────────────────────────────────
    "/delivery/categories": {
      get: {
        tags: ["Delivery - Catalog"],
        summary: "Listar categorias do catálogo",
        security: [bearerAuth],
        responses: {
          200: { description: "Categorias" },
          401: { description: "Não autenticado" }
        }
      },
      post: {
        tags: ["Delivery - Catalog"],
        summary: "Criar categoria",
        security: [bearerAuth],
        responses: { ...created("Categoria criada") }
      }
    },
    "/delivery/categories/{categoryId}": {
      put: {
        tags: ["Delivery - Catalog"],
        summary: "Atualizar categoria",
        security: [bearerAuth],
        parameters: [idParam("categoryId", "ID da categoria")],
        responses: { ...noContent() }
      },
      delete: {
        tags: ["Delivery - Catalog"],
        summary: "Remover categoria",
        security: [bearerAuth],
        parameters: [idParam("categoryId", "ID da categoria")],
        responses: { ...noContent() }
      }
    },
    "/delivery/products": {
      get: {
        tags: ["Delivery - Catalog"],
        summary: "Listar produtos",
        security: [bearerAuth],
        responses: {
          200: { description: "Produtos" },
          401: { description: "Não autenticado" }
        }
      },
      post: {
        tags: ["Delivery - Catalog"],
        summary: "Criar produto",
        security: [bearerAuth],
        responses: { ...created("Produto criado") }
      }
    },
    "/delivery/products/image": {
      post: {
        tags: ["Delivery - Catalog"],
        summary: "Upload de imagem de produto (JPG/PNG/WEBP, máx 5 MB)",
        security: [bearerAuth],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: { image: { type: "string", format: "binary" } }
              }
            }
          }
        },
        responses: {
          200: { description: "URL da imagem" },
          400: { description: "Tipo inválido" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/delivery/products/{productId}": {
      put: {
        tags: ["Delivery - Catalog"],
        summary: "Atualizar produto",
        security: [bearerAuth],
        parameters: [idParam("productId", "ID do produto")],
        responses: { ...noContent() }
      },
      delete: {
        tags: ["Delivery - Catalog"],
        summary: "Remover produto",
        security: [bearerAuth],
        parameters: [idParam("productId", "ID do produto")],
        responses: { ...noContent() }
      }
    },

    // ── DELIVERY - ADDRESS ────────────────────────────────────────────────────
    "/delivery/contacts/{contactId}/addresses": {
      get: {
        tags: ["Delivery - Address"],
        summary: "Listar endereços de um contato",
        security: [bearerAuth],
        parameters: [idParam("contactId", "ID do contato")],
        responses: {
          200: { description: "Endereços" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/delivery/addresses": {
      post: {
        tags: ["Delivery - Address"],
        summary: "Criar endereço de entrega",
        security: [bearerAuth],
        responses: { ...created("Endereço criado") }
      }
    },
    "/delivery/addresses/{addressId}": {
      put: {
        tags: ["Delivery - Address"],
        summary: "Atualizar endereço",
        security: [bearerAuth],
        parameters: [idParam("addressId", "ID do endereço")],
        responses: { ...noContent() }
      },
      delete: {
        tags: ["Delivery - Address"],
        summary: "Remover endereço",
        security: [bearerAuth],
        parameters: [idParam("addressId", "ID do endereço")],
        responses: { ...noContent() }
      }
    },
    "/delivery/zones": {
      get: {
        tags: ["Delivery - Address"],
        summary: "Listar zonas de entrega",
        security: [bearerAuth],
        responses: {
          200: { description: "Zonas" },
          401: { description: "Não autenticado" }
        }
      },
      post: {
        tags: ["Delivery - Address"],
        summary: "Criar zona de entrega",
        security: [bearerAuth],
        responses: { ...created("Zona criada") }
      }
    },
    "/delivery/zones/resolve": {
      get: {
        tags: ["Delivery - Address"],
        summary: "Resolver zona para um endereço",
        security: [bearerAuth],
        responses: {
          200: { description: "Zona resolvida" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/delivery/zones/{zoneId}": {
      put: {
        tags: ["Delivery - Address"],
        summary: "Atualizar zona",
        security: [bearerAuth],
        parameters: [idParam("zoneId", "ID da zona")],
        responses: { ...noContent() }
      },
      delete: {
        tags: ["Delivery - Address"],
        summary: "Remover zona",
        security: [bearerAuth],
        parameters: [idParam("zoneId", "ID da zona")],
        responses: { ...noContent() }
      }
    },

    // ── DELIVERY - ORDERS ─────────────────────────────────────────────────────
    "/delivery/orders": {
      get: {
        tags: ["Delivery - Orders"],
        summary: "Listar pedidos",
        security: [bearerAuth],
        responses: {
          200: { description: "Pedidos" },
          401: { description: "Não autenticado" }
        }
      },
      post: {
        tags: ["Delivery - Orders"],
        summary: "Criar pedido",
        security: [bearerAuth],
        responses: { ...created("Pedido criado") }
      }
    },
    "/delivery/orders/{orderId}/status": {
      put: {
        tags: ["Delivery - Orders"],
        summary: "Atualizar status do pedido",
        security: [bearerAuth],
        parameters: [idParam("orderId", "ID do pedido")],
        responses: { ...noContent() }
      }
    },
    "/delivery/orders/{orderId}/payments": {
      post: {
        tags: ["Delivery - Orders"],
        summary: "Registrar pagamento de pedido",
        security: [bearerAuth],
        parameters: [idParam("orderId", "ID do pedido")],
        responses: { ...created("Pagamento registrado") }
      }
    },
    "/delivery/order-payments/{paymentId}/status": {
      put: {
        tags: ["Delivery - Orders"],
        summary: "Atualizar status de pagamento",
        security: [bearerAuth],
        parameters: [idParam("paymentId", "ID do pagamento")],
        responses: { ...noContent() }
      }
    },

    // ── SALES - CUSTOMERS ─────────────────────────────────────────────────────
    "/sales/address/cep/{zipCode}": {
      get: {
        tags: ["Sales - Customers"],
        summary: "Consultar endereço por CEP",
        security: [bearerAuth],
        parameters: [idParam("zipCode", "CEP (8 dígitos)")],
        responses: {
          200: { description: "Endereço" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/sales/customers/cnpj/{cnpj}": {
      get: {
        tags: ["Sales - Customers"],
        summary: "Consultar empresa por CNPJ (Receita Federal)",
        security: [bearerAuth],
        parameters: [idParam("cnpj", "CNPJ (14 dígitos)")],
        responses: {
          200: { description: "Dados da empresa" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/sales/customers": {
      get: {
        tags: ["Sales - Customers"],
        summary: "Listar clientes",
        security: [bearerAuth],
        parameters: pageParams,
        responses: {
          200: { description: "Clientes" },
          401: { description: "Não autenticado" }
        }
      },
      post: {
        tags: ["Sales - Customers"],
        summary: "Criar cliente",
        security: [bearerAuth],
        responses: { ...created("Cliente criado") }
      }
    },
    "/sales/customers/{clientId}": {
      get: {
        tags: ["Sales - Customers"],
        summary: "Obter cliente",
        security: [bearerAuth],
        parameters: [idParam("clientId", "ID do cliente")],
        responses: {
          200: { description: "Cliente" },
          401: { description: "Não autenticado" }
        }
      },
      put: {
        tags: ["Sales - Customers"],
        summary: "Atualizar cliente",
        security: [bearerAuth],
        parameters: [idParam("clientId", "ID do cliente")],
        responses: { ...noContent() }
      },
      delete: {
        tags: ["Sales - Customers"],
        summary: "Remover cliente",
        security: [bearerAuth],
        parameters: [idParam("clientId", "ID do cliente")],
        responses: { ...noContent() }
      }
    },
    "/sales/customers/{clientId}/areas": {
      get: {
        tags: ["Sales - Customers"],
        summary: "Listar áreas de atuação do cliente",
        security: [bearerAuth],
        parameters: [idParam("clientId", "ID do cliente")],
        responses: {
          200: { description: "Áreas" },
          401: { description: "Não autenticado" }
        }
      },
      post: {
        tags: ["Sales - Customers"],
        summary: "Adicionar área de atuação",
        security: [bearerAuth],
        parameters: [idParam("clientId", "ID do cliente")],
        responses: { ...created("Área adicionada") }
      }
    },
    "/sales/customers/{clientId}/areas/{areaId}": {
      put: {
        tags: ["Sales - Customers"],
        summary: "Atualizar área",
        security: [bearerAuth],
        parameters: [
          idParam("clientId", "ID do cliente"),
          idParam("areaId", "ID da área")
        ],
        responses: { ...noContent() }
      },
      delete: {
        tags: ["Sales - Customers"],
        summary: "Remover área",
        security: [bearerAuth],
        parameters: [
          idParam("clientId", "ID do cliente"),
          idParam("areaId", "ID da área")
        ],
        responses: { ...noContent() }
      }
    },

    // ── SALES - PIPELINE ──────────────────────────────────────────────────────
    "/portal/proposals/{token}": {
      get: {
        tags: ["Sales - Pipeline"],
        summary: "Portal público — visualizar proposta por token",
        parameters: [idParam("token", "Token de acesso da proposta")],
        responses: {
          200: { description: "Proposta" },
          404: { description: "Não encontrada" }
        }
      }
    },
    "/portal/proposals/{token}/approve": {
      post: {
        tags: ["Sales - Pipeline"],
        summary: "Portal público — aprovar proposta",
        parameters: [idParam("token", "Token")],
        responses: {
          200: { description: "Proposta aprovada" },
          404: { description: "Não encontrada" }
        }
      }
    },
    "/portal/proposals/{token}/document": {
      get: {
        tags: ["Sales - Pipeline"],
        summary: "Portal público — baixar documento da proposta",
        parameters: [idParam("token", "Token")],
        responses: { 200: { description: "Documento PDF" } }
      }
    },
    "/portal/proposals/{token}/service-order": {
      get: {
        tags: ["Sales - Pipeline"],
        summary: "Portal público — visualizar ordem de serviço vinculada",
        parameters: [idParam("token", "Token")],
        responses: { 200: { description: "Ordem de serviço" } }
      }
    },
    "/sales/pipeline": {
      get: {
        tags: ["Sales - Pipeline"],
        summary: "Listar oportunidades do pipeline",
        security: [bearerAuth],
        parameters: pageParams,
        responses: {
          200: { description: "Oportunidades" },
          401: { description: "Não autenticado" }
        }
      },
      post: {
        tags: ["Sales - Pipeline"],
        summary: "Criar oportunidade",
        security: [bearerAuth],
        responses: { ...created("Oportunidade criada") }
      }
    },
    "/sales/pipeline-dashboard": {
      get: {
        tags: ["Sales - Pipeline"],
        summary: "Dashboard do pipeline (totais por etapa)",
        security: [bearerAuth],
        responses: {
          200: { description: "Dashboard" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/sales/pipeline-followups": {
      get: {
        tags: ["Sales - Pipeline"],
        summary: "Listar oportunidades com follow-up atrasado",
        security: [bearerAuth],
        responses: {
          200: { description: "Oportunidades" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/sales/pipeline-followups/run": {
      post: {
        tags: ["Sales - Pipeline"],
        summary: "Executar follow-ups automáticos pendentes",
        security: [bearerAuth],
        responses: {
          200: { description: "Follow-ups executados" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/sales/performance-goals": {
      get: {
        tags: ["Sales - Pipeline"],
        summary: "Listar metas de performance",
        security: [bearerAuth],
        responses: {
          200: { description: "Metas" },
          401: { description: "Não autenticado" }
        }
      },
      post: {
        tags: ["Sales - Pipeline"],
        summary: "Criar / atualizar meta de performance",
        security: [bearerAuth],
        responses: { ...created("Meta salva") }
      }
    },
    "/sales/performance-goals-dashboard": {
      get: {
        tags: ["Sales - Pipeline"],
        summary: "Dashboard de metas de performance",
        security: [bearerAuth],
        responses: {
          200: { description: "Dashboard de metas" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/sales/proposals/{proposalId}/document": {
      get: {
        tags: ["Sales - Pipeline"],
        summary: "Baixar documento PDF da proposta",
        security: [bearerAuth],
        parameters: [idParam("proposalId", "ID da proposta")],
        responses: {
          200: { description: "PDF" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/sales/proposals/{proposalId}": {
      put: {
        tags: ["Sales - Pipeline"],
        summary: "Atualizar proposta",
        security: [bearerAuth],
        parameters: [idParam("proposalId", "ID da proposta")],
        responses: { ...noContent() }
      }
    },
    "/sales/proposals/{proposalId}/convert-service-order": {
      post: {
        tags: ["Sales - Pipeline"],
        summary: "Converter proposta em ordem de serviço",
        security: [bearerAuth],
        parameters: [idParam("proposalId", "ID da proposta")],
        responses: { ...created("OS criada") }
      }
    },
    "/sales/pipeline/{opportunityId}": {
      get: {
        tags: ["Sales - Pipeline"],
        summary: "Obter oportunidade",
        security: [bearerAuth],
        parameters: [idParam("opportunityId", "ID da oportunidade")],
        responses: {
          200: { description: "Oportunidade" },
          401: { description: "Não autenticado" }
        }
      },
      put: {
        tags: ["Sales - Pipeline"],
        summary: "Atualizar oportunidade",
        security: [bearerAuth],
        parameters: [idParam("opportunityId", "ID da oportunidade")],
        responses: { ...noContent() }
      }
    },
    "/sales/pipeline/{opportunityId}/proposals": {
      get: {
        tags: ["Sales - Pipeline"],
        summary: "Listar propostas de uma oportunidade",
        security: [bearerAuth],
        parameters: [idParam("opportunityId", "ID da oportunidade")],
        responses: {
          200: { description: "Propostas" },
          401: { description: "Não autenticado" }
        }
      },
      post: {
        tags: ["Sales - Pipeline"],
        summary: "Criar proposta para oportunidade",
        security: [bearerAuth],
        parameters: [idParam("opportunityId", "ID da oportunidade")],
        responses: { ...created("Proposta criada") }
      }
    },
    "/sales/pipeline/{opportunityId}/convert-service-order": {
      post: {
        tags: ["Sales - Pipeline"],
        summary: "Converter oportunidade em ordem de serviço",
        security: [bearerAuth],
        parameters: [idParam("opportunityId", "ID da oportunidade")],
        responses: { ...created("OS criada") }
      }
    },

    // ── SERVICE ORDERS ────────────────────────────────────────────────────────
    "/service/attendants": {
      get: {
        tags: ["Service Orders"],
        summary: "Listar técnicos/atendentes",
        security: [bearerAuth],
        responses: {
          200: { description: "Técnicos" },
          401: { description: "Não autenticado" }
        }
      },
      post: {
        tags: ["Service Orders"],
        summary: "Criar técnico",
        security: [bearerAuth],
        responses: { ...created("Técnico criado") }
      }
    },
    "/service/attendants/{attendantId}": {
      put: {
        tags: ["Service Orders"],
        summary: "Atualizar técnico",
        security: [bearerAuth],
        parameters: [idParam("attendantId", "ID do técnico")],
        responses: { ...noContent() }
      }
    },
    "/service/teams": {
      get: {
        tags: ["Service Orders"],
        summary: "Listar equipes de serviço",
        security: [bearerAuth],
        responses: {
          200: { description: "Equipes" },
          401: { description: "Não autenticado" }
        }
      },
      post: {
        tags: ["Service Orders"],
        summary: "Criar equipe",
        security: [bearerAuth],
        responses: { ...created("Equipe criada") }
      }
    },
    "/service/teams/{serviceTeamId}": {
      put: {
        tags: ["Service Orders"],
        summary: "Atualizar equipe",
        security: [bearerAuth],
        parameters: [idParam("serviceTeamId", "ID da equipe")],
        responses: { ...noContent() }
      }
    },
    "/service/inventory": {
      get: {
        tags: ["Service Orders"],
        summary: "Listar itens de inventário",
        security: [bearerAuth],
        responses: {
          200: { description: "Inventário" },
          401: { description: "Não autenticado" }
        }
      },
      post: {
        tags: ["Service Orders"],
        summary: "Criar item de inventário",
        security: [bearerAuth],
        responses: { ...created("Item criado") }
      }
    },
    "/service/inventory-low-stock": {
      get: {
        tags: ["Service Orders"],
        summary: "Itens com estoque baixo",
        security: [bearerAuth],
        responses: {
          200: { description: "Itens com estoque baixo" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/service/inventory-movements": {
      get: {
        tags: ["Service Orders"],
        summary: "Histórico de movimentações de inventário",
        security: [bearerAuth],
        responses: {
          200: { description: "Movimentações" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/service/inventory-reports/consumption": {
      get: {
        tags: ["Service Orders"],
        summary: "Relatório de consumo de inventário",
        security: [bearerAuth],
        responses: {
          200: { description: "Consumo" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/service/inventory-reports/batches": {
      get: {
        tags: ["Service Orders"],
        summary: "Relatório de lotes de inventário",
        security: [bearerAuth],
        responses: {
          200: { description: "Lotes" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/service/inventory-reports/costs": {
      get: {
        tags: ["Service Orders"],
        summary: "Relatório de custos de inventário",
        security: [bearerAuth],
        responses: {
          200: { description: "Custos" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/service/inventory-audit": {
      get: {
        tags: ["Service Orders"],
        summary: "Logs de auditoria de inventário",
        security: [bearerAuth],
        responses: {
          200: { description: "Auditoria" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/service/financial-audit": {
      get: {
        tags: ["Service Orders"],
        summary: "Logs de auditoria financeira",
        security: [bearerAuth],
        responses: {
          200: { description: "Auditoria financeira" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/service/types-audit": {
      get: {
        tags: ["Service Orders"],
        summary: "Logs de auditoria de tipos de serviço",
        security: [bearerAuth],
        responses: {
          200: { description: "Auditoria de tipos" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/service/inventory/{itemId}": {
      put: {
        tags: ["Service Orders"],
        summary: "Atualizar item de inventário",
        security: [bearerAuth],
        parameters: [idParam("itemId", "ID do item")],
        responses: { ...noContent() }
      },
      delete: {
        tags: ["Service Orders"],
        summary: "Remover item de inventário",
        security: [bearerAuth],
        parameters: [idParam("itemId", "ID do item")],
        responses: { ...noContent() }
      }
    },
    "/service/inventory/{itemId}/adjust": {
      post: {
        tags: ["Service Orders"],
        summary: "Ajuste manual de estoque (entrada/saída)",
        security: [bearerAuth],
        parameters: [idParam("itemId", "ID do item")],
        responses: { ...created("Ajuste registrado") }
      }
    },
    "/service/pests": {
      get: {
        tags: ["Service Orders"],
        summary: "Listar pragas cadastradas",
        security: [bearerAuth],
        responses: {
          200: { description: "Pragas" },
          401: { description: "Não autenticado" }
        }
      },
      post: {
        tags: ["Service Orders"],
        summary: "Criar praga",
        security: [bearerAuth],
        responses: { ...created("Praga criada") }
      }
    },
    "/service/pests/{pestId}": {
      put: {
        tags: ["Service Orders"],
        summary: "Atualizar praga",
        security: [bearerAuth],
        parameters: [idParam("pestId", "ID da praga")],
        responses: { ...noContent() }
      },
      delete: {
        tags: ["Service Orders"],
        summary: "Remover praga",
        security: [bearerAuth],
        parameters: [idParam("pestId", "ID da praga")],
        responses: { ...noContent() }
      }
    },
    "/service/types": {
      get: {
        tags: ["Service Orders"],
        summary: "Listar tipos de serviço",
        security: [bearerAuth],
        responses: {
          200: { description: "Tipos" },
          401: { description: "Não autenticado" }
        }
      },
      post: {
        tags: ["Service Orders"],
        summary: "Criar tipo de serviço",
        security: [bearerAuth],
        responses: { ...created("Tipo criado") }
      }
    },
    "/service/types/{serviceTypeId}": {
      put: {
        tags: ["Service Orders"],
        summary: "Atualizar tipo de serviço",
        security: [bearerAuth],
        parameters: [idParam("serviceTypeId", "ID do tipo")],
        responses: { ...noContent() }
      },
      delete: {
        tags: ["Service Orders"],
        summary: "Remover tipo de serviço",
        security: [bearerAuth],
        parameters: [idParam("serviceTypeId", "ID do tipo")],
        responses: { ...noContent() }
      }
    },
    "/service/types/{serviceTypeId}/duplicate": {
      post: {
        tags: ["Service Orders"],
        summary: "Duplicar tipo de serviço",
        security: [bearerAuth],
        parameters: [idParam("serviceTypeId", "ID do tipo")],
        responses: { ...created("Tipo duplicado") }
      }
    },
    "/service/orders": {
      get: {
        tags: ["Service Orders"],
        summary: "Listar ordens de serviço",
        security: [bearerAuth],
        parameters: pageParams,
        responses: {
          200: { description: "Ordens" },
          401: { description: "Não autenticado" }
        }
      },
      post: {
        tags: ["Service Orders"],
        summary: "Criar ordem de serviço",
        security: [bearerAuth],
        responses: { ...created("OS criada") }
      }
    },
    "/service/orders/export": {
      get: {
        tags: ["Service Orders"],
        summary: "Exportar ordens de serviço (planilha)",
        security: [bearerAuth],
        responses: {
          200: { description: "Arquivo exportado" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/service/orders-dashboard": {
      get: {
        tags: ["Service Orders"],
        summary: "Dashboard de ordens de serviço",
        security: [bearerAuth],
        responses: {
          200: { description: "Dashboard" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/service/orders-financial-report": {
      get: {
        tags: ["Service Orders"],
        summary: "Relatório financeiro de OS",
        security: [bearerAuth],
        responses: {
          200: { description: "Relatório financeiro" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/service/orders-monthly-closing": {
      get: {
        tags: ["Service Orders"],
        summary: "Fechamento mensal financeiro",
        security: [bearerAuth],
        responses: {
          200: { description: "Fechamento mensal" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/service/orders-billing-reminders": {
      get: {
        tags: ["Service Orders"],
        summary: "OS candidatas a cobrança pendente",
        security: [bearerAuth],
        responses: {
          200: { description: "Cobranças pendentes" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/service/orders/{serviceOrderId}": {
      get: {
        tags: ["Service Orders"],
        summary: "Obter ordem de serviço",
        security: [bearerAuth],
        parameters: [idParam("serviceOrderId", "ID da OS")],
        responses: {
          200: { description: "OS" },
          401: { description: "Não autenticado" }
        }
      },
      put: {
        tags: ["Service Orders"],
        summary: "Atualizar OS completa",
        security: [bearerAuth],
        parameters: [idParam("serviceOrderId", "ID da OS")],
        responses: { ...noContent() }
      },
      patch: {
        tags: ["Service Orders"],
        summary: "Atualizar campos parciais da OS",
        security: [bearerAuth],
        parameters: [idParam("serviceOrderId", "ID da OS")],
        responses: { ...noContent() }
      }
    },
    "/service/orders/{serviceOrderId}/occurrence": {
      patch: {
        tags: ["Service Orders"],
        summary: "Registrar ocorrência na OS",
        security: [bearerAuth],
        parameters: [idParam("serviceOrderId", "ID da OS")],
        responses: { ...noContent() }
      }
    },
    "/service/orders/{serviceOrderId}/document": {
      get: {
        tags: ["Service Orders"],
        summary: "Baixar documento PDF público da OS",
        security: [bearerAuth],
        parameters: [idParam("serviceOrderId", "ID da OS")],
        responses: {
          200: { description: "PDF" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/service/orders/{serviceOrderId}/document/internal": {
      get: {
        tags: ["Service Orders"],
        summary: "Baixar documento interno da OS (com custos)",
        security: [bearerAuth],
        parameters: [idParam("serviceOrderId", "ID da OS")],
        responses: {
          200: { description: "PDF interno" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/service/orders/{serviceOrderId}/notify": {
      post: {
        tags: ["Service Orders"],
        summary: "Notificar cliente sobre a OS por e-mail",
        security: [bearerAuth],
        parameters: [idParam("serviceOrderId", "ID da OS")],
        responses: {
          200: { description: "Notificação enviada" },
          429: { description: "Rate limit" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/service/orders/{serviceOrderId}/billing-reminder": {
      post: {
        tags: ["Service Orders"],
        summary: "Enviar lembrete de cobrança ao cliente",
        security: [bearerAuth],
        parameters: [idParam("serviceOrderId", "ID da OS")],
        responses: {
          200: { description: "Lembrete enviado" },
          429: { description: "Rate limit" },
          401: { description: "Não autenticado" }
        }
      }
    },

    // ── MONITORING ────────────────────────────────────────────────────────────
    "/monitoring/trap-types": {
      get: {
        tags: ["Monitoring"],
        summary: "Listar tipos de armadilha",
        security: [bearerAuth],
        responses: {
          200: { description: "Tipos" },
          401: { description: "Não autenticado" }
        }
      },
      post: {
        tags: ["Monitoring"],
        summary: "Criar tipo de armadilha",
        security: [bearerAuth],
        responses: { ...created("Tipo criado") }
      }
    },
    "/monitoring/trap-types/{trapTypeId}": {
      put: {
        tags: ["Monitoring"],
        summary: "Atualizar tipo de armadilha",
        security: [bearerAuth],
        parameters: [idParam("trapTypeId", "ID do tipo")],
        responses: { ...noContent() }
      },
      delete: {
        tags: ["Monitoring"],
        summary: "Remover tipo de armadilha",
        security: [bearerAuth],
        parameters: [idParam("trapTypeId", "ID do tipo")],
        responses: { ...noContent() }
      }
    },
    "/monitoring/trap-conditions": {
      get: {
        tags: ["Monitoring"],
        summary: "Listar condições de armadilha",
        security: [bearerAuth],
        responses: {
          200: { description: "Condições" },
          401: { description: "Não autenticado" }
        }
      },
      post: {
        tags: ["Monitoring"],
        summary: "Criar condição",
        security: [bearerAuth],
        responses: { ...created("Condição criada") }
      }
    },
    "/monitoring/trap-conditions/{conditionId}": {
      put: {
        tags: ["Monitoring"],
        summary: "Atualizar condição",
        security: [bearerAuth],
        parameters: [idParam("conditionId", "ID da condição")],
        responses: { ...noContent() }
      }
    },
    "/monitoring/trap-actions": {
      get: {
        tags: ["Monitoring"],
        summary: "Listar ações de armadilha",
        security: [bearerAuth],
        responses: {
          200: { description: "Ações" },
          401: { description: "Não autenticado" }
        }
      },
      post: {
        tags: ["Monitoring"],
        summary: "Criar ação",
        security: [bearerAuth],
        responses: { ...created("Ação criada") }
      }
    },
    "/monitoring/trap-actions/{actionId}": {
      put: {
        tags: ["Monitoring"],
        summary: "Atualizar ação",
        security: [bearerAuth],
        parameters: [idParam("actionId", "ID da ação")],
        responses: { ...noContent() }
      }
    },
    "/monitoring/inspections": {
      get: {
        tags: ["Monitoring"],
        summary: "Listar vistorias / inspeções",
        security: [bearerAuth],
        responses: {
          200: { description: "Inspeções" },
          401: { description: "Não autenticado" }
        }
      },
      post: {
        tags: ["Monitoring"],
        summary: "Registrar vistoria",
        security: [bearerAuth],
        responses: { ...created("Vistoria registrada") }
      }
    },
    "/monitoring/floor-plans": {
      get: {
        tags: ["Monitoring"],
        summary: "Listar plantas baixas",
        security: [bearerAuth],
        responses: {
          200: { description: "Plantas baixas" },
          401: { description: "Não autenticado" }
        }
      },
      post: {
        tags: ["Monitoring"],
        summary: "Fazer upload de planta baixa (PDF/JPG/PNG/WEBP, máx 15 MB)",
        security: [bearerAuth],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: { file: { type: "string", format: "binary" } }
              }
            }
          }
        },
        responses: { ...created("Planta baixa salva") }
      }
    },
    "/monitoring/floor-plans/{floorPlanId}": {
      put: {
        tags: ["Monitoring"],
        summary: "Atualizar planta baixa",
        security: [bearerAuth],
        parameters: [idParam("floorPlanId", "ID da planta")],
        responses: { ...noContent() }
      },
      delete: {
        tags: ["Monitoring"],
        summary: "Remover planta baixa",
        security: [bearerAuth],
        parameters: [idParam("floorPlanId", "ID da planta")],
        responses: { ...noContent() }
      }
    },
    "/monitoring/points": {
      get: {
        tags: ["Monitoring"],
        summary: "Listar pontos de monitoramento",
        security: [bearerAuth],
        responses: {
          200: { description: "Pontos" },
          401: { description: "Não autenticado" }
        }
      },
      post: {
        tags: ["Monitoring"],
        summary: "Criar ponto(s) de monitoramento",
        security: [bearerAuth],
        responses: { ...created("Ponto(s) criado(s)") }
      }
    },
    "/monitoring/points/{pointId}": {
      put: {
        tags: ["Monitoring"],
        summary: "Atualizar ponto",
        security: [bearerAuth],
        parameters: [idParam("pointId", "ID do ponto")],
        responses: { ...noContent() }
      },
      delete: {
        tags: ["Monitoring"],
        summary: "Remover ponto",
        security: [bearerAuth],
        parameters: [idParam("pointId", "ID do ponto")],
        responses: { ...noContent() }
      }
    },
    "/monitoring/points/{pointId}/position": {
      put: {
        tags: ["Monitoring"],
        summary: "Posicionar ponto na planta baixa",
        security: [bearerAuth],
        parameters: [idParam("pointId", "ID do ponto")],
        responses: { ...noContent() }
      },
      delete: {
        tags: ["Monitoring"],
        summary: "Remover posição do ponto na planta",
        security: [bearerAuth],
        parameters: [idParam("pointId", "ID do ponto")],
        responses: { ...noContent() }
      }
    },

    // ── BASE REGISTERS ────────────────────────────────────────────────────────
    "/base-registers/audit": {
      get: {
        tags: ["Base Registers"],
        summary: "Logs de auditoria de cadastros base",
        security: [bearerAuth],
        responses: {
          200: { description: "Auditoria" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/base-registers/client-units": {
      get: {
        tags: ["Base Registers"],
        summary: "Listar unidades de cliente",
        security: [bearerAuth],
        responses: {
          200: { description: "Unidades" },
          401: { description: "Não autenticado" }
        }
      },
      post: {
        tags: ["Base Registers"],
        summary: "Criar unidade de cliente",
        security: [bearerAuth],
        responses: { ...created("Unidade criada") }
      }
    },
    "/base-registers/client-units/export": {
      get: {
        tags: ["Base Registers"],
        summary: "Exportar unidades de cliente",
        security: [bearerAuth],
        responses: {
          200: { description: "Exportação" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/base-registers/client-units/{unitId}": {
      put: {
        tags: ["Base Registers"],
        summary: "Atualizar unidade de cliente",
        security: [bearerAuth],
        parameters: [idParam("unitId", "ID da unidade")],
        responses: { ...noContent() }
      },
      delete: {
        tags: ["Base Registers"],
        summary: "Remover unidade de cliente",
        security: [bearerAuth],
        parameters: [idParam("unitId", "ID da unidade")],
        responses: { ...noContent() }
      }
    },
    "/base-registers/{module}": {
      get: {
        tags: ["Base Registers"],
        summary: "Listar registros base de um módulo",
        security: [bearerAuth],
        parameters: [
          idParam("module", "Identificador do módulo (ex: brands, materials)")
        ],
        responses: {
          200: { description: "Registros" },
          401: { description: "Não autenticado" }
        }
      },
      post: {
        tags: ["Base Registers"],
        summary: "Criar registro no módulo",
        security: [bearerAuth],
        parameters: [idParam("module", "Módulo")],
        responses: { ...created("Registro criado") }
      }
    },
    "/base-registers/{module}/export": {
      get: {
        tags: ["Base Registers"],
        summary: "Exportar registros do módulo",
        security: [bearerAuth],
        parameters: [idParam("module", "Módulo")],
        responses: {
          200: { description: "Exportação" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/base-registers/{module}/{registerId}": {
      put: {
        tags: ["Base Registers"],
        summary: "Atualizar registro do módulo",
        security: [bearerAuth],
        parameters: [
          idParam("module", "Módulo"),
          idParam("registerId", "ID do registro")
        ],
        responses: { ...noContent() }
      },
      delete: {
        tags: ["Base Registers"],
        summary: "Remover registro do módulo",
        security: [bearerAuth],
        parameters: [
          idParam("module", "Módulo"),
          idParam("registerId", "ID do registro")
        ],
        responses: { ...noContent() }
      }
    },

    // ── ATTENDANCE TYPES ──────────────────────────────────────────────────────
    "/attendance-types": {
      get: {
        tags: ["Attendance Types"],
        summary: "Listar tipos de atendimento",
        security: [bearerAuth],
        responses: {
          200: { description: "Tipos de atendimento" },
          401: { description: "Não autenticado" }
        }
      },
      post: {
        tags: ["Attendance Types"],
        summary: "Criar tipo de atendimento",
        security: [bearerAuth],
        responses: { ...created("Tipo criado") }
      }
    },
    "/attendance-types/audit": {
      get: {
        tags: ["Attendance Types"],
        summary: "Logs de auditoria de tipos de atendimento",
        security: [bearerAuth],
        responses: {
          200: { description: "Auditoria" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/attendance-types/export": {
      get: {
        tags: ["Attendance Types"],
        summary: "Exportar tipos de atendimento",
        security: [bearerAuth],
        responses: {
          200: { description: "Exportação" },
          401: { description: "Não autenticado" }
        }
      }
    },
    "/attendance-types/{id}": {
      get: {
        tags: ["Attendance Types"],
        summary: "Obter tipo de atendimento por ID",
        security: [bearerAuth],
        parameters: [idParam("id", "ID do tipo")],
        responses: {
          200: { description: "Tipo" },
          401: { description: "Não autenticado" }
        }
      },
      put: {
        tags: ["Attendance Types"],
        summary: "Atualizar tipo de atendimento",
        security: [bearerAuth],
        parameters: [idParam("id", "ID do tipo")],
        responses: { ...noContent() }
      },
      delete: {
        tags: ["Attendance Types"],
        summary: "Remover tipo de atendimento",
        security: [bearerAuth],
        parameters: [idParam("id", "ID do tipo")],
        responses: { ...noContent() }
      }
    },
    "/attendance-types/{id}/active": {
      patch: {
        tags: ["Attendance Types"],
        summary: "Ativar / desativar tipo de atendimento",
        security: [bearerAuth],
        parameters: [idParam("id", "ID do tipo")],
        responses: { ...noContent() }
      }
    }
  }
};
