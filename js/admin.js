/* =========================================================
   BARBER & CO. – Etapa 4: login do admin
   Atenção: este login roda no navegador e serve para aprender
   e testar. Ele NÃO é seguro de verdade (veja o aviso no fim).
   ========================================================= */

// ---------- 1. CONFIGURAÇÃO ----------
const USUARIO_ADMIN = "raulalves";   // comparado sem diferenciar maiúsculas
const NOME_EXIBIDO  = "Raul";

// A senha NÃO fica escrita no código, só a "impressão digital" dela (SHA-256).
// Esta é a impressão digital de "raul123".
// Para trocar a senha: abra o site, aperte F12 > Console, digite
//     await gerarHash("minhaNovaSenha")
// e cole o resultado aqui embaixo.
const SENHA_HASH = "16f04c3e2876cf0054398f1093f0e6913ecb5064cb60ae6bee899c0e16f46418";

const MAX_ERROS      = 3;      // tentativas erradas antes de bloquear
const BLOQUEIO_SEG   = 30;     // tempo de bloqueio, em segundos
const CHAVE_SESSAO   = "adminLogado";
const CHAVE_TENTATIVAS = "tentativasAdmin";

// ---------- 2. ELEMENTOS ----------
const telaLogin   = document.getElementById("tela-login");
const telaPainel  = document.getElementById("tela-painel");
const formLogin   = document.getElementById("form-login");
const campoUsuario = document.getElementById("usuario");
const campoSenha   = document.getElementById("senha");
const btnVerSenha  = document.getElementById("btn-ver-senha");
const btnEntrar    = document.getElementById("btn-entrar");
const btnSair      = document.getElementById("btn-sair");
const caixaErro    = document.getElementById("erro-login");
const nomeAdmin    = document.getElementById("nome-admin");

// Elementos do painel
const listaAgenda   = document.getElementById("lista-agendamentos");
const filtroData    = document.getElementById("filtro-data");
const filtroStatus  = document.getElementById("filtro-status");
const btnLimpar     = document.getElementById("btn-limpar");
const estPendentes  = document.getElementById("est-pendentes");
const estConfirmados = document.getElementById("est-confirmados");
const estHoje       = document.getElementById("est-hoje");
const estValor      = document.getElementById("est-valor");

let relogio = null; // contador do bloqueio

// ---------- 3. HASH (SHA-256) ----------
async function gerarHash(texto) {
  const dados = new TextEncoder().encode(texto);
  const resultado = await crypto.subtle.digest("SHA-256", dados);
  return Array.from(new Uint8Array(resultado))
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
}

// ---------- 4. TENTATIVAS E BLOQUEIO ----------
function lerTentativas() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_TENTATIVAS)) || { erros: 0, bloqueadoAte: 0 };
  } catch (erro) {
    return { erros: 0, bloqueadoAte: 0 };
  }
}

function salvarTentativas(dados) {
  localStorage.setItem(CHAVE_TENTATIVAS, JSON.stringify(dados));
}

function segundosRestantes() {
  return Math.max(0, Math.ceil((lerTentativas().bloqueadoAte - Date.now()) / 1000));
}

// Se estiver bloqueado, mostra a contagem regressiva e trava o botão
function verificarBloqueio() {
  clearInterval(relogio);
  const faltam = segundosRestantes();

  if (faltam === 0) {
    btnEntrar.disabled = false;
    return;
  }

  btnEntrar.disabled = true;
  mostrarErro(`Muitas tentativas erradas. Tente de novo em ${faltam}s.`);

  relogio = setInterval(() => {
    const restante = segundosRestantes();
    if (restante === 0) {
      clearInterval(relogio);
      btnEntrar.disabled = false;
      caixaErro.hidden = true;
      // zera os erros depois do bloqueio
      salvarTentativas({ erros: 0, bloqueadoAte: 0 });
    } else {
      caixaErro.textContent = `Muitas tentativas erradas. Tente de novo em ${restante}s.`;
    }
  }, 1000);
}

// ---------- 5. TELAS ----------
function mostrarErro(mensagem) {
  caixaErro.textContent = mensagem;
  caixaErro.hidden = false;
}

function mostrarPainel() {
  nomeAdmin.textContent = NOME_EXIBIDO;
  telaLogin.hidden = true;
  telaPainel.hidden = false;
  btnSair.hidden = false;
  renderizarPainel();
}

function mostrarLogin() {
  telaPainel.hidden = true;
  telaLogin.hidden = false;
  btnSair.hidden = true;
  formLogin.reset();
  caixaErro.hidden = true;
  campoUsuario.focus();
}

// ---------- 6. LOGIN ----------
formLogin.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  if (segundosRestantes() > 0) return;   // ainda bloqueado

  const usuario = campoUsuario.value.trim().toLowerCase();
  const senha = campoSenha.value;

  if (!usuario || !senha) {
    mostrarErro("Digite o usuário e a senha.");
    return;
  }

  if (!window.crypto || !crypto.subtle) {
    mostrarErro("Abra o site pelo Live Server (127.0.0.1) para o login funcionar.");
    return;
  }

  const hashDigitado = await gerarHash(senha);
  const acertou = usuario === USUARIO_ADMIN && hashDigitado === SENHA_HASH;

  if (acertou) {
    salvarTentativas({ erros: 0, bloqueadoAte: 0 });
    sessionStorage.setItem(CHAVE_SESSAO, "sim");   // vale até fechar a aba
    mostrarPainel();
    return;
  }

  // Errou: conta a tentativa (a mensagem não diz se foi o usuário ou a senha)
  const dados = lerTentativas();
  dados.erros += 1;
  campoSenha.value = "";

  if (dados.erros >= MAX_ERROS) {
    dados.bloqueadoAte = Date.now() + BLOQUEIO_SEG * 1000;
    salvarTentativas(dados);
    verificarBloqueio();
  } else {
    salvarTentativas(dados);
    const sobraram = MAX_ERROS - dados.erros;
    mostrarErro(`Usuário ou senha incorretos. Restam ${sobraram} ${sobraram === 1 ? "tentativa" : "tentativas"}.`);
    campoSenha.focus();
  }
});

// Botão "Mostrar / Ocultar" da senha
btnVerSenha.addEventListener("click", () => {
  const escondida = campoSenha.type === "password";
  campoSenha.type = escondida ? "text" : "password";
  btnVerSenha.textContent = escondida ? "Ocultar" : "Mostrar";
  btnVerSenha.setAttribute("aria-label", escondida ? "Ocultar senha" : "Mostrar senha");
});

// Some o erro quando o usuário volta a digitar (menos durante o bloqueio)
formLogin.addEventListener("input", () => {
  if (segundosRestantes() === 0) caixaErro.hidden = true;
});

// ---------- 7. SAIR ----------
btnSair.addEventListener("click", () => {
  sessionStorage.removeItem(CHAVE_SESSAO);
  mostrarLogin();
});

// ---------- 8. PAINEL: DADOS ----------
// Usa a mesma "gaveta" do site (js/app.js), por isso os agendamentos aparecem aqui
const CHAVE_AGENDAMENTOS = "agendamentos";
const NOME_BARBEARIA = "Barber & Co.";
const NOMES_STATUS = { pendente: "Aguardando", confirmado: "Confirmado", cancelado: "Cancelado" };

function lerAgendamentos() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_AGENDAMENTOS)) || [];
  } catch (erro) {
    return [];
  }
}

function salvarAgendamentos(lista) {
  localStorage.setItem(CHAVE_AGENDAMENTOS, JSON.stringify(lista));
}

function hojeISO() {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${agora.getFullYear()}-${mes}-${dia}`;
}

function paraISO(data) {
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${mes}-${dia}`;
}

function formatarData(dataISO) {
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

function formatarPreco(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function diaDaSemana(dataISO) {
  return new Date(dataISO + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long" });
}

// IMPORTANTE: nome e observação vêm do que o cliente digitou.
// Antes de colocar na página, "desarmamos" qualquer código HTML escondido ali.
function escapar(texto) {
  const trocas = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(texto).replace(/[&<>"']/g, (letra) => trocas[letra]);
}

// ---------- 9. PAINEL: WHATSAPP DO CLIENTE ----------
function linkWhatsappCliente(a, texto) {
  const numero = "55" + a.telefone.replace(/\D/g, "");
  return `https://wa.me/${numero}` + (texto ? `?text=${encodeURIComponent(texto)}` : "");
}

function mensagemConfirmacao(a) {
  const primeiroNome = a.nome.split(" ")[0];
  return `Olá, ${primeiroNome}! Seu horário na ${NOME_BARBEARIA} está confirmado.\n\n` +
         `*${a.servicoNome}*\n` +
         `${diaDaSemana(a.data)}, ${formatarData(a.data)}, às ${a.hora}\n\n` +
         `Te esperamos!`;
}

// ---------- 10. PAINEL: DESENHAR ----------
function filtrarAgendamentos() {
  return lerAgendamentos()
    .filter(a => filtroStatus.value === "todos" || a.status === filtroStatus.value)
    .filter(a => !filtroData.value || a.data === filtroData.value)
    .sort((x, y) => (x.data + x.hora).localeCompare(y.data + y.hora));
}

function atualizarEstatisticas() {
  const todos = lerAgendamentos();
  const hoje = hojeISO();
  const confirmadosFuturos = todos.filter(a => a.status === "confirmado" && a.data >= hoje);

  estPendentes.textContent = todos.filter(a => a.status === "pendente").length;
  estConfirmados.textContent = confirmadosFuturos.length;
  estHoje.textContent = todos.filter(a => a.data === hoje && a.status !== "cancelado").length;
  estValor.textContent = formatarPreco(confirmadosFuturos.reduce((soma, a) => soma + a.preco, 0));
}

function cartaoAgendamento(a) {
  const passado = a.data < hojeISO();

  let botoes = "";
  if (a.status === "pendente") {
    botoes += `<button type="button" class="btn btn--primario" data-acao="confirmar" data-id="${a.id}">Confirmar</button>`;
  }
  if (a.status !== "cancelado") {
    botoes += `<button type="button" class="btn btn--perigo" data-acao="cancelar" data-id="${a.id}">Cancelar</button>`;
  } else {
    botoes += `<button type="button" class="btn btn--contorno" data-acao="reativar" data-id="${a.id}">Reativar</button>`;
  }
  botoes += `<a class="btn btn--contorno" href="${linkWhatsappCliente(a)}" target="_blank" rel="noopener">WhatsApp</a>`;

  return `
    <article class="agenda__item agenda__item--${a.status}${passado ? " agenda__item--passado" : ""}">
      <div class="agenda__hora">${escapar(a.hora)}</div>
      <div class="agenda__info">
        <strong>${escapar(a.nome)}</strong>
        <span>${escapar(a.servicoNome)} – ${formatarPreco(a.preco)}</span>
        <span>${escapar(a.telefone)}</span>
        ${a.obs ? `<em>“${escapar(a.obs)}”</em>` : ""}
      </div>
      <div class="agenda__acoes">
        <span class="selo selo--${a.status}">${NOMES_STATUS[a.status]}</span>
        ${botoes}
      </div>
    </article>`;
}

function renderizarPainel() {
  atualizarEstatisticas();
  const lista = filtrarAgendamentos();

  if (lista.length === 0) {
    const temFiltro = filtroStatus.value !== "todos" || filtroData.value;
    listaAgenda.innerHTML = `
      <div class="agenda__vazio">
        <strong>Nenhum agendamento encontrado</strong>
        ${temFiltro
          ? "Tente limpar os filtros."
          : `Quando um cliente agendar pelo site, ele aparece aqui.<br>
             <button type="button" class="btn btn--contorno" data-acao="exemplo">Carregar dados de exemplo</button>`}
      </div>`;
    return;
  }

  // Agrupa por dia: um título para cada data, com os cartões embaixo
  let html = "";
  let diaAtual = "";
  const hoje = hojeISO();

  lista.forEach(a => {
    if (a.data !== diaAtual) {
      diaAtual = a.data;
      html += `<h3 class="agenda__dia">${diaDaSemana(a.data)} <small>${formatarData(a.data)}</small>` +
              `${a.data === hoje ? ` <span class="agenda__hoje">Hoje</span>` : ""}</h3>`;
    }
    html += cartaoAgendamento(a);
  });

  listaAgenda.innerHTML = html;
}

// ---------- 11. PAINEL: AÇÕES ----------
function mudarStatus(id, novoStatus) {
  const lista = lerAgendamentos();
  const alvo = lista.find(a => a.id === id);
  if (!alvo) return null;
  alvo.status = novoStatus;
  salvarAgendamentos(lista);
  return alvo;
}

listaAgenda.addEventListener("click", (evento) => {
  const botao = evento.target.closest("[data-acao]");
  if (!botao) return;

  // Botão da tela vazia: não é de um agendamento específico
  if (botao.dataset.acao === "exemplo") {
    gerarExemplos();
    renderizarPainel();
    return;
  }

  const id = Number(botao.dataset.id);
  const agendamento = lerAgendamentos().find(a => a.id === id);
  if (!agendamento) return;

  if (botao.dataset.acao === "confirmar") {
    mudarStatus(id, "confirmado");
    // Abre a conversa com o cliente já com a confirmação escrita
    window.open(linkWhatsappCliente(agendamento, mensagemConfirmacao(agendamento)), "_blank", "noopener");
  }

  if (botao.dataset.acao === "cancelar") {
    const certeza = confirm(`Cancelar o horário de ${agendamento.nome} (${formatarData(agendamento.data)}, ${agendamento.hora})?\n\nO horário volta a ficar livre no site.`);
    if (!certeza) return;
    mudarStatus(id, "cancelado");
  }

  if (botao.dataset.acao === "reativar") {
    // Só reativa se ninguém pegou o horário nesse meio tempo
    const ocupado = lerAgendamentos().some(a =>
      a.id !== id && a.data === agendamento.data && a.hora === agendamento.hora && a.status !== "cancelado");
    if (ocupado) {
      alert("Não dá para reativar: outro cliente já reservou esse horário.");
      return;
    }
    mudarStatus(id, "pendente");
  }

  renderizarPainel();
});

// ---------- 11b. PAINEL: DADOS DE EXEMPLO (para demonstração) ----------
const SERVICOS_EXEMPLO = {
  corte: { nome: "Corte masculino", preco: 45 },
  barba: { nome: "Barboterapia",    preco: 35 },
  combo: { nome: "Combo completo",  preco: 70 },
};

// Devolve as próximas datas em que a barbearia abre (pula os domingos)
function proximosDiasUteis(quantidade) {
  const dias = [];
  const dia = new Date();
  while (dias.length < quantidade) {
    if (dia.getDay() !== 0) dias.push(paraISO(dia));
    dia.setDate(dia.getDate() + 1);
  }
  return dias;
}

function gerarExemplos() {
  const [d1, d2, d3] = proximosDiasUteis(3);
  //        data, hora,   nome,             serviço, telefone,          observação,                  status
  const modelos = [
    [d1, "09:00", "Carlos Mendes",  "combo", "(11) 91234-5678", "Degradê na régua",            "confirmado"],
    [d1, "10:00", "Rafael Souza",   "corte", "(11) 98765-4321", "",                             "confirmado"],
    [d1, "14:00", "Bruno Lima",     "barba", "(21) 99876-1234", "",                             "pendente"],
    [d2, "11:00", "Diego Alves",    "corte", "(31) 97654-3210", "Mais curto nas laterais",      "pendente"],
    [d2, "16:00", "Pedro Santos",   "combo", "(11) 95555-0101", "",                             "pendente"],
    [d3, "15:00", "Lucas Ferreira", "barba", "(19) 96666-0202", "",                             "cancelado"],
  ];

  const lista = lerAgendamentos();
  modelos.forEach(([data, hora, nome, servico, telefone, obs, status], i) => {
    const ocupado = lista.some(a => a.data === data && a.hora === hora && a.status !== "cancelado");
    if (ocupado) return;   // não passa por cima de um agendamento real
    lista.push({
      id: Date.now() + i,
      servicoId: servico,
      servicoNome: SERVICOS_EXEMPLO[servico].nome,
      preco: SERVICOS_EXEMPLO[servico].preco,
      data, hora, nome, telefone, obs, status,
      criadoEm: new Date().toISOString(),
    });
  });
  salvarAgendamentos(lista);
}

document.getElementById("btn-apagar").addEventListener("click", () => {
  if (!lerAgendamentos().length) return;
  if (!confirm("Apagar TODOS os agendamentos salvos neste navegador?\n\nNão dá para desfazer.")) return;
  localStorage.removeItem(CHAVE_AGENDAMENTOS);
  renderizarPainel();
});

filtroData.addEventListener("change", renderizarPainel);
filtroStatus.addEventListener("change", renderizarPainel);
btnLimpar.addEventListener("click", () => {
  filtroData.value = "";
  filtroStatus.value = "todos";
  renderizarPainel();
});

// Se um cliente agendar em outra aba aberta, a lista atualiza sozinha
window.addEventListener("storage", (evento) => {
  if (evento.key === CHAVE_AGENDAMENTOS && !telaPainel.hidden) renderizarPainel();
});

// ---------- 12. INÍCIO ----------
// Se já estava logado nesta aba (ex.: deu F5), vai direto para o painel
if (sessionStorage.getItem(CHAVE_SESSAO) === "sim") {
  mostrarPainel();
} else {
  verificarBloqueio();
}

/* AVISO DE SEGURANÇA
   Como tudo roda no navegador, quem abrir o F12 pode ler este código,
   apagar o bloqueio ou escrever "adminLogado" na sessão e entrar.
   Para proteger de verdade, o login precisa ser checado em um servidor.
   Faremos isso se o projeto virar um site de verdade. */