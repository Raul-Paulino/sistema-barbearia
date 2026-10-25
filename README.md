# Barber & Co. – Sistema de agendamento para barbearia

Site de agendamento online para barbearia, com uma tela para o **cliente** e um painel para o **dono** (barbeiro). O cliente escolhe serviço, dia e horário, e a confirmação é feita pelo WhatsApp.

> **Demonstração:** [link do site publicado aqui]
> **Painel admin:** usuário `RaulAlves` · senha `raul123`

## Como funciona

**Cliente (`index.html`)**
- Escolhe o serviço e vê o total
- Escolhe a data (domingos bloqueados, agenda aberta por 60 dias) e um horário livre
- Preenche nome e WhatsApp (com máscara e validação)
- Ao agendar, o horário é reservado e o WhatsApp abre com a mensagem pronta para o barbeiro

**Barbeiro (`admin.html`)**
- Login com limite de 3 tentativas e bloqueio temporário
- Painel com números do dia, filtros por data e status e lista agrupada por dia
- Confirmar (abre o WhatsApp do cliente com a confirmação), cancelar (libera o horário no site) e reativar
- Botão para carregar dados de exemplo, útil para conhecer o painel

## Tecnologias

HTML, CSS e JavaScript puros, sem frameworks nem bibliotecas.

- Layout responsivo com CSS Grid e Flexbox
- Persistência com `localStorage`
- Senha do admin guardada como hash SHA-256 (Web Crypto API)
- Textos digitados pelo cliente são tratados antes de aparecer no painel, para evitar injeção de HTML
- Integração com WhatsApp pelo link `wa.me`

## Estrutura

```
├── index.html        Tela do cliente
├── admin.html        Login e painel do barbeiro
├── css/
│   ├── style.css     Visual do site
│   └── admin.css     Ajustes do painel
├── js/
│   ├── app.js        Serviços, horários, validação e envio
│   └── admin.js      Login e gerenciamento dos agendamentos
└── img/              (opcional) hero.jpg e fundo.jpg
```

## Como rodar

1. Baixe ou clone o projeto
2. Abra a pasta no VS Code e rode com a extensão **Live Server** (o login do admin precisa de `localhost` ou `https`)
3. Antes de usar de verdade, troque o número em `js/app.js`:

```js
const WHATSAPP_BARBEIRO = "5535999999999"; // 55 + DDD + número
```

## Limitações conhecidas

Este é um projeto de portfólio **sem backend**:

- Os agendamentos ficam no `localStorage`, ou seja, só no navegador que os criou. Um agendamento feito no celular de um cliente não aparece no painel de outro aparelho.
- O login do admin roda no navegador e pode ser contornado por quem inspecionar o código. Para uso real, a verificação precisa ficar em um servidor.

## Próximos passos

- [ ] Backend com banco de dados (agendamentos compartilhados entre aparelhos)
- [ ] Autenticação de verdade no servidor
- [ ] Serviços e horários editáveis pelo painel
- [ ] Aviso automático ao barbeiro (API do WhatsApp ou e-mail)

## Créditos

Fotos de [Redd Francisco](https://unsplash.com/@reddfrancisco) no [Unsplash](https://unsplash.com/license). Fontes: Fraunces e Manrope (Google Fonts).
