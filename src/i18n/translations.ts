export type UILang = 'es' | 'en' | 'fr' | 'ja' | 'de';

export const SUPPORTED_UI_LANGS: UILang[] = ['es', 'en', 'fr', 'ja', 'de'];

type Dict = Record<string, string>;

interface LangPack {
  strings: Dict;
  tutorReplies: string[];
  weekDays: string[];
  interests: Dict;
}

const es: LangPack = {
  strings: {
    'nav.logout': 'Salir',
    'nav.streak': '{days} días',

    'dashboard.greeting': 'Hola, {name} 👋',
    'dashboard.subtitle': 'Este es tu progreso. ¡Sigue así!',
    'dashboard.totalPoints': 'Puntos totales',
    'dashboard.weeklyMinutes': '{done} / {goal} min',
    'dashboard.weeklyGoal': 'Meta semanal ({percent}%)',
    'dashboard.languagesCount': '{count} idiomas',
    'dashboard.inProgress': 'En progreso',
    'dashboard.tutorCalloutTitle': 'Sabio te espera para tu próxima clase',
    'dashboard.tutorCalloutBody':
      'Practica conversación con tu tutor de IA cuando quieras, sin agendar nada.',
    'dashboard.startClassNow': 'Iniciar clase ahora',
    'dashboard.yourCourses': 'Tus cursos',
    'dashboard.statistics': 'Estadísticas',

    'weeklyActivity.heading': 'Actividad de la semana',

    'courseCard.lessonsProgress': '{done} de {total} lecciones',
    'courseCard.next': 'Siguiente:',
    'courseCard.startClass': 'Iniciar clase',

    'syllabusPicker.courseNotFound': 'No encontramos ese curso.',
    'syllabusPicker.backToDashboard': 'Volver al panel',
    'syllabusPicker.heading': 'Temario de {language}',
    'syllabusPicker.intro': 'Elige el tema que quieres practicar hoy y armamos la clase juntos.',

    'classRoom.welcomeMessage':
      '¡Hola! Soy Sabio, tu mago tutor de {language}. Hoy vamos a practicar "{topic}". Cuéntame, ¿cómo estuvo tu día? Intenta responder en {languageLower}.',
    'classRoom.courseNotFound': 'No encontramos ese curso.',
    'classRoom.backToDashboard': 'Volver al panel',
    'classRoom.headerTitle': 'Clase de {language}',
    'classRoom.tutorOnline': 'Sabio está en línea',
    'classRoom.todaysTopic': 'Tema de hoy: {topic}',
    'classRoom.micLabel': 'Hablar',
    'classRoom.inputPlaceholder': 'Escribe en {languageLower}…',
    'classRoom.sendLabel': 'Enviar mensaje',

    'onboarding.langStepMessage':
      '¡Hola! 👋 ¿En qué idioma prefieres usar la app? · Hi! Which language would you like to use the app in?',
    'onboarding.nativeLanguagePrompt': '¿Qué idioma hablas?',
    'onboarding.step2Message': '¡Hola, futuro políglota! Cuéntame tu nombre y qué te apasiona.',
    'onboarding.step3Message': '¿Qué idiomas quieres conquistar conmigo?',
    'onboarding.step4Message':
      '¿Cuál es tu nivel en cada uno? Así preparo las clases justas para ti.',
    'onboarding.finishingMessage': '¡Genial, {name}! Preparando tu primera clase…',
    'onboarding.nameLabel': '¿Cómo te llamas?',
    'onboarding.namePlaceholder': 'Tu nombre',
    'onboarding.interestsPrompt': '¿Qué te interesa? (elige las que quieras)',
    'onboarding.comingSoon': 'Próximamente',
    'onboarding.back': 'Atrás',
    'onboarding.continue': 'Continuar',
    'onboarding.preparing': 'Preparando…',
    'onboarding.startAdventure': 'Comenzar mi aventura',

    'login.tagline': 'Practica idiomas hablando con tu tutor de IA, en cualquier lugar del mundo 🌍',
    'login.welcomeBack': 'Bienvenido de nuevo',
    'login.subheading': 'Inicia sesión para continuar tu clase',
    'login.emailLabel': 'Correo electrónico',
    'login.emailPlaceholder': 'tu@email.com',
    'login.passwordLabel': 'Contraseña',
    'login.forgotPassword': '¿Olvidaste tu contraseña?',
    'login.signingIn': 'Ingresando…',
    'login.signIn': 'Iniciar sesión',
    'login.noAccount': '¿No tienes cuenta?',
    'login.signUpFree': 'Regístrate gratis',
    'login.demoNotice': 'Demo — cualquier correo y contraseña funcionan',
    'login.statLanguages': '+40 idiomas',
    'login.statAvailability': 'Disponible 24/7',
    'login.statFeedback': 'Feedback en tiempo real',
  },
  tutorReplies: [
    '¡Buen intento! Casi perfecto — recuerda que en este caso el verbo va en pasado. ¿Quieres que lo repasemos juntos?',
    'Correcto 🎉 Tu pronunciación mental de esa frase suena natural. Probemos algo un poco más difícil.',
    'Pequeño detalle: el orden de las palabras cambia aquí. En lugar de eso, intenta reformular la oración.',
    'Excelente uso del vocabulario nuevo. ¿Puedes usar esa misma palabra en otra oración distinta?',
    'Vamos bien. Te voy a dar una pista: fíjate en el tiempo verbal que usamos para hablar de planes futuros.',
    'Eso fue muy natural, como lo diría un hablante nativo. ¡Sigamos practicando!',
  ],
  weekDays: ['L', 'M', 'X', 'J', 'V', 'S', 'D'],
  interests: {
    travel: 'Viajes',
    business: 'Negocios',
    music: 'Música',
    film: 'Cine y series',
    games: 'Videojuegos',
    culture: 'Cultura',
    food: 'Gastronomía',
    sports: 'Deportes',
    literature: 'Literatura',
    tech: 'Tecnología',
  },
};

const en: LangPack = {
  strings: {
    'nav.logout': 'Log out',
    'nav.streak': '{days}-day streak',

    'dashboard.greeting': 'Hi, {name} 👋',
    'dashboard.subtitle': "Here's your progress. Keep it up!",
    'dashboard.totalPoints': 'Total points',
    'dashboard.weeklyMinutes': '{done} / {goal} min',
    'dashboard.weeklyGoal': 'Weekly goal ({percent}%)',
    'dashboard.languagesCount': '{count} languages',
    'dashboard.inProgress': 'In progress',
    'dashboard.tutorCalloutTitle': 'Sabio is ready for your next class',
    'dashboard.tutorCalloutBody':
      'Practice conversation with your AI tutor whenever you want, no scheduling needed.',
    'dashboard.startClassNow': 'Start class now',
    'dashboard.yourCourses': 'Your courses',
    'dashboard.statistics': 'Statistics',

    'weeklyActivity.heading': "This week's activity",

    'courseCard.lessonsProgress': '{done} of {total} lessons',
    'courseCard.next': 'Next:',
    'courseCard.startClass': 'Start class',

    'syllabusPicker.courseNotFound': "We couldn't find that course.",
    'syllabusPicker.backToDashboard': 'Back to dashboard',
    'syllabusPicker.heading': '{language} syllabus',
    'syllabusPicker.intro':
      "Choose the topic you want to practice today and we'll build the class together.",

    'classRoom.welcomeMessage':
      'Hi! I\'m Sabio, your wizard tutor for {language}. Today we\'re going to practice "{topic}". Tell me, how was your day? Try answering in {languageLower}.',
    'classRoom.courseNotFound': "We couldn't find that course.",
    'classRoom.backToDashboard': 'Back to dashboard',
    'classRoom.headerTitle': '{language} class',
    'classRoom.tutorOnline': 'Sabio is online',
    'classRoom.todaysTopic': "Today's topic: {topic}",
    'classRoom.micLabel': 'Speak',
    'classRoom.inputPlaceholder': 'Type in {languageLower}…',
    'classRoom.sendLabel': 'Send message',

    'onboarding.langStepMessage':
      '¡Hola! 👋 ¿En qué idioma prefieres usar la app? · Hi! Which language would you like to use the app in?',
    'onboarding.nativeLanguagePrompt': 'What language do you speak?',
    'onboarding.step2Message': "Hi, future polyglot! Tell me your name and what you're passionate about.",
    'onboarding.step3Message': 'Which languages do you want to conquer with me?',
    'onboarding.step4Message':
      "What's your level in each one? That way I can prepare the right classes for you.",
    'onboarding.finishingMessage': 'Great, {name}! Getting your first class ready…',
    'onboarding.nameLabel': "What's your name?",
    'onboarding.namePlaceholder': 'Your name',
    'onboarding.interestsPrompt': "What are you into? (pick as many as you like)",
    'onboarding.comingSoon': 'Coming soon',
    'onboarding.back': 'Back',
    'onboarding.continue': 'Continue',
    'onboarding.preparing': 'Getting ready…',
    'onboarding.startAdventure': 'Start my adventure',

    'login.tagline': 'Practice languages by talking with your AI tutor, anywhere in the world 🌍',
    'login.welcomeBack': 'Welcome back',
    'login.subheading': 'Sign in to continue your class',
    'login.emailLabel': 'Email',
    'login.emailPlaceholder': 'you@email.com',
    'login.passwordLabel': 'Password',
    'login.forgotPassword': 'Forgot your password?',
    'login.signingIn': 'Signing in…',
    'login.signIn': 'Sign in',
    'login.noAccount': "Don't have an account?",
    'login.signUpFree': 'Sign up for free',
    'login.demoNotice': 'Demo — any email and password work',
    'login.statLanguages': '40+ languages',
    'login.statAvailability': 'Available 24/7',
    'login.statFeedback': 'Real-time feedback',
  },
  tutorReplies: [
    'Good try! Almost perfect — remember the verb goes in the past tense here. Want to go over it together?',
    "Correct 🎉 That sentence sounds natural. Let's try something a bit harder.",
    'Small detail: the word order changes here. Try rephrasing the sentence instead.',
    'Great use of the new vocabulary. Can you use that same word in a different sentence?',
    "You're doing well. Here's a hint: pay attention to the verb tense we use to talk about future plans.",
    "That sounded very natural, just like a native speaker would say it. Let's keep practicing!",
  ],
  weekDays: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
  interests: {
    travel: 'Travel',
    business: 'Business',
    music: 'Music',
    film: 'Movies & TV',
    games: 'Video games',
    culture: 'Culture',
    food: 'Food',
    sports: 'Sports',
    literature: 'Literature',
    tech: 'Technology',
  },
};

const fr: LangPack = {
  strings: {
    'nav.logout': 'Déconnexion',
    'nav.streak': '{days} jours',

    'dashboard.greeting': 'Salut, {name} 👋',
    'dashboard.subtitle': 'Voici tes progrès. Continue comme ça !',
    'dashboard.totalPoints': 'Points totaux',
    'dashboard.weeklyMinutes': '{done} / {goal} min',
    'dashboard.weeklyGoal': 'Objectif hebdo ({percent} %)',
    'dashboard.languagesCount': '{count} langues',
    'dashboard.inProgress': 'En cours',
    'dashboard.tutorCalloutTitle': 'Sabio t’attend pour ton prochain cours',
    'dashboard.tutorCalloutBody':
      'Pratique la conversation avec ton tuteur IA quand tu veux, sans rendez-vous.',
    'dashboard.startClassNow': 'Commencer le cours',
    'dashboard.yourCourses': 'Tes cours',
    'dashboard.statistics': 'Statistiques',

    'weeklyActivity.heading': 'Activité de la semaine',

    'courseCard.lessonsProgress': '{done} sur {total} leçons',
    'courseCard.next': 'Suivant :',
    'courseCard.startClass': 'Commencer le cours',

    'syllabusPicker.courseNotFound': "Nous n'avons pas trouvé ce cours.",
    'syllabusPicker.backToDashboard': 'Retour au tableau de bord',
    'syllabusPicker.heading': 'Programme de {language}',
    'syllabusPicker.intro':
      "Choisis le thème que tu veux pratiquer aujourd'hui et on prépare le cours ensemble.",

    'classRoom.welcomeMessage':
      'Salut ! Je suis Sabio, ton tuteur magicien de {language}. Aujourd’hui on va pratiquer « {topic} ». Raconte-moi, comment s’est passée ta journée ? Essaie de répondre en {languageLower}.',
    'classRoom.courseNotFound': "Nous n'avons pas trouvé ce cours.",
    'classRoom.backToDashboard': 'Retour au tableau de bord',
    'classRoom.headerTitle': 'Cours de {language}',
    'classRoom.tutorOnline': 'Sabio est en ligne',
    'classRoom.todaysTopic': 'Thème du jour : {topic}',
    'classRoom.micLabel': 'Parler',
    'classRoom.inputPlaceholder': 'Écris en {languageLower}…',
    'classRoom.sendLabel': 'Envoyer le message',

    'onboarding.langStepMessage':
      '¡Hola! 👋 ¿En qué idioma prefieres usar la app? · Hi! Which language would you like to use the app in?',
    'onboarding.nativeLanguagePrompt': 'Quelle langue parles-tu ?',
    'onboarding.step2Message': 'Salut, futur polyglotte ! Dis-moi ton prénom et ce qui te passionne.',
    'onboarding.step3Message': 'Quelles langues veux-tu conquérir avec moi ?',
    'onboarding.step4Message':
      'Quel est ton niveau dans chacune ? Comme ça je prépare des cours à ta mesure.',
    'onboarding.finishingMessage': 'Super, {name} ! Je prépare ton premier cours…',
    'onboarding.nameLabel': "Comment tu t'appelles ?",
    'onboarding.namePlaceholder': 'Ton prénom',
    'onboarding.interestsPrompt': "Qu'est-ce qui t'intéresse ? (choisis-en autant que tu veux)",
    'onboarding.comingSoon': 'Bientôt disponible',
    'onboarding.back': 'Retour',
    'onboarding.continue': 'Continuer',
    'onboarding.preparing': 'Préparation…',
    'onboarding.startAdventure': 'Commencer mon aventure',

    'login.tagline': 'Pratique les langues en discutant avec ton tuteur IA, partout dans le monde 🌍',
    'login.welcomeBack': 'Content de te revoir',
    'login.subheading': 'Connecte-toi pour continuer ton cours',
    'login.emailLabel': 'E-mail',
    'login.emailPlaceholder': 'toi@email.com',
    'login.passwordLabel': 'Mot de passe',
    'login.forgotPassword': 'Mot de passe oublié ?',
    'login.signingIn': 'Connexion…',
    'login.signIn': 'Se connecter',
    'login.noAccount': 'Pas encore de compte ?',
    'login.signUpFree': 'Inscris-toi gratuitement',
    'login.demoNotice': "Démo — n'importe quel e-mail et mot de passe fonctionnent",
    'login.statLanguages': '+40 langues',
    'login.statAvailability': 'Disponible 24/7',
    'login.statFeedback': 'Retour en temps réel',
  },
  tutorReplies: [
    "Bien essayé ! Presque parfait — n'oublie pas que le verbe est au passé ici. On revoit ça ensemble ?",
    "Correct 🎉 Cette phrase sonne naturelle. Essayons quelque chose d'un peu plus difficile.",
    "Petit détail : l'ordre des mots change ici. Essaie plutôt de reformuler la phrase.",
    'Excellente utilisation du nouveau vocabulaire. Peux-tu réutiliser ce mot dans une autre phrase ?',
    'Tu es sur la bonne voie. Un indice : fais attention au temps qu’on utilise pour parler de projets futurs.',
    'Ça sonnait très naturel, comme le dirait un locuteur natif. Continuons à pratiquer !',
  ],
  weekDays: ['L', 'M', 'Me', 'J', 'V', 'S', 'D'],
  interests: {
    travel: 'Voyages',
    business: 'Affaires',
    music: 'Musique',
    film: 'Cinéma et séries',
    games: 'Jeux vidéo',
    culture: 'Culture',
    food: 'Gastronomie',
    sports: 'Sport',
    literature: 'Littérature',
    tech: 'Technologie',
  },
};

const ja: LangPack = {
  strings: {
    'nav.logout': 'ログアウト',
    'nav.streak': '{days}日連続',

    'dashboard.greeting': 'こんにちは、{name}さん 👋',
    'dashboard.subtitle': 'これがあなたの進捗です。その調子！',
    'dashboard.totalPoints': '合計ポイント',
    'dashboard.weeklyMinutes': '{done} / {goal} 分',
    'dashboard.weeklyGoal': '週間目標（{percent}%）',
    'dashboard.languagesCount': '{count}言語',
    'dashboard.inProgress': '学習中',
    'dashboard.tutorCalloutTitle': 'サビオが次のレッスンを待っています',
    'dashboard.tutorCalloutBody': '予約不要で、いつでもAIチューターと会話練習ができます。',
    'dashboard.startClassNow': '今すぐレッスンを始める',
    'dashboard.yourCourses': 'あなたのコース',
    'dashboard.statistics': '統計',

    'weeklyActivity.heading': '今週のアクティビティ',

    'courseCard.lessonsProgress': '{total}レッスン中{done}件',
    'courseCard.next': '次へ:',
    'courseCard.startClass': 'レッスンを始める',

    'syllabusPicker.courseNotFound': 'そのコースが見つかりませんでした。',
    'syllabusPicker.backToDashboard': 'ダッシュボードに戻る',
    'syllabusPicker.heading': '{language}のシラバス',
    'syllabusPicker.intro': '今日練習したいトピックを選んで、一緒にレッスンを組み立てましょう。',

    'classRoom.welcomeMessage':
      'こんにちは！私はサビオ、あなたの{language}の魔法使いチューターです。今日は「{topic}」を練習しましょう。今日はどんな一日でしたか？{languageLower}で答えてみてください。',
    'classRoom.courseNotFound': 'そのコースが見つかりませんでした。',
    'classRoom.backToDashboard': 'ダッシュボードに戻る',
    'classRoom.headerTitle': '{language}のレッスン',
    'classRoom.tutorOnline': 'サビオはオンラインです',
    'classRoom.todaysTopic': '今日のトピック: {topic}',
    'classRoom.micLabel': '話す',
    'classRoom.inputPlaceholder': '{languageLower}で入力…',
    'classRoom.sendLabel': 'メッセージを送信',

    'onboarding.langStepMessage':
      '¡Hola! 👋 ¿En qué idioma prefieres usar la app? · Hi! Which language would you like to use the app in?',
    'onboarding.nativeLanguagePrompt': '何語を話しますか？',
    'onboarding.step2Message': 'こんにちは、未来のポリグロットさん！お名前と興味のあることを教えてください。',
    'onboarding.step3Message': '私と一緒にどの言語を制覇したいですか？',
    'onboarding.step4Message': 'それぞれのレベルはどれくらいですか？ぴったりのレッスンを用意します。',
    'onboarding.finishingMessage': '素晴らしい、{name}さん！最初のレッスンを準備しています…',
    'onboarding.nameLabel': 'お名前は？',
    'onboarding.namePlaceholder': 'お名前',
    'onboarding.interestsPrompt': '興味のあることは？（いくつでも選んでください）',
    'onboarding.comingSoon': '近日公開',
    'onboarding.back': '戻る',
    'onboarding.continue': '続ける',
    'onboarding.preparing': '準備中…',
    'onboarding.startAdventure': '冒険を始める',

    'login.tagline': '世界のどこにいても、AIチューターと話しながら言語を練習しよう 🌍',
    'login.welcomeBack': 'おかえりなさい',
    'login.subheading': 'ログインしてレッスンを続けましょう',
    'login.emailLabel': 'メールアドレス',
    'login.emailPlaceholder': 'you@email.com',
    'login.passwordLabel': 'パスワード',
    'login.forgotPassword': 'パスワードをお忘れですか？',
    'login.signingIn': 'ログイン中…',
    'login.signIn': 'ログイン',
    'login.noAccount': 'アカウントをお持ちでないですか？',
    'login.signUpFree': '無料で登録',
    'login.demoNotice': 'デモ版 — どのメールとパスワードでも動作します',
    'login.statLanguages': '40以上の言語',
    'login.statAvailability': '24時間365日利用可能',
    'login.statFeedback': 'リアルタイムフィードバック',
  },
  tutorReplies: [
    'いい感じです！ほぼ完璧ですが、ここでは動詞が過去形になることを覚えておいてくださいね。一緒に復習しましょうか？',
    '正解です 🎉 その文はとても自然に聞こえます。もう少し難しいものに挑戦してみましょう。',
    '細かい点ですが、ここでは語順が変わります。文を言い換えてみてください。',
    '新しい単語をうまく使えましたね。同じ単語を別の文でも使えますか？',
    '順調です。ヒントをひとつ：未来の予定について話すときに使う時制に注目してみてください。',
    'とても自然でしたね、まるでネイティブスピーカーのようでした。この調子で練習を続けましょう！',
  ],
  weekDays: ['月', '火', '水', '木', '金', '土', '日'],
  interests: {
    travel: '旅行',
    business: 'ビジネス',
    music: '音楽',
    film: '映画・ドラマ',
    games: 'ゲーム',
    culture: '文化',
    food: 'グルメ',
    sports: 'スポーツ',
    literature: '文学',
    tech: 'テクノロジー',
  },
};

const de: LangPack = {
  strings: {
    'nav.logout': 'Abmelden',
    'nav.streak': '{days} Tage',

    'dashboard.greeting': 'Hallo, {name} 👋',
    'dashboard.subtitle': 'Das ist dein Fortschritt. Weiter so!',
    'dashboard.totalPoints': 'Punkte insgesamt',
    'dashboard.weeklyMinutes': '{done} / {goal} Min.',
    'dashboard.weeklyGoal': 'Wochenziel ({percent} %)',
    'dashboard.languagesCount': '{count} Sprachen',
    'dashboard.inProgress': 'In Bearbeitung',
    'dashboard.tutorCalloutTitle': 'Sabio wartet auf deine nächste Stunde',
    'dashboard.tutorCalloutBody':
      'Übe Konversation mit deinem KI-Tutor, wann immer du willst — ganz ohne Termin.',
    'dashboard.startClassNow': 'Jetzt Stunde starten',
    'dashboard.yourCourses': 'Deine Kurse',
    'dashboard.statistics': 'Statistik',

    'weeklyActivity.heading': 'Aktivität dieser Woche',

    'courseCard.lessonsProgress': '{done} von {total} Lektionen',
    'courseCard.next': 'Als Nächstes:',
    'courseCard.startClass': 'Stunde starten',

    'syllabusPicker.courseNotFound': 'Diesen Kurs konnten wir nicht finden.',
    'syllabusPicker.backToDashboard': 'Zurück zum Dashboard',
    'syllabusPicker.heading': '{language}-Lehrplan',
    'syllabusPicker.intro':
      'Wähle das Thema, das du heute üben möchtest, und wir gestalten die Stunde gemeinsam.',

    'classRoom.welcomeMessage':
      'Hallo! Ich bin Sabio, dein Zauberer-Tutor für {language}. Heute üben wir „{topic}“. Erzähl mir, wie war dein Tag? Versuch auf {languageLower} zu antworten.',
    'classRoom.courseNotFound': 'Diesen Kurs konnten wir nicht finden.',
    'classRoom.backToDashboard': 'Zurück zum Dashboard',
    'classRoom.headerTitle': '{language}-Stunde',
    'classRoom.tutorOnline': 'Sabio ist online',
    'classRoom.todaysTopic': 'Heutiges Thema: {topic}',
    'classRoom.micLabel': 'Sprechen',
    'classRoom.inputPlaceholder': 'Auf {languageLower} schreiben…',
    'classRoom.sendLabel': 'Nachricht senden',

    'onboarding.langStepMessage':
      '¡Hola! 👋 ¿En qué idioma prefieres usar la app? · Hi! Which language would you like to use the app in?',
    'onboarding.nativeLanguagePrompt': 'Welche Sprache sprichst du?',
    'onboarding.step2Message':
      'Hallo, zukünftiges Sprachtalent! Erzähl mir deinen Namen und wofür du dich begeisterst.',
    'onboarding.step3Message': 'Welche Sprachen möchtest du mit mir erobern?',
    'onboarding.step4Message':
      'Wie ist dein Niveau in jeder davon? So kann ich passende Stunden vorbereiten.',
    'onboarding.finishingMessage': 'Klasse, {name}! Ich bereite deine erste Stunde vor…',
    'onboarding.nameLabel': 'Wie heißt du?',
    'onboarding.namePlaceholder': 'Dein Name',
    'onboarding.interestsPrompt': 'Wofür interessierst du dich? (wähle so viele du möchtest)',
    'onboarding.comingSoon': 'Demnächst',
    'onboarding.back': 'Zurück',
    'onboarding.continue': 'Weiter',
    'onboarding.preparing': 'Wird vorbereitet…',
    'onboarding.startAdventure': 'Mein Abenteuer beginnen',

    'login.tagline': 'Übe Sprachen im Gespräch mit deinem KI-Tutor, egal wo auf der Welt 🌍',
    'login.welcomeBack': 'Willkommen zurück',
    'login.subheading': 'Melde dich an, um deine Stunde fortzusetzen',
    'login.emailLabel': 'E-Mail',
    'login.emailPlaceholder': 'du@email.com',
    'login.passwordLabel': 'Passwort',
    'login.forgotPassword': 'Passwort vergessen?',
    'login.signingIn': 'Anmeldung…',
    'login.signIn': 'Anmelden',
    'login.noAccount': 'Noch kein Konto?',
    'login.signUpFree': 'Kostenlos registrieren',
    'login.demoNotice': 'Demo — jede E-Mail und jedes Passwort funktionieren',
    'login.statLanguages': '40+ Sprachen',
    'login.statAvailability': 'Rund um die Uhr verfügbar',
    'login.statFeedback': 'Feedback in Echtzeit',
  },
  tutorReplies: [
    'Guter Versuch! Fast perfekt — denk daran, dass das Verb hier im Präteritum steht. Sollen wir das zusammen wiederholen?',
    'Richtig 🎉 Dieser Satz klingt natürlich. Versuchen wir etwas Schwierigeres.',
    'Kleines Detail: Hier ändert sich die Wortstellung. Versuch stattdessen, den Satz umzuformulieren.',
    'Toll, wie du das neue Wort benutzt hast. Kannst du dasselbe Wort in einem anderen Satz verwenden?',
    'Du machst das gut. Ein Tipp: Achte auf die Zeitform, die wir für zukünftige Pläne verwenden.',
    'Das klang sehr natürlich, genau wie ein Muttersprachler es sagen würde. Weiter so!',
  ],
  weekDays: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
  interests: {
    travel: 'Reisen',
    business: 'Business',
    music: 'Musik',
    film: 'Filme & Serien',
    games: 'Videospiele',
    culture: 'Kultur',
    food: 'Kulinarik',
    sports: 'Sport',
    literature: 'Literatur',
    tech: 'Technologie',
  },
};

const packs: Record<UILang, LangPack> = { es, en, fr, ja, de };

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

export function isUILang(value: string | undefined): value is UILang {
  return !!value && (SUPPORTED_UI_LANGS as string[]).includes(value);
}

export function translate(
  lang: UILang,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const template = packs[lang].strings[key] ?? packs.es.strings[key] ?? key;
  return interpolate(template, vars);
}

export function getTutorReplies(lang: UILang): string[] {
  return packs[lang].tutorReplies;
}

export function getWeekDays(lang: UILang): string[] {
  return packs[lang].weekDays;
}

export function getInterestLabel(lang: UILang, id: string): string {
  return packs[lang].interests[id] ?? packs.es.interests[id] ?? id;
}
