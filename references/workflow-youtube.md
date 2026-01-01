# Workflow: Video YouTube

Pipeline especifico para `video_youtube`.

---

## Extracao: OBRIGATORIO Python

**NUNCA** use WebFetch ou navegador para YouTube.

```bash
python "C:\Users\Alex\.claude\skills\nota-obsidian\scripts\extrator-youtube.py" "<URL>"
```

### Output do Script

```json
{
  "titulo": "...",
  "canal": "...",
  "data_publicacao": "YYYY-MM-DD",
  "duracao": "HH:MM:SS",
  "views": 123456,
  "likes": 1234,
  "descricao": "...",
  "transcricao": [
    {"tempo": "0:00", "texto": "..."},
    {"tempo": "0:15", "texto": "..."}
  ]
}
```

### Se Falhar

| Erro | Acao |
|:-----|:-----|
| "Transcricao nao disponivel" | Video sem legendas - pedir ao usuario |
| ModuleNotFoundError | `pip install yt-dlp youtube-transcript-api` |
| Timeout | Tentar novamente ou pedir transcricao |

---

## Salvamento

| Autoria | Template | Pasta |
|:--------|:---------|:------|
| terceiros | `template-video-youtube.md` | `Atlas/Conteudos/Video Youtube/` |
| alex | `template-video-youtube-alex.md` | `Work/Videos/` |

### Nomenclatura

```
{titulo-kebab-case}-{canal}.md
```

Maximo: 50 caracteres

---

## Checklist

- [ ] URL e do YouTube?
- [ ] Python executado (NAO WebFetch)?
- [ ] Transcricao extraida?
- [ ] Template correto carregado?
- [ ] Nota salva com Write?
