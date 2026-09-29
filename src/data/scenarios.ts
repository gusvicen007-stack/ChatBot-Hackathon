import type { Gloss, Theme } from './flashcards/types';

/**
 * Simulaciones: Sabio actúa un papel (barista, recepcionista, entrevistador…)
 * y el alumno cumple una misión en el idioma que aprende.
 *
 * `role`, `studentRole`, `situation` y `goals[].prompt` van en inglés porque
 * son instrucciones para el modelo; lo que ve el alumno está en `title`,
 * `description` y `goals[].label`.
 */
export interface Scenario {
  id: string;
  emoji: string;
  /** Mazo de flashcards que acompaña la simulación. */
  theme: Theme;
  /** Nivel sugerido (se puede practicar en cualquier nivel). */
  level: 'A1' | 'A2' | 'B1';
  title: Gloss;
  description: Gloss;
  role: string;
  studentRole: string;
  situation: string;
  goals: { prompt: string; label: Gloss }[];
  /** Primera frase del personaje, por idioma de voz. */
  greeting: Record<string, string>;
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'cafe',
    emoji: '☕',
    theme: 'food',
    level: 'A1',
    title: { es: 'Pedir un café', en: 'Order a coffee' },
    description: { es: 'Eres cliente en una cafetería.', en: "You're a customer at a café." },
    role: 'a friendly barista at Café Luna',
    studentRole: 'a customer',
    situation: 'The student walks up to the counter of a small café in the morning.',
    goals: [
      { prompt: 'order a drink', label: { es: 'Pide una bebida', en: 'Order a drink' } },
      { prompt: 'choose a size or order something to eat', label: { es: 'Elige el tamaño o algo de comer', en: 'Choose a size or something to eat' } },
      { prompt: 'ask how much it costs and pay', label: { es: 'Pregunta el precio y paga', en: 'Ask the price and pay' } },
    ],
    greeting: {
      en: 'Hi! Welcome to Café Luna. What can I get you?',
      es: '¡Hola! Bienvenido a Café Luna. ¿Qué te pongo?',
      fr: "Bonjour ! Bienvenue au Café Luna. Qu'est-ce que je vous sers ?",
      de: 'Hallo! Willkommen im Café Luna. Was darf es sein?',
    },
  },
  {
    id: 'restaurant',
    emoji: '🍽️',
    theme: 'food',
    level: 'A2',
    title: { es: 'Reservar en un restaurante', en: 'Book a restaurant' },
    description: { es: 'Llamas por teléfono para reservar una mesa.', en: 'You call to book a table.' },
    role: 'the host answering the phone at the restaurant La Terraza',
    studentRole: 'a customer calling to make a reservation',
    situation: 'A phone call to a busy restaurant. Tables are available but you must ask for the details.',
    goals: [
      { prompt: 'ask for a table for a specific day and time', label: { es: 'Pide mesa para un día y hora', en: 'Ask for a table on a day and time' } },
      { prompt: 'say how many people are coming', label: { es: 'Di cuántas personas van', en: 'Say how many people are coming' } },
      { prompt: 'give a name for the booking or make a special request', label: { es: 'Da tu nombre o una petición especial', en: 'Give your name or a special request' } },
    ],
    greeting: {
      en: 'Good evening, La Terraza restaurant. How can I help you?',
      es: 'Buenas tardes, restaurante La Terraza. ¿En qué puedo ayudarle?',
      fr: 'Bonsoir, restaurant La Terrasse, je vous écoute.',
      de: 'Guten Abend, Restaurant Die Terrasse. Was kann ich für Sie tun?',
    },
  },
  {
    id: 'hotel',
    emoji: '🏨',
    theme: 'travel',
    level: 'A2',
    title: { es: 'Registrarte en un hotel', en: 'Check in at a hotel' },
    description: { es: 'Llegas a la recepción del hotel.', en: 'You arrive at the hotel front desk.' },
    role: 'a receptionist at the Hotel Central',
    studentRole: 'a guest who has a reservation',
    situation: 'The student arrives at the front desk with luggage after a long trip.',
    goals: [
      { prompt: 'check in and give the name of the reservation', label: { es: 'Haz el check-in con tu reserva', en: 'Check in with your reservation' } },
      { prompt: 'ask about breakfast (time or place)', label: { es: 'Pregunta por el desayuno', en: 'Ask about breakfast' } },
      { prompt: 'ask for the wifi password or another service', label: { es: 'Pide el wifi u otro servicio', en: 'Ask for the wifi or another service' } },
    ],
    greeting: {
      en: 'Good afternoon and welcome to the Hotel Central. Do you have a reservation?',
      es: 'Buenas tardes, bienvenido al Hotel Central. ¿Tiene una reserva?',
      fr: "Bonjour et bienvenue à l'Hôtel Central. Vous avez une réservation ?",
      de: 'Guten Tag und willkommen im Hotel Central. Haben Sie eine Reservierung?',
    },
  },
  {
    id: 'directions',
    emoji: '🗺️',
    theme: 'city',
    level: 'A1',
    title: { es: 'Pedir direcciones', en: 'Ask for directions' },
    description: { es: 'Estás perdido en una ciudad nueva.', en: "You're lost in a new city." },
    role: 'a friendly local on the street',
    studentRole: 'a lost tourist',
    situation: 'The student is lost downtown and wants to reach the train station, about ten minutes away on foot.',
    goals: [
      { prompt: 'ask how to get to the train station', label: { es: 'Pregunta cómo llegar a la estación', en: 'Ask how to get to the station' } },
      { prompt: 'ask how far it is or how long it takes', label: { es: 'Pregunta qué tan lejos está', en: 'Ask how far it is' } },
      { prompt: 'thank the person and say goodbye', label: { es: 'Da las gracias y despídete', en: 'Say thanks and goodbye' } },
    ],
    greeting: {
      en: 'Hi! You look a little lost. Can I help you?',
      es: '¡Hola! Pareces un poco perdido. ¿Te ayudo?',
      fr: "Bonjour ! Vous avez l'air un peu perdu. Je peux vous aider ?",
      de: 'Hallo! Sie sehen etwas verloren aus. Kann ich Ihnen helfen?',
    },
  },
  {
    id: 'shopping',
    emoji: '👕',
    theme: 'shopping',
    level: 'A1',
    title: { es: 'Comprar ropa', en: 'Buy clothes' },
    description: { es: 'Buscas algo en una tienda de ropa.', en: "You're shopping for clothes." },
    role: 'a shop assistant in a clothing store',
    studentRole: 'a customer',
    situation: 'The student enters a clothing store looking for something to buy.',
    goals: [
      { prompt: 'ask for a piece of clothing in their size', label: { es: 'Pide una prenda en tu talla', en: 'Ask for an item in your size' } },
      { prompt: 'ask the price', label: { es: 'Pregunta el precio', en: 'Ask the price' } },
      { prompt: 'decide to buy it or not and say why', label: { es: 'Decide si lo compras', en: 'Decide whether to buy it' } },
    ],
    greeting: {
      en: 'Hello! Are you looking for anything in particular?',
      es: '¡Hola! ¿Buscas algo en especial?',
      fr: 'Bonjour ! Vous cherchez quelque chose en particulier ?',
      de: 'Hallo! Suchen Sie etwas Bestimmtes?',
    },
  },
  {
    id: 'doctor',
    emoji: '🩺',
    theme: 'health',
    level: 'A2',
    title: { es: 'Ir al médico', en: 'See a doctor' },
    description: { es: 'Le cuentas al médico cómo te sientes.', en: 'You tell the doctor how you feel.' },
    role: 'a kind family doctor',
    studentRole: 'a patient who feels unwell',
    situation: 'A short visit to the doctor for a common illness (a cold, a headache or a stomach ache).',
    goals: [
      { prompt: 'describe the symptoms', label: { es: 'Describe tus síntomas', en: 'Describe your symptoms' } },
      { prompt: 'say since when they feel this way', label: { es: 'Di desde cuándo te sientes así', en: 'Say since when' } },
      { prompt: 'ask what to do or what medicine to take', label: { es: 'Pregunta qué hacer o qué tomar', en: 'Ask what to do or take' } },
    ],
    greeting: {
      en: 'Good morning, come in and have a seat. What brings you here today?',
      es: 'Buenos días, pase y siéntese. ¿Qué le trae por aquí?',
      fr: "Bonjour, entrez et asseyez-vous. Qu'est-ce qui vous amène aujourd'hui ?",
      de: 'Guten Morgen, kommen Sie herein und setzen Sie sich. Was führt Sie heute zu mir?',
    },
  },
  {
    id: 'interview',
    emoji: '💼',
    theme: 'work',
    level: 'B1',
    title: { es: 'Entrevista de trabajo', en: 'Job interview' },
    description: { es: 'Te entrevistan para un puesto nuevo.', en: "You're interviewed for a new job." },
    role: 'a hiring manager interviewing a candidate',
    studentRole: 'a job candidate',
    situation: 'A job interview for a position the student chooses (if they do not say, assume an office job).',
    goals: [
      { prompt: 'introduce themselves and describe their experience', label: { es: 'Preséntate y cuenta tu experiencia', en: 'Introduce yourself and your experience' } },
      { prompt: 'explain why they want the job', label: { es: 'Explica por qué quieres el puesto', en: 'Explain why you want the job' } },
      { prompt: 'ask the interviewer a question about the job', label: { es: 'Haz una pregunta sobre el puesto', en: 'Ask a question about the job' } },
    ],
    greeting: {
      en: 'Good morning, thanks for coming in. Please, tell me a little about yourself.',
      es: 'Buenos días, gracias por venir. Cuénteme un poco sobre usted.',
      fr: "Bonjour, merci d'être venu. Parlez-moi un peu de vous.",
      de: 'Guten Morgen, danke, dass Sie gekommen sind. Erzählen Sie mir bitte etwas über sich.',
    },
  },
  {
    id: 'party',
    emoji: '🎉',
    theme: 'greetings',
    level: 'A1',
    title: { es: 'Conocer gente en una fiesta', en: 'Meet people at a party' },
    description: { es: 'Conversas con alguien nuevo.', en: 'You chat with someone new.' },
    role: 'Alex, a friendly guest at a birthday party',
    studentRole: 'another guest',
    situation: 'Both of you are at a friend’s birthday party and have just met.',
    goals: [
      { prompt: 'introduce themselves', label: { es: 'Preséntate', en: 'Introduce yourself' } },
      { prompt: 'ask where the other person is from', label: { es: 'Pregunta de dónde es', en: 'Ask where they are from' } },
      { prompt: 'talk about their hobbies', label: { es: 'Habla de tus pasatiempos', en: 'Talk about your hobbies' } },
    ],
    greeting: {
      en: "Hey! I don't think we've met. I'm Alex!",
      es: '¡Hola! Creo que no nos conocemos. ¡Soy Álex!',
      fr: "Salut ! Je crois qu'on ne se connaît pas. Moi, c'est Alex !",
      de: 'Hallo! Ich glaube, wir kennen uns noch nicht. Ich bin Alex!',
    },
  },
];

export function getScenario(id: string | undefined): Scenario | null {
  return SCENARIOS.find((s) => s.id === id) ?? null;
}

/** XP de una simulación: base + extra por cada objetivo cumplido. */
export const SCENARIO_BASE_XP = 10;
export const SCENARIO_GOAL_XP = 5;
