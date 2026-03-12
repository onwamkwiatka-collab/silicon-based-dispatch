# Silicon Based Dispatch

System pracy — OKR + Macierz Eisenhowera + Kanban + Notatki

Progressive Web App (PWA) — działa offline, można zainstalować na Androidzie i iOS.

## Struktura

```
public/
  index.html    — główny plik HTML
  app.js        — cała logika aplikacji
  manifest.json — konfiguracja PWA
  sw.js         — service worker (tryb offline)
  icon-192.png  — ikona aplikacji
  icon-512.png  — ikona aplikacji
vercel.json     — konfiguracja hostingu
```

## Instalacja na telefonie

1. Otwórz aplikację w Chrome na Androidzie
2. Kliknij baner "Zainstaluj aplikację"
3. lub: menu Chrome → "Dodaj do ekranu głównego"

## Dane

Dane przechowywane lokalnie (localStorage) — działają offline bez konta.
