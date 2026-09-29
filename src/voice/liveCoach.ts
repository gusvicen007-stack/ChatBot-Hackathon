import { useCallback, useEffect, useRef, useState } from 'react';
import { getDeck, gloss, THEMES, type Flashcard } from '../data/flashcards';

/**
 * Flashcards en vivo durante la clase.
 *
 *  - Vocabulario: cada frase del tutor se compara con el diccionario de
 *    flashcards; si usa una palabra del mazo, su tarjeta aparece al instante
 *    (sin IA, sin costo).
 *  - Correcciones: las frases del alumno se mandan a /api/coach, que devuelve
 *    sus errores (y más vocabulario del tutor). El plan actual solo permite
 *    ~2 pedidos por minuto, así que aquí se agrupan frases y, si el servidor
 *    responde 429, se espera y se reintenta con todo lo pendiente.
 */

export type CorrectionIssue = 'grammar' | 'vocabulary' | 'pronunciation';
export type VocabKind = 'word' | 'adjective' | 'verb' | 'phrase' | 'grammar';

export interface CorrectionCard {
  kind: 'correction';
  id: string;
  /** Id del mensaje (del alumno) debajo del cual se muestra. */
  afterId: string;
  said: string;
  better: string;
  explanation: string;
  issue: CorrectionIssue;
}

export interface VocabCard {
  kind: 'vocab';
  id: string;
  /** Id del mensaje (del tutor) debajo del cual se muestra. */
  afterId: string;
  term: string;
  reading?: string;
  meaning: string;
  note?: string;
  example?: string;
  wordKind?: VocabKind;
}

export type LiveCard = CorrectionCard | VocabCard;

export interface CoachTurn {
  id: string;
  role: 'tutor' | 'student';
  text: string;
}

// ------------------------------------------------------------ diccionario

function normalize(text: string): string {
  const plain = text
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
  return ` ${plain} `;
}

const CJK = /[぀-ヿ一-龯]/;
const ARTICLES = /^(der|die|das|le|la|les|l|el|los|las|un|une|the|to|a|an)\s+/;

/** Formas buscables de un término: "der Kollege / die Kollegin" → ["kollege", "kollegin"]. */
function termKeys(term: string): string[] {
  return term
    .split(/\s[/·]\s/)
    .map((part) => part.replace(/（.*?）|\(.*?\)|〜|~|…|\.\.\./g, ' ').trim())
    .map((part) => (CJK.test(part) ? part : normalize(part).trim().replace(ARTICLES, '')))
    .filter((k) => k.length >= 3 || CJK.test(k));
}

interface DictEntry {
  keys: string[];
  card: Flashcard;
}

const dictCache = new Map<string, DictEntry[]>();

function dictionaryFor(languageId: string): DictEntry[] {
  const cached = dictCache.get(languageId);
  if (cached) return cached;
  const deck = getDeck(languageId);
  const entries = deck
    ? THEMES.flatMap((theme) => deck.cards[theme].map((card) => ({ keys: termKeys(card.term), card })))
    : [];
  dictCache.set(languageId, entries);
  return entries;
}

/** Tarjetas del diccionario cuyas palabras aparecen en lo que dijo el tutor. */
export function dictionaryCards(
  turn: CoachTurn,
  languageId: string,
  uiLang: string,
  alreadyShown: Set<string>,
  max = 1,
): VocabCard[] {
  const text = normalize(turn.text);
  const found: VocabCard[] = [];
  for (const { keys, card } of dictionaryFor(languageId)) {
    if (found.length >= max) break;
    if (alreadyShown.has(card.term.toLowerCase())) continue;
    const hit = keys.some((k) => (CJK.test(k) ? turn.text.includes(k) : text.includes(` ${k} `)));
    if (!hit) continue;
    found.push({
      kind: 'vocab',
      id: `dict-${turn.id}-${card.term}`,
      afterId: turn.id,
      term: card.term,
      reading: card.reading,
      meaning: gloss(card.meaning, uiLang),
      note: card.tip ? gloss(card.tip, uiLang) : undefined,
      example: card.example,
    });
  }
  return found;
}

// ------------------------------------------------------------ hook

interface CoachOptions {
  targetLang: string;
  nativeLang: string;
  level: string;
  /** Simulación: objetivos de la misión (en inglés) para marcar los cumplidos. */
  goals?: string[];
}

interface CoachResponse {
  corrections: { turnId: string; said: string; better: string; explanation: string; kind: CorrectionIssue }[];
  cards: { turnId: string; term: string; meaning: string; note: string; kind: VocabKind }[];
  goalsDone?: number[];
}

/** Espera tras la última frase del alumno para juntar transcripciones partidas. */
const DEBOUNCE_MS = 900;

export function useLiveCoach({ targetLang, nativeLang, level, goals }: CoachOptions) {
  const [cards, setCards] = useState<LiveCard[]>([]);
  const [goalsDone, setGoalsDone] = useState<number[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const turns = useRef<CoachTurn[]>([]);
  /** Índice del primer turno que aún no se revisó. */
  const analyzedUpTo = useRef(0);
  const inFlight = useRef(false);
  const blockedUntil = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownTerms = useRef(new Set<string>());
  const shownCorrections = useRef(new Set<string>());
  const opts = useRef({ targetLang, nativeLang, level, goals });
  useEffect(() => {
    opts.current = { targetLang, nativeLang, level, goals };
  });

  const addCards = useCallback((next: LiveCard[]) => {
    const fresh = next.filter((c) => {
      const key = c.kind === 'vocab' ? c.term.toLowerCase() : `${c.said}→${c.better}`.toLowerCase();
      const seen = c.kind === 'vocab' ? shownTerms.current : shownCorrections.current;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    if (fresh.length) setCards((prev) => [...prev, ...fresh]);
  }, []);

  // analyze y schedule se llaman entre sí: schedule usa la versión más
  // reciente de analyze a través de esta ref.
  const analyzeRef = useRef<() => Promise<void>>(async () => {});
  const schedule = useCallback((delay: number) => {
    if (timer.current) clearTimeout(timer.current);
    const wait = Math.max(delay, blockedUntil.current - Date.now());
    timer.current = setTimeout(() => void analyzeRef.current(), wait);
  }, []);

  const analyze = useCallback(async () => {
    if (inFlight.current) return;
    const all = turns.current;
    const start = analyzedUpTo.current;
    const newTurns = all.slice(start);
    if (!newTurns.some((t) => t.role === 'student')) return;
    if (Date.now() < blockedUntil.current) {
      schedule(0);
      return;
    }

    inFlight.current = true;
    setAnalyzing(true);
    const end = all.length;
    // Dos turnos previos de contexto para que entienda la pregunta del tutor.
    const window = all.slice(Math.max(0, start - 2), end);
    const newIds = new Set(newTurns.map((t) => t.id));
    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...opts.current, turns: window }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 429) {
        blockedUntil.current = Date.now() + (Number(data.retryAfter) || 30) * 1000;
        return; // lo pendiente se reintenta en el finally
      }
      analyzedUpTo.current = end;
      if (!res.ok) return; // un fallo aislado no debe molestar la clase
      const { corrections = [], cards: vocab = [], goalsDone: done = [] } = data as CoachResponse;
      if (done.length) setGoalsDone((prev) => [...new Set([...prev, ...done])]);
      addCards([
        ...corrections
          .filter((c) => newIds.has(c.turnId))
          .map<CorrectionCard>((c, i) => ({
            kind: 'correction',
            id: `fix-${c.turnId}-${i}-${c.said}`,
            afterId: c.turnId,
            said: c.said,
            better: c.better,
            explanation: c.explanation,
            issue: c.kind,
          })),
        ...vocab.map<VocabCard>((c) => ({
          kind: 'vocab',
          id: `coach-${c.turnId}-${c.term}`,
          afterId: c.turnId,
          term: c.term,
          meaning: c.meaning,
          note: c.note || undefined,
          wordKind: c.kind,
        })),
      ]);
    } catch {
      analyzedUpTo.current = end;
    } finally {
      inFlight.current = false;
      setAnalyzing(false);
      // Llegaron frases nuevas mientras tanto (o hubo 429): otra vuelta.
      if (turns.current.slice(analyzedUpTo.current).some((t) => t.role === 'student')) schedule(DEBOUNCE_MS);
    }
  }, [addCards, schedule]);
  useEffect(() => {
    analyzeRef.current = analyze;
  }, [analyze]);

  /** Registra una frase de la clase. Las del tutor dan tarjetas del diccionario al instante. */
  const addTurn = useCallback(
    (turn: CoachTurn, uiLang: string) => {
      turns.current = [...turns.current, turn];
      if (turn.role === 'tutor') {
        addCards(dictionaryCards(turn, opts.current.targetLang, uiLang, shownTerms.current));
      } else {
        schedule(DEBOUNCE_MS);
      }
    },
    [addCards, schedule],
  );

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  /** El alumno marca (o desmarca) un objetivo a mano, por si el coach no lo detectó. */
  const toggleGoal = useCallback((index: number) => {
    setGoalsDone((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]));
  }, []);

  return { cards, analyzing, addTurn, goalsDone, toggleGoal };
}
