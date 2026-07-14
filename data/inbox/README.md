# Inbox zgłoszeń JSON

Wrzuć tu pliki `.json` z artykułami wiki lub wpisami księgi gości
(jeden obiekt albo tablica obiektów), a następnie uruchom:

```bash
npm run merge-inbox
```

Skrypt scali je do `data/wiki.json` / `data/guestbook.json`,
przeniesie przetworzone pliki do `processed/`, a Ty commitujesz i pushujesz.

Rozpoznawanie automatyczne:
- obiekt z `title`+`content` -> artykuł wiki
- obiekt z `nick`+`message` -> wpis księgi gości
