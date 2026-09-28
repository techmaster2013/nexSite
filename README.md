# nexSite

A standalone web-port of **nexite**, built with the GamePlaza purple/pink glass aesthetic.

## stack

- Scramjet 2
- Scramjet Controller
- libcurl transport
- Wisp
- GitHub Pages

The browser uses the same working Scramjet package versions as nexOS:

- `@mercuryworkshop/scramjet@2.0.67-alpha.2`
- `@mercuryworkshop/scramjet-controller@0.0.14`
- `@mercuryworkshop/libcurl-transport@2.0.5`

## local development

Run it through HTTP — not `file://` — because the service worker needs an HTTP/HTTPS origin.

```bash
npm install
npm run build
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

## deployment

GitHub Pages is configured through `.github/workflows/pages.yml`.
