#!/usr/bin/env python3
"""Valida o faqs.json antes de publicar.  Uso:  python validar.py
Verifica: erros de escrita no JSON, campos em falta, ids repetidos,
perguntas parecidas (possíveis duplicados) e FAQs por confirmar há demasiado tempo."""
import json
import re
import sys
import unicodedata
from datetime import date, datetime
from pathlib import Path

CAMPOS = ("id", "tema", "pergunta", "resposta", "parecidas", "atualizado_em")
IGNORAR = {"como", "o", "a", "os", "as", "de", "do", "da", "para", "em", "no", "na", "um", "uma", "meu", "minha", "que", "e", "se", "por", "com"}


def palavras(texto):
    t = unicodedata.normalize("NFD", texto.lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    t = re.sub(r"m[\s-]?pesa", "mpesa", t)
    return {p for p in re.sub(r"[^a-z0-9]+", " ", t).split() if p not in IGNORAR}


def main():
    caminho = Path(__file__).with_name("faqs.json")
    try:
        dados = json.loads(caminho.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"ERRO de escrita no faqs.json: linha {e.lineno}, coluna {e.colno} ({e.msg}).")
        print("Dica: procura uma vírgula em falta ou a mais perto dessa linha.")
        return 1
    erros, avisos, ids = [], [], set()
    validade = dados.get("config", {}).get("validade_dias", 90)
    faqs = dados.get("faqs", [])
    for f in faqs:
        fid = f.get("id", "(sem id)")
        for c in CAMPOS:
            if not f.get(c):
                erros.append(f"{fid}: falta o campo '{c}'")
        if fid in ids:
            erros.append(f"{fid}: id repetido")
        ids.add(fid)
        try:
            idade = (date.today() - datetime.strptime(f.get("atualizado_em", ""), "%Y-%m-%d").date()).days
            if idade > validade:
                avisos.append(f"{fid}: confirmada há {idade} dias (limite {validade})")
        except ValueError:
            erros.append(f"{fid}: 'atualizado_em' deve ser AAAA-MM-DD")
    for i, a in enumerate(faqs):
        for b in faqs[i + 1:]:
            pa, pb = palavras(a.get("pergunta", "")), palavras(b.get("pergunta", ""))
            if pa and pb and len(pa & pb) / len(pa | pb) >= 0.6:
                avisos.append(f"possível duplicado: {a.get('id')} e {b.get('id')}")
    for e in erros:
        print("ERRO  ", e)
    for a in avisos:
        print("AVISO ", a)
    print(f"{len(faqs)} FAQs verificadas: {len(erros)} erros, {len(avisos)} avisos.")
    return 1 if erros else 0


if __name__ == "__main__":
    sys.exit(main())
