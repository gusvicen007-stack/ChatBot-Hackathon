# Fluenta — Guía de voz y backend

Guía para quien trabaje el frontend. Explica cómo funciona el tutor de voz,
qué ya está hecho, qué falta, y las reglas que no se pueden romper.

> **Sobre la API key:** este proyecto **no incluye ninguna key**. Cada quien
> pone la suya en un archivo `.env.local` que git ignora. Las instrucciones
> están en [Correrlo en tu máquina](#correrlo-en-tu-máquina).

---

## Cómo funciona, en un dibujo

```
 Navegador (React)                    Servidor (Node)              AssemblyAI
 ─────────────────                    ───────────────              ──────────
 1. clic en el micrófono ─ GET /api/token ─►  pide un token  ─ Bearer KEY ─►
                         ◄─────────── token ◄─────────────────────────────── 
 2. abre el WebSocket con el token ──────────────────────────────────────────►
    wss://agents.assemblyai.com/v1/ws?token=…
 3. micrófono → PCM16 24 kHz → base64 ───────────────────────────────────────►
    ◄──────────────────────────────── voz del tutor + transcripciones ───────
 4. al terminar: POST /api/report ──►  LLM Gateway  ─ key ───────────────────►
                ◄───────── retroalimentación estructurada ◄────────────────── 
```

Dos ideas clave:

- **La API key nunca llega al navegador.** El servidor cambia la key por un
  token de un solo uso que dura 2 minutos y abre una sesión de máximo 5.
- **El audio no pasa por nuestro servidor.** El navegador habla directo con
  AssemblyAI. Nuestro servidor solo entrega tokens y reportes, por eso es
  barato de hospedar.

---

## Mapa de archivos

| Archivo | Qué hace | ¿Lo toca frontend? |
|---|---|---|
| `src/voice/useVoiceAgent.ts` | El hook de React: conecta, graba, reproduce, maneja estados | Lo **usas**; rara vez lo editas |
| `src/voice/agentConfig.ts` | Voces por idioma, saludo, prompt del tutor, paciencia por nivel | Solo si cambias idiomas o el tono del tutor |
| `src/voice/report.ts` | Función `requestReport()` y el tipo `LessonReport` | Lo **usas** para la pantalla de reporte |
| `src/pages/ClassRoom.tsx` | La clase. Ya tiene el micrófono y el botón "Ayuda" conectados | **Sí, es tu pantalla principal** |
| `public/pcm-worklet.js` | Captura el micrófono en el formato que pide AssemblyAI | No. Ver reglas |
| `server/api.mjs` | Toda la API: `/api/token`, `/api/report`, `/api/health` | No |
| `server/index.mjs` | Servidor de producción: sirve el build y la API | No |
| `vite.config.ts` | Monta la misma API dentro de `npm run dev` | No |
| `.env.example` | Plantilla de variables. Copiarla a `.env.local` | — |

---

## Correrlo en tu máquina

Requisitos: Node 22.12 o más nuevo.

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Copia `.env.example` a un archivo nuevo llamado **`.env.local`** y pon una
   API key de AssemblyAI. Lo ideal es que crees **tu propia** key gratis en
   [assemblyai.com](https://www.assemblyai.com) → Dashboard → API Keys.
   ```
   ASSEMBLYAI_API_KEY=tu_key
   ```
3. Arranca:
   ```bash
   npm run dev
   ```
4. Comprueba el backend abriendo <http://localhost:3000/api/health>. Tiene que
   decir `"key_loaded": true`. Si dice `false`, reinicia `npm run dev`: el
   archivo `.env.local` solo se lee al arrancar.
5. Entra a una clase y dale al micrófono. El tutor **te saluda primero** en
   el idioma del curso.

Cada minuto de voz consume créditos (unos $0.075 USD por minuto). Cuelga en
cuanto termines de probar.

### Probar el modo producción en local (opcional)

```bash
npm run build
node --env-file=.env.local server/index.mjs
```

Y abres <http://localhost:8787>. Es exactamente lo que corre en Railway.

---

## El hook `useVoiceAgent`

```tsx
const voice = useVoiceAgent({
  targetLang: 'fr',        // idioma que se practica
  nativeLang: 'es',        // idioma del alumno (el de la interfaz)
  level: 'A2',             // MCER: A1 A2 B1 B2 C1 · JLPT: N5…N1
  topic: 'En el café',     // opcional, lo usa el tutor
  onTranscript: ({ role, text }) => { /* role: 'tutor' | 'student' */ },
});
```

Lo que devuelve:

| Campo | Tipo | Para qué |
|---|---|---|
| `state` | `AgentState` | En qué momento va la conversación (tabla de abajo) |
| `error` | `string \| null` | Mensaje listo para mostrarle al usuario |
| `activeLang` | `string` | Idioma en el que habla el tutor **ahora mismo** |
| `start()` | `() => Promise<void>` | Pide token y arranca la clase |
| `stop()` | `() => void` | Cuelga y libera el micrófono |
| `rescue(back?)` | `(back?: boolean) => Promise<void>` | `rescue()` cambia a la voz del idioma nativo; `rescue(true)` regresa al idioma objetivo |
| `getTranscript()` | `() => VoiceTranscript[]` | Copia de toda la conversación, para el reporte |

### Estados y qué mostrar en cada uno

| `state` | Qué está pasando | Sugerencia de UI |
|---|---|---|
| `idle` | Sin conectar | Botón de micrófono normal |
| `connecting` | Pidiendo token y abriendo sesión (1–2 s) | Spinner en el botón |
| `listening` | Turno del alumno | Micrófono "vivo", pulso o anillo |
| `thinking` | El alumno terminó de hablar, el tutor prepara respuesta | Mago en `thinking` |
| `speaking` | El tutor está hablando | Onda de audio o mago en `celebrate` |
| `error` | Algo falló; el motivo está en `error` | Mostrar `error` y permitir reintentar |

### El botón "Ayuda" (cambio de idioma)

Cada sesión tiene **una sola voz**, fija, y no se puede cambiar a media sesión.
Por eso `rescue()` cierra la sesión actual, abre otra con la voz del idioma
nativo y le pasa un resumen de los últimos turnos para que siga donde iban.
Tarda lo mismo que conectar (1–2 s), así que conviene mostrar `connecting`
como una transición y no como un error.

---

## El reporte de la clase

Ya funciona en el servidor. **Falta la pantalla.**

```tsx
import { requestReport } from '../voice/report';

voice.stop();
const report = await requestReport({
  transcript: voice.getTranscript(),
  targetLang, nativeLang, level: levelCode, topic,
});
```

Tarda unos segundos: muestra un estado de carga. Lo que llega:

```ts
{
  summary: string;              // en el idioma del alumno
  strengths: string[];          // cosas concretas que hizo bien
  corrections: {                // máximo 5, puede venir vacío
    said: string;               // cita EXACTA de lo que dijo el alumno
    better: string;             // cómo se dice mejor, en el idioma objetivo
    why: string;                // explicación, en el idioma del alumno
  }[];
  new_vocabulary: { term: string; meaning: string }[];
  level_estimate: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  next_step: string;            // qué practicar la próxima vez
  meta: { model, request_id, corrections_discarded };
}
```

Un detalle importante: el servidor **tira las correcciones que citan algo que
el alumno nunca dijo**. Si el modelo inventa una cita, no llega a la pantalla.
Por eso `corrections` puede traer menos elementos de los esperados. Es a
propósito.

Si falla, `requestReport` lanza un `Error` con un mensaje ya pensado para el
usuario (por ejemplo *"Todavía no dijiste nada en esta clase"*).

---

## Pendientes para frontend

En orden de lo que más pesa en el video del hackathon:

1. **Pantalla de reporte.** Botón "Terminar clase" → `stop()` → `requestReport()`
   → tarjeta con resumen, fortalezas, correcciones (`said` → `better` + `why`),
   vocabulario, nivel estimado y siguiente paso.
2. **El chat escrito sigue simulado.** Si el alumno escribe en vez de hablar,
   recibe respuestas de ejemplo de `translations.ts`. Hay que decidir si se
   oculta el input mientras la voz está activa o si se quita.
3. **Estados visuales del micrófono** según la tabla de `state`.
4. **Permiso de micrófono denegado.** Hoy `error` muestra el texto técnico del
   navegador (`NotAllowedError`). Conviene traducirlo a algo como *"Activa el
   micrófono en la barra de direcciones"*.
5. **Japonés no tiene voz.** AssemblyAI entiende 18 idiomas pero solo habla 6
   (inglés, español, francés, alemán, italiano, portugués). El botón del
   micrófono ya se desactiva con un aviso. Decisión de producto pendiente:
   dejarlo como curso solo escrito, o cambiarlo por italiano, que sí tiene
   voz (`giovanni`) y hoy aparece como "próximamente".
6. **Safari.** Probar en Chrome primero. Safari a veces ignora la frecuencia
   de 24 kHz del micrófono.

---

## Reglas que no se rompen

1. **La key nunca va en código del cliente.** Y nunca le pongas prefijo
   `VITE_`: Vite mete en el bundle público todas las variables que empiezan
   con `VITE_`. `ASSEMBLYAI_API_KEY` se queda sin prefijo, siempre.
2. **`public/pcm-worklet.js` se queda en `public/`.** El navegador lo carga por
   URL, no por `import`. Si se mueve a `src/`, el micrófono deja de funcionar.
3. **No usar `MediaRecorder`.** Entrega audio comprimido; AssemblyAI necesita
   PCM crudo, que es lo que hace el worklet.
4. **Nombres de campo del audio:** lo que mandamos va en `audio`
   (`input.audio`); lo que recibimos viene en `data` (`reply.audio`). Si se
   confunden, no truena nada: simplemente no se oye.
5. **No quitar `echoCancellation`** del `getUserMedia`. Sin eso el tutor se
   escucha a sí mismo por las bocinas y se interrumpe solo.
6. **No montar la API con prefijo en Vite** (`middlewares.use('/api', …)`):
   Vite le quita el prefijo a la URL y el handler ya no reconoce las rutas.
7. **Si una key se filtra** (captura de pantalla, chat, commit): se borra en el
   dashboard de AssemblyAI → API Keys, se crea una nueva, y se actualiza en
   `.env.local` y en Railway. Filtrada una vez, está quemada.

---

## Errores comunes

| Lo que ves | Causa | Arreglo |
|---|---|---|
| `Falta ASSEMBLYAI_API_KEY en el servidor` | No hay `.env.local` o no reiniciaste | Crear el archivo y reiniciar `npm run dev` |
| `La API key de AssemblyAI es inválida` | Key mal copiada | Revisar espacios o comillas de más |
| `Llegaste al límite de clases por hora` | Límite anti-abuso | En desarrollo: `TOKENS_PER_IP_PER_HOUR=100` en `.env.local` |
| `NotAllowedError` | El navegador bloqueó el micrófono | Permitirlo en el candado de la barra de direcciones |
| `Unable to load a worklet's module` | `pcm-worklet.js` no se encontró | Verificar que siga en `public/` |
| Se conecta pero no se oye nada | Pestaña silenciada o salida de audio equivocada | Revisar el ícono de sonido de la pestaña |
| El tutor se interrumpe solo | Eco de las bocinas | Usar audífonos |

---

## Producción (Railway)

- Build: `npm run build` · Start: `npm start` (Railway los detecta solo).
- Variables en el panel de Railway:

| Variable | Obligatoria | Valor por defecto | Para qué |
|---|---|---|---|
| `ASSEMBLYAI_API_KEY` | sí | — | La key |
| `DAILY_SESSION_CAP` | no | `60` | Tope de clases por día (control de gasto) |
| `TOKENS_PER_IP_PER_HOUR` | no | `12` | Límite anti-abuso por usuario |
| `LLM_MODEL` | no | `claude-sonnet-4-6` | Modelo del reporte |
| `LLM_FALLBACK_MODEL` | no | `gemini-2.5-flash` | Modelo de respaldo |

- `https://tu-app.up.railway.app/api/health` muestra si la key está cargada y
  cuántas clases van hoy.
