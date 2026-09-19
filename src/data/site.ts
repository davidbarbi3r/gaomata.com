export const SITE = {
  name: 'Gao Mata',
  owner: 'Marion Aubreton',
  url: 'https://www.gaomata.com',
  email: 'gao.mata87@gmail.com',
  phoneDisplay: '06 09 05 00 01',
  phoneHref: 'tel:+33609050001',
  bookingProfile: 'https://www.aurarios.fr/professionnel/gao-mata',
  bookingOrigin: 'https://www.aurarios.fr',
  collectiveEmbed: 'https://www.aurarios.fr/embed/gao-mata',
  sophrologyEmbed: 'https://www.aurarios.fr/embed/gao-mata/prestations',
  areaServed: ['Boisseuil', 'Limoges', 'Haute-Vienne'],
} as const;

export const LOCATIONS = [
  {
    city: 'Boisseuil',
    name: 'Le Chat qui Médite',
    detail:
      'Cours collectifs, lundis et samedis après-midi pour la sophrologie.',
  },
  {
    city: 'Limoges',
    name: 'Cabinet d’Éloïse Krampt',
    detail:
      '11 rue Degas, vendredis et un samedi par mois pour la sophrologie.',
  },
] as const;

export const FLY_FORMATS = [
  {
    name: 'Fly Doux',
    text: 'Adapté aux personnes non initiées, désireuses d’apprendre une nouvelle discipline sans trop d’acrobaties. Cette pratique convient aussi aux yogis volants expérimentés qui veulent simplement profiter d’une séance plus en douceur.',
    marker: 'Découverte',
  },
  {
    name: 'Fly Yoga',
    text: 'Une séance plus dynamique, pour des explorations un peu plus poussées, avec une inspiration circassienne, toujours dans la joie et le partage.',
    marker: 'Dynamique',
  },
  {
    name: 'Fly & Zen',
    text: 'Mon atelier signature, développé il y a 4 ans. Je crois d’ailleurs qu’il fait partie de vos chouchous. Sophrologie et hamac très bas, aucun niveau requis, détente profonde assurée. Dès septembre 2026, il se décline aussi en Fly & Zen Pyjama, un vendredi soir par mois. Que du bonheur.',
    marker: 'Atelier signature',
  },
  {
    name: 'Fly & Flex',
    text: 'Mon deuxième atelier signature, très apprécié des explorateurs de la souplesse. On approfondit des postures complexes avec l’appui de différents supports, dont le hamac, pour développer des amplitudes ou simplement prendre des temps de pause.',
    marker: 'Souplesse',
  },
  {
    name: 'Fly Adulte-Enfant',
    text: 'Un temps de pratique en duo pour se créer des souvenirs hors du commun. Il suffit de pouvoir constituer un duo : un enfant de 4 à 10 ans, et un adulte ressource pour cet enfant.',
    marker: 'Duo',
  },
  {
    name: 'Fly Kids',
    text: 'Réservé à vos enfants dès 7 ans, et aux ados, pour explorer tout son potentiel à l’aide du hamac. Un merveilleux espace de création, d’apprentissage de la conscience du corps, et de régulation émotionnelle. Ludique, convivial, sans compétition.',
    marker: '7 ans et plus',
  },
] as const;

export const COLLECTIVE_PRICES = {
  fly: [
    { label: 'Cours d’essai', price: '12 €' },
    { label: 'Cours à l’unité', price: '20 €' },
    { label: 'Carte de 5 cours', price: '90 €' },
    { label: 'Carte de 10 cours', price: '180 €' },
    { label: 'Abonnement 1 cours / semaine', price: '59 € / mois' },
    { label: 'Abonnement 2 cours / semaine', price: '108 € / mois' },
    { label: 'Fly Kids, 1 h', price: '18 €' },
    { label: 'Fly Adulte-Enfant', price: '20 €' },
    { label: 'Fly & Zen', price: '27 €' },
  ],
  flexibility: [
    { label: 'Cours d’essai', price: '12 €' },
    { label: 'Cours à l’unité', price: '18 €' },
    { label: 'Carte de 5 cours', price: '80 €' },
    { label: 'Carte de 10 cours', price: '160 €' },
    {
      label: 'Cours particulier',
      price: '70 €',
      note: 'Au Chat qui Médite, espace et matériel inclus',
    },
    { label: 'Cours particulier en duo', price: '95 €' },
  ],
} as const;

export const SOPHROLOGY_PRICES = [
  {
    label: 'Première séance adulte',
    price: '75 €',
    note: 'Obligatoire, 1 h 30 et plus',
  },
  {
    label: 'Séance de suivi adulte',
    price: '70 €',
    note: '1 h 15 à 1 h 30',
  },
  {
    label: 'Première séance enfant, ado ou étudiant',
    price: '55 €',
    note: '1 h 15 à 1 h 30',
  },
  {
    label: 'Séance de suivi enfant',
    price: '50 €',
    note: '45 min à 1 h',
  },
] as const;

export const SOPHROLOGY_REASONS = [
  'Apaiser le stress et l’anxiété',
  'Mieux reconnaître et réguler les émotions',
  'Traverser une peur, une phobie ou une période de changement',
  'Préparer un examen, un accouchement ou un événement important',
  'Trouver des stratégies adaptées à un fonctionnement neuroatypique',
] as const;

export const TESTIMONIALS = [
  {
    quote:
      'Marion est solaire, très pédagogue. Elle m’a réconciliée avec le sport ; son accompagnement dans l’acceptation de soi est toujours bienveillant.',
    author: 'C., cours de souplesse',
  },
  {
    quote:
      'Beaucoup de douceur, de bienveillance et jamais de prise de tête. On se sent bien accompagné et ça fait vraiment toute la différence.',
    author: 'G., Fly Yoga',
  },
  {
    quote:
      'Je ne connaissais pas cette discipline. Marion sait nous mettre en confiance et en sécurité, et on progresse très vite.',
    author: 'J., Fly Yoga',
  },
  {
    quote:
      'Un moment privilégié dans ma semaine : j’y transpire, je m’y assouplis, je m’y relaxe. Avec le sourire et une extraordinaire bienveillance.',
    author: 'Une yogi volante',
  },
] as const;

export const PARTNERSHIPS = [
  {
    title: 'Climb Up Limoges',
    text: 'Quatre éditions de l’événement Les femmes assurent, entre découverte, cohésion et confiance.',
  },
  {
    title: 'Centre social de La Bastide',
    text: 'Pratiques adulte-enfant, bulles de douceur pour les parents et journées dédiées aux enfants.',
  },
  {
    title: 'Petite enfance',
    text: 'Éveil, jeu et équilibre en crèche, notamment avec les familles de La Ritournelle.',
  },
  {
    title: 'CDTPI à Isle',
    text: 'Découverte de la pratique aérienne avec les résidents et les équipes éducatives.',
  },
  {
    title: 'Événements & retraites',
    text: 'Anniversaires, EVJF, temps en famille et retraites introspectives co-créées en Limousin.',
  },
] as const;
