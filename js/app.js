/* =========================================================
   BARBER & CO. – Etapa 2
   Serviços, horários, total e controle de horários ocupados
   ========================================================= */

// ---------- 1. DADOS FIXOS ----------
// Para mudar preço, nome ou horário, é só editar aqui.
const SERVICOS = [
  { id: "corte", nome: "Corte masculino", descricao: "Corte clássico ou moderno, com lavagem e finalização.", preco: 45 },
  { id: "barba", nome: "Barboterapia",    descricao: "Barba desenhada com toalha quente e óleos essenciais.", preco: 35 },
  { id: "combo", nome: "Combo completo",  descricao: "Cabelo, barba e sobrancelha, com atendimento sem pressa.", preco: 70 },
];

const HORARIOS = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

const CHAVE_STORAGE = "agendamentos"; // nome da "gaveta" no localStorage

// >>> TROQUE PELO NÚMERO DO BARBEIRO: 55 + DDD + número, só dígitos <<<
// Exemplo: 5535999998888
const WHATSAPP_BARBEIRO = "5535999999999";
const NOME_BARBEARIA = "Barber & Co.";

// ---------- 2. ELEMENTOS DA PÁGINA ----------
const listaServicos = document.getElementById("lista-servicos");
const listaHorarios = document.getElementById("lista-horarios");
const campoData     = document.getElementById("data");
const textoTotal    = document.getElementById("total");
const resumoServico = document.getElementById("resumo-servico");
const resumoData    = document.getElementById("resumo-data");
const resumoHora    = document.getElementById("resumo-hora");
const formulario    = document.getElementById("form-agendamento");
const campoNome     = document.getElementById("nome");
const campoTelefone = document.getElementById("telefone");
const campoObs      = document.getElementById("obs");
const caixaErro     = document.getElementById("erro");
const caixaSucesso  = document.getElementById("sucesso");
const linkWhatsapp  = document.getElementById("link-whatsapp");

// ---------- 3. ESTADO (o que o cliente já escolheu) ----------
let servicoEscolhido = null; // objeto do serviço
let horarioEscolhido = null; // texto, ex.: "14:00"

// ---------- 4. FUNÇÕES AUXILIARES ----------
function formatarPreco(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Lê os agendamentos salvos. Se não houver nada, devolve lista vazia.
function lerAgendamentos() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_STORAGE)) || [];
  } catch (erro) {
    return [];
  }
}

// Devolve a data de hoje no formato do input date: "2026-10-23"
function hojeISO() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

// Converte um objeto Date em "2026-10-23"
function paraISO(data) {
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${mes}-${dia}`;
}

// Horários já ocupados em uma data (ignora os cancelados)
function horariosOcupados(dataISO) {
  return lerAgendamentos()
    .filter(a => a.data === dataISO && a.status !== "cancelado")
    .map(a => a.hora);
}

// Domingo = 0 no JavaScript. Criamos a data com "T12:00" para evitar erro de fuso.
function ehDomingo(dataISO) {
  return new Date(dataISO + "T12:00:00").getDay() === 0;
}

// ---------- 5. DESENHAR OS SERVIÇOS ----------
function mostrarServicos() {
  listaServicos.innerHTML = SERVICOS.map(s => `
    <label class="servico">
      <input type="radio" name="servico" value="${s.id}">
      <span class="servico__info">
        <strong>${s.nome}</strong>
        <small>${s.descricao}</small>
      </span>
      <span class="servico__preco">${formatarPreco(s.preco)}</span>
    </label>
  `).join("");

  // Quando o cliente escolhe um serviço, guardamos e atualizamos o total
  listaServicos.addEventListener("change", (evento) => {
    servicoEscolhido = SERVICOS.find(s => s.id === evento.target.value);
    atualizarResumo();
  });
}

// ---------- 6. DESENHAR OS HORÁRIOS ----------
function mostrarHorarios() {
  horarioEscolhido = null;
  atualizarResumo();
  const data = campoData.value;

  if (!data) {
    listaHorarios.innerHTML = `<p class="aviso">Escolha uma data para ver os horários.</p>`;
    return;
  }

  if (ehDomingo(data)) {
    listaHorarios.innerHTML = `<p class="aviso">Não abrimos aos domingos. Escolha outro dia.</p>`;
    return;
  }

  const ocupados = horariosOcupados(data);
  const agora = new Date();
  const horaAtual = `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;
  const ehHoje = data === hojeISO();

  listaHorarios.innerHTML = HORARIOS.map(hora => {
    const indisponivel = ocupados.includes(hora) || (ehHoje && hora <= horaAtual);
    return `<button type="button" class="horario" data-hora="${hora}" ${indisponivel ? "disabled" : ""}>${hora}</button>`;
  }).join("");

  // Se todos os horários do dia estiverem indisponíveis, avisamos
  if (!listaHorarios.querySelector(".horario:not(:disabled)")) {
    listaHorarios.insertAdjacentHTML("beforeend", `<p class="aviso">Sem horários livres neste dia.</p>`);
  }
}

// Clique em um horário (um único "ouvinte" para todos os botões)
listaHorarios.addEventListener("click", (evento) => {
  const botao = evento.target.closest(".horario");
  if (!botao || botao.disabled) return;

  listaHorarios.querySelectorAll(".horario").forEach(b => b.classList.remove("ativo"));
  botao.classList.add("ativo");
  horarioEscolhido = botao.dataset.hora;
  atualizarResumo();
});

// ---------- 7. TOTAL ----------
function atualizarTotal() {
  textoTotal.textContent = formatarPreco(servicoEscolhido ? servicoEscolhido.preco : 0);
}

// Transforma "2026-10-26" em "26/10/2026"
function formatarData(dataISO) {
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

// Atualiza o cartão "Seu agendamento"
function atualizarResumo() {
  resumoServico.textContent = servicoEscolhido ? servicoEscolhido.nome : "Não escolhido";
  resumoData.textContent    = campoData.value ? formatarData(campoData.value) : "Não escolhida";
  resumoHora.textContent    = horarioEscolhido || "Não escolhido";
  atualizarTotal();
}

// ---------- 8. MÁSCARA DO TELEFONE ----------
// Enquanto o cliente digita, formata como (35) 99999-9999
campoTelefone.addEventListener("input", () => {
  const n = campoTelefone.value.replace(/\D/g, "").slice(0, 11);
  let texto = n;
  if (n.length > 6)      texto = `(${n.slice(0, 2)}) ${n.slice(2, n.length - 4)}-${n.slice(-4)}`;
  else if (n.length > 2) texto = `(${n.slice(0, 2)}) ${n.slice(2)}`;
  campoTelefone.value = texto;
});

// ---------- 9. ERROS ----------
function mostrarErro(mensagem, campo) {
  caixaErro.textContent = mensagem;
  caixaErro.hidden = false;
  caixaSucesso.hidden = true;
  if (campo) campo.focus();
}

function limparErro() {
  caixaErro.hidden = true;
}

// ---------- 10. VALIDAR ----------
// Devolve true se estiver tudo certo; senão mostra o erro e devolve false
function validar() {
  if (!servicoEscolhido) { mostrarErro("Escolha um serviço.", listaServicos.querySelector("input")); return false; }
  if (!campoData.value)  { mostrarErro("Escolha a data do atendimento.", campoData); return false; }
  if (ehDomingo(campoData.value)) { mostrarErro("Não abrimos aos domingos. Escolha outro dia.", campoData); return false; }
  if (!horarioEscolhido) { mostrarErro("Escolha um horário livre.", listaHorarios.querySelector(".horario:not(:disabled)")); return false; }

  if (campoNome.value.trim().length < 2) { mostrarErro("Digite seu nome.", campoNome); return false; }

  const digitos = campoTelefone.value.replace(/\D/g, "");
  if (digitos.length < 10) { mostrarErro("Digite seu WhatsApp com DDD. Exemplo: (35) 99999-9999.", campoTelefone); return false; }

  // Confere de novo se o horário não foi ocupado enquanto o cliente preenchia
  if (horariosOcupados(campoData.value).includes(horarioEscolhido)) {
    mostrarErro("Esse horário acabou de ser reservado. Escolha outro.");
    mostrarHorarios();
    atualizarResumo();
    return false;
  }
  return true;
}

// ---------- 11. MENSAGEM DO WHATSAPP ----------
function montarMensagem(a) {
  const diaSemana = new Date(a.data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long" });
  const linhas = [
    `Olá! Gostaria de confirmar um agendamento na ${NOME_BARBEARIA}.`,
    "",
    `*Serviço:* ${a.servicoNome}`,
    `*Data:* ${formatarData(a.data)} (${diaSemana})`,
    `*Horário:* ${a.hora}`,
    `*Valor:* ${formatarPreco(a.preco)}`,
    "",
    `*Nome:* ${a.nome}`,
    `*WhatsApp:* ${a.telefone}`,
  ];
  if (a.obs) linhas.push(`*Observação:* ${a.obs}`);
  return linhas.join("\n");
}

function linkDoWhatsapp(a) {
  return `https://wa.me/${WHATSAPP_BARBEIRO}?text=${encodeURIComponent(montarMensagem(a))}`;
}

// ---------- 12. ENVIAR ----------
formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();           // impede a página de recarregar
  limparErro();
  if (!validar()) return;

  // Monta o agendamento
  const agendamento = {
    id: Date.now(),
    servicoId: servicoEscolhido.id,
    servicoNome: servicoEscolhido.nome,
    preco: servicoEscolhido.preco,
    data: campoData.value,
    hora: horarioEscolhido,
    nome: campoNome.value.trim(),
    telefone: campoTelefone.value,
    obs: campoObs.value.trim(),
    status: "pendente",              // o admin muda para "confirmado" ou "cancelado"
    criadoEm: new Date().toISOString(),
  };

  // Salva no navegador
  const lista = lerAgendamentos();
  lista.push(agendamento);
  localStorage.setItem(CHAVE_STORAGE, JSON.stringify(lista));

  // Abre o WhatsApp (e deixa um botão, caso o navegador bloqueie a janela)
  const link = linkDoWhatsapp(agendamento);
  linkWhatsapp.href = link;
  window.open(link, "_blank", "noopener");

  // Mostra o aviso e limpa a tela para o próximo cliente
  caixaSucesso.hidden = false;
  formulario.reset();
  servicoEscolhido = null;
  horarioEscolhido = null;
  mostrarHorarios();
  atualizarResumo();
});

// Se o cliente mexer em qualquer campo, o erro antigo some
formulario.addEventListener("input", limparErro);
formulario.addEventListener("click", limparErro);

// ---------- 13. INÍCIO ----------
campoData.min = hojeISO();                       // bloqueia datas passadas
const limite = new Date();
limite.setDate(limite.getDate() + 60);
campoData.max = paraISO(limite);                 // agenda aberta pelos próximos 60 dias
campoData.addEventListener("change", mostrarHorarios);

mostrarServicos();
atualizarResumo();