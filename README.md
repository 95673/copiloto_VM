# Copiloto do Agente

Procura instantânea de respostas nas FAQs. Sem IA, sem dados de clientes.

## Ficheiros
- `faqs.json`: **tudo o que muda**: respostas, atalhos, sinónimos, validade.
- `index.html`, `estilo.css`: página e aspeto.
- `app.js`: ecrã. `busca.js`: motor de procura. (Normalmente não se mexe.)
- `validar.py`: confere o `faqs.json` antes de publicar.

## Corrigir uma resposta
1. No GitHub, abre `faqs.json`, toca no lápis.
2. Muda o texto de `"resposta"` e a data em `"atualizado_em"` (AAAA-MM-DD).
3. **Commit changes**. O Vercel publica sozinho em cerca de 30 segundos.

## Acrescentar uma FAQ
Copia este bloco para dentro de `"faqs"`, com **vírgula** entre blocos:

    {
      "id": "mpesa-14",
      "tema": "M-Pesa",
      "pergunta": "Como fazer X?",
      "resposta": "Marque *150#, escolha 1 e siga as instruções.",
      "parecidas": ["jeito 1 de perguntar", "jeito 2", "jeito 3"],
      "fonte": "quem confirmou",
      "atualizado_em": "2026-11-08"
    }

Regras: **uma pergunta, uma página**; `id` único; 3 a 4 jeitos de perguntar em `"parecidas"`; todas as respostas de menu terminam com "siga as instruções" quando assim for.

## Validar (no Termux)
    python validar.py
Avisa de erros de escrita (vírgula em falta), ids repetidos, possíveis duplicados e FAQs com mais de `validade_dias` sem confirmação (aparecem com aviso vermelho no ecrã).

## Mudar atalhos e sinónimos
Em `faqs.json`, dentro de `"config"`: `atalhos` (botões "Mais usadas"), `sinonimos` (ex.: `"senha": "pin"`), `palavras_ignoradas`.

## Publicar
Repositório no GitHub + Vercel (Add New, Project, Deploy). Não precisa de variáveis.
