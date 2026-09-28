import { SPEECH_LANG } from '../data/flashcards';

/** Lo que se lee en voz alta: sin la parte entre paréntesis (kanji) ni el "〜". */
function speakable(text: string): string {
  return text.replace(/（.*?）|\(.*?\)/g, '').replace(/〜/g, '').trim();
}

/** Pronuncia un texto con la voz del navegador (gratis, sin gastar créditos de voz). */
export function speak(text: string, languageId: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const utterance = new SpeechSynthesisUtterance(speakable(text));
  utterance.lang = SPEECH_LANG[languageId] ?? languageId;
  utterance.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}
