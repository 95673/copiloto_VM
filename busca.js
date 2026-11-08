/* Motor de procura do Copiloto. Normalmente não precisas de mexer aqui:
   as palavras ignoradas e os sinónimos estão em faqs.json, dentro de "config". */
function criarMotor(config) {
  const PARAR = new Set(config.palavras_ignoradas);
  const SIN = config.sinonimos;
  const norm = s => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/m[\s-]?pesa/g, "mpesa").replace(/[^a-z0-9]+/g, " ").trim();
  const toks = s => norm(s).split(" ").filter(t => t && !PARAR.has(t)).map(t => SIN[t] || t);
  function dist(a, b) {
    const m = [];
    for (let i = 0; i <= a.length; i++) m[i] = [i];
    for (let j = 1; j <= b.length; j++) m[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
      m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return m[a.length][b.length];
  }
  function casa(q, d) {
    if (q === d) return 1;                                   // palavra igual
    if (q.length >= 3 && d.startsWith(q)) return 0.8;        // a meio de escrever
    if (q.length >= 4 && d.length >= 4 && dist(q, d) <= (q.length >= 6 ? 2 : 1)) return 0.6; // gralha
    return 0;
  }
  // pesos: pergunta 3, perguntas parecidas 3, tema 1, resposta 0.6
  const indexar = faqs => faqs.map(f => ({ f, campos: [[toks(f.pergunta), 3], [toks(f.parecidas.join(" ")), 3], [toks(f.tema), 1], [toks(f.resposta), 0.6]] }));
  function procurar(indice, texto, max = 4) {
    const q = toks(texto);
    if (!q.length) return [];
    const res = [];
    for (const { f, campos } of indice) {
      let soma = 0, achou = 0;
      for (const t of q) {
        let melhor = 0, segundo = 0;
        for (const [lista, peso] of campos) for (const d of lista) {
          const c = casa(t, d) * (peso === 0.6 && /^\d+$/.test(t) ? 3 : peso);   // códigos numéricos pesam mais na resposta
          if (c > melhor) { segundo = melhor; melhor = c; } else if (c > segundo) segundo = c;
        }
        if (melhor > 0) { soma += melhor + 0.3 * segundo; achou++; }
      }
      if (!achou) continue;
      if (q.length > 1 && achou < q.length) soma *= 0.4;     // faltou alguma palavra
      if (soma >= 1.2) res.push({ f, soma: soma - 0.01 * campos[0][0].length });
    }
    res.sort((a, b) => b.soma - a.soma);
    return res.filter(r => r.soma >= res[0].soma * 0.5).slice(0, max).map(r => r.f);
  }
  return { indexar, procurar, norm, toks };
}
if (typeof module !== "undefined") module.exports = { criarMotor };
