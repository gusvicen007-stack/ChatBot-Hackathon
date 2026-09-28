import { deck } from './types';

const _ = undefined;

export default deck(
  {
    greetings: [
      ['はじめまして', 'Mucho gusto (al conocerse)', 'Nice to meet you', 'はじめまして、アナです。', _, _, 'hajimemashite'],
      ['こんにちは', 'Hola / Buenas tardes', 'Hello', 'こんにちは、おげんきですか。', 'La "は" final se lee "wa" (es la partícula).', 'The final "は" is read "wa" (it is the particle).', 'konnichiwa'],
      ['またね', 'Nos vemos', 'See you', 'じゃあ、またね！', _, _, 'mata ne'],
      ['わたしは〜です', 'Yo soy ~', 'I am ~', 'わたしはマリアです。', _, _, 'watashi wa ~ desu'],
      ['よろしくおねがいします', 'Encantado / Cuento contigo', 'Nice to meet you / Please treat me well', 'はじめまして。よろしくおねがいします。', 'Se dice al presentarte y al pedir un favor.', 'Said when introducing yourself and when asking a favor.', 'yoroshiku onegaishimasu'],
    ],
    family: [
      ['かぞく（家族）', 'familia', 'family', 'かぞくはよにんです。', _, _, 'kazoku'],
      ['はは / おかあさん', 'mi madre / madre (de otro)', 'my mother / (someone’s) mother', 'はははせんせいです。', 'De tu familia: はは. De otros o al llamarla: おかあさん.', 'Your own: はは. Someone else’s, or to address her: おかあさん.', 'haha / okaasan'],
      ['ちち / おとうさん', 'mi padre / padre (de otro)', 'my father / (someone’s) father', 'ちちはかいしゃいんです。', _, _, 'chichi / otousan'],
      ['きょうだい（兄弟）', 'hermanos', 'siblings', 'きょうだいがいますか。', _, _, 'kyoudai'],
      ['あに / あね', 'mi hermano mayor / mi hermana mayor', 'my older brother / older sister', 'あにはとうきょうにすんでいます。', _, _, 'ani / ane'],
    ],
    food: [
      ['いただきます', 'se dice antes de comer', 'said before eating', 'いただきます！', 'Después de comer: ごちそうさまでした.', 'After eating: gochisousama deshita.', 'itadakimasu'],
      ['おいしい', 'delicioso', 'delicious', 'このラーメンはおいしいです。', _, _, 'oishii'],
      ['〜をください', 'Deme ~, por favor', 'Please give me ~', 'おちゃをください。', _, _, '~ o kudasai'],
      ['おなかがすきました', 'Tengo hambre', "I'm hungry", 'おなかがすきました。たべましょう。', _, _, 'onaka ga sukimashita'],
      ['あさごはん（朝ご飯）', 'desayuno', 'breakfast', 'まいにちあさごはんをたべます。', _, _, 'asagohan'],
    ],
    time: [
      ['いまなんじですか', '¿Qué hora es?', 'What time is it?', 'いまなんじですか。— さんじです。', _, _, 'ima nanji desu ka'],
      ['〜じはん（時半）', 'y media', 'half past', 'しちじはんにおきます。', _, _, '~ ji han'],
      ['しゅうまつ（週末）', 'fin de semana', 'weekend', 'しゅうまつはなにをしますか。', _, _, 'shuumatsu'],
      ['いいてんきですね', 'Hace buen tiempo, ¿verdad?', "Nice weather, isn't it?", 'きょうはいいてんきですね。', '"ね" al final busca complicidad, como "¿verdad?".', 'Ending "ね" invites agreement, like "isn’t it?".', 'ii tenki desu ne'],
      ['まいにち（毎日）', 'todos los días', 'every day', 'まいにちにほんごをべんきょうします。', _, _, 'mainichi'],
    ],
    city: [
      ['みぎ / ひだり', 'derecha / izquierda', 'right / left', 'かどをみぎにまがってください。', _, _, 'migi / hidari'],
      ['まっすぐ', 'todo recto', 'straight ahead', 'まっすぐいってください。', _, _, 'massugu'],
      ['〜のとなり', 'al lado de ~', 'next to ~', 'カフェはえきのとなりです。', _, _, '~ no tonari'],
      ['えき（駅）', 'estación', 'station', 'えきはどこですか。', _, _, 'eki'],
      ['バスてい（バス停）', 'parada de autobús', 'bus stop', 'バスていはあそこです。', _, _, 'basutei'],
    ],
    shopping: [
      ['いくらですか', '¿Cuánto cuesta?', 'How much is it?', 'これはいくらですか。', _, _, 'ikura desu ka'],
      ['しちゃくしてもいいですか', '¿Me lo puedo probar?', 'May I try it on?', 'このシャツ、しちゃくしてもいいですか。', _, _, 'shichaku shite mo ii desu ka'],
      ['サイズ', 'talla', 'size', 'エムサイズはありますか。', 'Las palabras extranjeras se escriben en katakana: サイズ = size.', 'Loanwords are written in katakana: サイズ = size.', 'saizu'],
      ['セール', 'rebajas / oferta', 'sale', 'いまセールちゅうです。', _, _, 'seeru'],
      ['レシート', 'recibo', 'receipt', 'レシートをください。', _, _, 'reshiito'],
    ],
    health: [
      ['あたまがいたいです', 'Me duele la cabeza', 'I have a headache', 'けさからあたまがいたいです。', _, _, 'atama ga itai desu'],
      ['びょうき（病気）', 'enfermedad / enfermo', 'illness / sick', 'びょうきでがっこうをやすみました。', _, _, 'byouki'],
      ['びょういん（病院）', 'hospital / clínica', 'hospital / clinic', 'びょういんにいきます。', 'No lo confundas con びよういん (salón de belleza).', 'Don’t mix it up with びよういん (beauty salon).', 'byouin'],
      ['くすり（薬）', 'medicina', 'medicine', 'くすりをのんでください。', 'La medicina se "bebe": くすりをのむ.', 'Medicine is "drunk": くすりをのむ.', 'kusuri'],
      ['おだいじに', '¡Que te mejores!', 'Get well soon', 'かぜですか。おだいじに。', _, _, 'odaiji ni'],
    ],
    leisure: [
      ['しゅみ（趣味）', 'pasatiempo', 'hobby', 'しゅみはなんですか。', _, _, 'shumi'],
      ['〜がすきです', 'Me gusta ~', 'I like ~', 'アニメがすきです。', 'Lo que te gusta va con が, no con を.', 'What you like takes が, not を.', '~ ga suki desu'],
      ['あそびにいく', 'salir a divertirse', 'to go out and have fun', 'しゅうまつにあそびにいきましょう。', _, _, 'asobi ni iku'],
      ['スポーツをする', 'hacer deporte', 'to play sports', 'まいしゅうスポーツをします。', _, _, 'supootsu o suru'],
      ['ゲーム', 'videojuegos', 'video games', 'よるゲームをします。', _, _, 'geemu'],
    ],
    travel: [
      ['りょこう（旅行）', 'viaje', 'trip', 'きょうとへりょこうにいきたいです。', _, _, 'ryokou'],
      ['よやく（予約）', 'reserva', 'reservation', 'ホテルをよやくしました。', _, _, 'yoyaku'],
      ['にもつ（荷物）', 'equipaje', 'luggage', 'にもつがおもいです。', _, _, 'nimotsu'],
      ['きっぷ（切符）', 'boleto', 'ticket', 'おおさかまでのきっぷをください。', _, _, 'kippu'],
      ['かんこう（観光）', 'turismo', 'sightseeing', 'とうきょうでかんこうしました。', _, _, 'kankou'],
    ],
    work: [
      ['かいぎ（会議）', 'reunión', 'meeting', 'かいぎはじゅうじからです。', _, _, 'kaigi'],
      ['どうりょう（同僚）', 'compañero/a de trabajo', 'coworker', 'どうりょうとひるごはんをたべます。', _, _, 'douryou'],
      ['しめきり（締め切り）', 'fecha límite', 'deadline', 'しめきりはきんようびです。', _, _, 'shimekiri'],
      ['おつかれさまです', 'saludo entre compañeros ("gracias por tu esfuerzo")', 'greeting between coworkers ("thanks for your hard work")', 'おつかれさまです。おさきにしつれいします。', _, _, 'otsukaresama desu'],
      ['しごと（仕事）', 'trabajo', 'work / job', 'しごとはたのしいです。', _, _, 'shigoto'],
    ],
    feelings: [
      ['〜とおもいます', 'Creo que ~', 'I think that ~', 'いいアイデアだとおもいます。', _, _, '~ to omoimasu'],
      ['そうですね', 'Así es / Es verdad', "That's right / I see", 'そうですね、わたしもそうおもいます。', _, _, 'sou desu ne'],
      ['うれしい', 'feliz, contento', 'happy, glad', 'あえてうれしいです。', _, _, 'ureshii'],
      ['かなしい', 'triste', 'sad', 'そのニュースはかなしいです。', _, _, 'kanashii'],
      ['ばあいによります', 'Depende', 'It depends', 'それはばあいによります。', _, _, 'baai ni yorimasu'],
    ],
    discourse: [
      ['でも', 'pero', 'but', 'たかいです。でも、おいしいです。', _, _, 'demo'],
      ['しかし', 'sin embargo (formal)', 'however', 'けいかくはいいです。しかし、むずかしいです。', _, _, 'shikashi'],
      ['だから', 'por eso', 'so / therefore', 'あめです。だから、いえにいます。', _, _, 'dakara'],
      ['わたしのいけんでは', 'en mi opinión', 'in my opinion', 'わたしのいけんでは、かれはただしいです。', _, _, 'watashi no iken de wa'],
      ['たとえば', 'por ejemplo', 'for example', 'たとえば、すしやてんぷらがすきです。', _, _, 'tatoeba'],
    ],
  },
  [
    ['Tres escrituras', 'Three scripts', 'Hiragana para gramática y palabras nativas, katakana para palabras extranjeras y kanji para conceptos.', 'Hiragana for grammar, katakana for loanwords, kanji for concepts.'],
    ['は y が', 'は vs. が', 'は (wa) marca el tema: わたしはがくせいです. が presenta información nueva o lo que te gusta.', 'は (wa) marks the topic; が introduces new information or what you like.'],
    ['El verbo va al final', 'The verb goes last', 'Orden: sujeto – objeto – verbo. わたしはすしをたべます (yo sushi como).', 'Order: subject – object – verb: わたしはすしをたべます.'],
    ['Cortesía con です / ます', 'Politeness with です / ます', 'Usa です/ます con desconocidos y en clase; la forma simple es para amigos.', 'Use です/ます with strangers; the plain form is for friends.'],
    ['Se omite el sujeto', 'Drop the subject', 'Si se entiende por contexto, no digas わたしは cada vez: suena repetitivo.', 'If the context is clear, skip わたしは — repeating it sounds unnatural.'],
    ['Partícula を', 'The particle を', 'を (o) marca el objeto directo: みずをのみます (bebo agua).', 'を (o) marks the direct object: みずをのみます.'],
  ],
);
