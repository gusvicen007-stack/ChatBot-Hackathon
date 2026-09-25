# Fluenta

Tutor de idiomas por voz. Practicas conversación en inglés, francés, alemán o
español con un tutor que te habla, **te espera mientras buscas la palabra**, y
cambia a tu idioma cuando te atoras.

Construido sobre el [Voice Agent API](https://www.assemblyai.com/docs/voice-agents/voice-agent-api)
y el [LLM Gateway](https://www.assemblyai.com/docs/llm-gateway/quickstart) de AssemblyAI.

## Lo que lo hace distinto

- **Paciencia por nivel.** Un principiante hace pausas largas buscando la
  palabra. El tutor le da a un A1 más del triple de silencio antes de
  contestar que a un C1, para no cortarlo justo cuando iba a acertar.
- **Ayuda en tu idioma.** Con un botón, el tutor cambia a la voz de tu idioma
  nativo, te explica, y regresa a la clase donde iban.
- **Retroalimentación que no inventa.** Al terminar, un reporte con tus
  correcciones. Cada corrección cita algo que de verdad dijiste; el servidor
  descarta las que no.

## Correrlo

```bash
npm install
cp .env.example .env.local   # y pon tu ASSEMBLYAI_API_KEY
npm run dev                  # http://localhost:3000
```

Documentación técnica completa: [`docs/voz-y-backend.md`](docs/voz-y-backend.md).
