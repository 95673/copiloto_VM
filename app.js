/* Interface do Copiloto. Para mudar respostas, atalhos ou sinónimos edita só o faqs.json. */
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const destacar = t => esc(t).replace(/\*\d[^\s]*?#/g, "<code>$&</code>");   // códigos USSD em destaque
let DADOS, CFG, motor, indice, sel = 0;

function selecionar(i) {   // realça um cartão (setas do teclado)
  const c = document.querySelectorAll("#res .res");
  if (!c.length) return;
  sel = Math.max(0, Math.min(c.length - 1, i));
  c.forEach((el, n) => el.classList.toggle("sel", n === sel));
  c[sel].scrollIntoView({ block: "nearest" });
}

const dias = d => Math.floor((Date.now() - new Date(d + "T00:00:00")) / 864e5);
const velha = f => dias(f.atualizado_em) > CFG.validade_dias;

function cartao(f) {
  return '<article class="res"><small>' + esc(f.tema) + "</small><h3>" + esc(f.pergunta) + "</h3><p>" + destacar(f.resposta) + "</p>" +
    (velha(f) ? '<em class="velha">Confirmar antes de usar: verificada há ' + dias(f.atualizado_em) + " dias</em>" : "") +
    '<button type="button" data-id="' + esc(f.id) + '">Copiar resposta</button></article>';
}
function mostrar(lista, ms) {
  document.body.classList.add("com-res");
  if (!lista.length) { $("estado").textContent = ""; $("res").innerHTML = '<div class="vazio">' + esc(DADOS.regra_sem_resposta) + "</div>"; return; }
  $("estado").textContent = lista.length + (lista.length === 1 ? " resposta em " : " respostas em ") + Math.max(1, Math.round(ms)) + " ms";
  $("res").innerHTML = lista.map(cartao).join("");
  selecionar(0);
}
function pesquisar(texto) {
  if (!texto.trim()) { document.body.classList.remove("com-res"); $("estado").textContent = ""; $("res").innerHTML = ""; return; }
  const t0 = performance.now();
  const r = motor.procurar(indice, texto);
  mostrar(r, performance.now() - t0);
}
async function copiar(texto) {
  try { await navigator.clipboard.writeText(texto); }
  catch (e) { const a = document.createElement("textarea"); a.value = texto; document.body.appendChild(a); a.select(); try { document.execCommand("copy"); } catch (e2) {} a.remove(); }
}
async function iniciar() {
  try {
    if (window.FAQS_EMBUTIDAS) DADOS = window.FAQS_EMBUTIDAS;   // versão de uma só página (demonstração)
    else {
      const r = await fetch("faqs.json", { cache: "no-cache" });
      if (!r.ok) throw new Error("HTTP " + r.status);
      DADOS = await r.json();
    }
  } catch (e) {
    $("estado").textContent = "Não consegui ler o faqs.json (falta o ficheiro ou tem um erro de escrita, por exemplo uma vírgula em falta).";
    return;
  }
  CFG = DADOS.config; motor = criarMotor(CFG); indice = motor.indexar(DADOS.faqs);
  $("contagem").textContent = DADOS.faqs.length + " respostas";
  $("mais").innerHTML = CFG.atalhos.map(a => '<button type="button">' + esc(a) + "</button>").join("");
  const temas = [...new Set(DADOS.faqs.map(f => f.tema))];
  $("temas").innerHTML = temas.map(t => '<button type="button" data-tema="' + esc(t) + '">' + esc(t) + "</button>").join("");
  $("q").addEventListener("input", e => pesquisar(e.target.value));
  $("atalhos").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.tema) { $("q").value = ""; mostrar(DADOS.faqs.filter(f => f.tema === b.dataset.tema), 1); }
    else { $("q").value = b.textContent; pesquisar(b.textContent); }
  });
  $("res").addEventListener("click", async e => {
    const b = e.target.closest("button[data-id]"); if (!b) return;
    await copiar(DADOS.faqs.find(x => x.id === b.dataset.id).resposta);
    b.textContent = "Copiado ✓"; setTimeout(() => { b.textContent = "Copiar resposta"; }, 1500);
  });
  if (matchMedia("(hover: hover) and (pointer: fine)").matches) $("q").focus();   // computador: pronto a escrever
}

/* Teclado (computador): / pesquisar, setas escolher, Enter copiar, Esc limpar */
document.addEventListener("keydown", e => {
  const campo = document.activeElement === $("q");
  if (e.key === "/" && !campo && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); $("q").focus(); return; }
  if (e.key === "Escape" && DADOS) { $("q").value = ""; pesquisar(""); $("q").focus(); return; }
  const cartoes = document.querySelectorAll("#res .res");
  if (!cartoes.length) return;
  if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); selecionar(sel + (e.key === "ArrowDown" ? 1 : -1)); }
  else if (e.key === "Enter" && campo) { e.preventDefault(); cartoes[sel].querySelector("button").click(); }
});
iniciar();
