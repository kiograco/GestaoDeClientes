# Conta demo de ordens de serviço

Este projeto possui um seed opcional para criar uma empresa demo isolada para
exibição e testes da agenda de ordens de serviço.

## Dados de acesso

```text
E-mail: demo@ncprogrammers.local
Senha: 123456
Empresa: Empresa Demo OS
```

Use somente em ambiente local, homologação ou demonstração. Não use essa conta
em produção pública.

## Criar os dados

Com o backend compilado e o PostgreSQL ativo:

```sh
npm --prefix backend run build
npm --prefix backend run db:seed:demo
```

O seed cria dados fake e idempotentes:

- empresa demo com acesso ativo até 2099;
- usuário administrador demo;
- canal WhatsApp demo desconectado;
- clientes com perfil comercial e endereço;
- técnicos ativos;
- ordens de serviço distribuídas na agenda do próximo dia útil.

Se estiver executando fora do container e o `.env` usa `POSTGRES_HOST=postgres`,
rode o comando com `POSTGRES_HOST=localhost` quando o PostgreSQL estiver
exposto localmente.
