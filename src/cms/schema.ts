/**
 * Tous les textes éditables du site, organisés comme dans l'admin :
 * page → section → champ. Les valeurs écrites ici sont les textes d'origine.
 *
 * - Le build lit les textes modifiés dans D1 et retombe sur ces valeurs sinon.
 * - L'admin affiche ces pages / sections / champs dans le même ordre.
 *
 * Ajouter un texte visible sur le site = l'ajouter ici, puis le lire via
 * `getContent()` dans la page. Voir CLAUDE.md, section « Contenu éditable ».
 */
import {
  email,
  list,
  page,
  section,
  text,
  textarea,
  url,
  type PageValues,
} from './fields';

const imageAlt = (value: string) =>
  text('Description de la photo', value, {
    help: 'Lue par les lecteurs d’écran et par Google. Décris simplement ce que montre la photo.',
  });

const seo = (title: string, description: string) =>
  section(
    'Référencement (Google)',
    {
      title: text('Titre de l’onglet et de Google', title, {
        max: 70,
        help: '« | Gao Mata » est ajouté automatiquement si le nom n’y figure pas.',
      }),
      description: textarea('Description dans Google', description, {
        max: 165,
        help: 'Le petit texte affiché sous le titre dans les résultats Google.',
      }),
    },
    'Invisible sur la page, mais affiché dans Google et lors des partages.',
  );

const faqItems = (items: { question: string; answer: string }[]) =>
  list(
    'Questions',
    {
      itemLabel: 'une question',
      itemTitle: 'question',
      fields: {
        question: text('Question', ''),
        answer: textarea('Réponse', ''),
      },
    },
    items,
  );

const tagItems = (label: string, itemLabel: string, values: string[]) =>
  list(
    label,
    {
      itemLabel,
      itemTitle: 'text',
      fields: { text: text('Texte', '') },
    },
    values.map((value) => ({ text: value })),
  );

export const CONTENT_SCHEMA = {
  commun: page(
    'Éléments communs',
    null,
    {
      contact: section('Coordonnées', {
        email: email('Adresse email', 'gao.mata87@gmail.com'),
        phone: text('Téléphone', '06 09 05 00 01', {
          help: 'Format conseillé : 06 00 00 00 00.',
        }),
        bookingProfile: url(
          'Lien du profil Aurarios',
          'https://www.aurarios.fr/professionnel/gao-mata',
        ),
      }),
      header: section(
        'En-tête',
        {
          tagline: text(
            'Phrase sous le nom',
            'Exploration · Mouvement · Psychoéducation',
            { max: 60 },
          ),
          navFly: text('Menu : lien Fly', 'Fly & Souplesse'),
          navSophro: text('Menu : lien Sophrologie', 'Sophrologie'),
          navAbout: text('Menu : lien À propos', 'À propos'),
          cta: text('Bouton du menu', 'Réserver'),
          mobileCta: text('Bouton du menu mobile', 'Réserver une séance'),
          mobileMeta: text('Lieux dans le menu mobile', 'Boisseuil · Limoges'),
        },
        'Le bandeau en haut de toutes les pages.',
      ),
      footer: section(
        'Pied de page',
        {
          ctaEyebrow: text('Petit titre de l’appel', 'Faire le premier pas'),
          ctaTitle: text('Titre de l’appel', 'Et si tu venais explorer ?'),
          ctaButton: text('Bouton de l’appel', 'Choisir ma séance'),
          tagline: textarea(
            'Phrase sous le logo',
            'Une pédagogie peu conventionnelle, au service de l’atypique.',
          ),
          exploreTitle: text('Titre de la colonne liens', 'Explorer'),
          linkFly: text('Lien Fly', 'Fly Yoga & Souplesse'),
          linkSophro: text('Lien Sophrologie', 'Sophrologie'),
          linkAbout: text('Lien À propos', 'Qui je suis'),
          linkBooking: text('Lien Réserver', 'Réserver'),
          visitTitle: text('Titre de la colonne contact', 'Venir'),
          visitPlaces: tagItems('Villes affichées', 'une ville', [
            'Boisseuil',
            'Limoges',
          ]),
          bottomTagline: text(
            'Phrase tout en bas',
            'Yoga aérien · Souplesse · Sophrologie',
          ),
          legalLink: text(
            'Lien mentions légales',
            'Mentions légales & confidentialité',
          ),
          adminLink: text('Lien vers l’espace admin', 'Espace admin', {
            help: 'Petit lien discret tout en bas, pour se connecter à l’admin.',
          }),
        },
        'Le bas de toutes les pages.',
      ),
      lieux: section(
        'Lieux',
        {
          items: list(
            'Lieux de pratique',
            {
              itemLabel: 'un lieu',
              itemTitle: 'name',
              fields: {
                city: text('Ville', ''),
                name: text('Nom du lieu', ''),
                detail: textarea('Détails (adresse, jours…)', ''),
              },
              min: 1,
            },
            [
              {
                city: 'Boisseuil',
                name: 'Le Chat qui Médite',
                detail:
                  'Cours collectifs, lundis et samedis après-midi pour la sophrologie.',
              },
              {
                city: 'Limoges',
                name: 'Cabinet d’Éloïse Kramp',
                detail:
                  '11 rue Degas, vendredis et un samedi par mois pour la sophrologie.',
              },
            ],
          ),
        },
        'Affichés sur la page d’accueil et sur la page Sophrologie.',
      ),
    },
    'Ce qui apparaît sur toutes les pages : en-tête, pied de page, coordonnées, lieux.',
  ),

  accueil: page('Accueil', '/', {
    seo: seo(
      'Fly Yoga, souplesse et sophrologie à Limoges',
      'Je t’accompagne à Boisseuil et Limoges par le Fly Yoga, la souplesse et la sophrologie. Thérapeute et pédagogue, au service de l’atypique.',
    ),
    hero: section('Haut de page', {
      eyebrow: text('Petit titre', 'Thérapeute et pédagogue'),
      title: textarea('Grand titre', 'Au service\nde l’atypique.', {
        help: 'Un retour à la ligne ici = un retour à la ligne sur le site.',
      }),
      intro: textarea(
        'Introduction',
        'Moi, c’est Marion. Je t’accompagne à Boisseuil et Limoges par le Fly Yoga, la souplesse et la sophrologie.',
      ),
      ctaLabel: text('Bouton principal', 'Trouver ma séance'),
      secondaryLabel: text('Lien secondaire', 'Me rencontrer'),
      imageAlt: imageAlt(
        'Exploration de la souplesse sur une plage au coucher du soleil',
      ),
    }),
    choix: section('Les deux activités', {
      eyebrow: text('Petit titre', 'Choisir son élan'),
      title: text(
        'Titre',
        'Deux portes d’entrée, une même attention à qui tu es.',
      ),
      intro: textarea(
        'Introduction',
        'Pour t’accompagner, tu l’auras compris, j’ai plusieurs cordes à mon arc. Tu choisis l’élan qui te ressemble aujourd’hui.',
      ),
      flyLabel: text('Encart orange : étiquette', 'Fly Yoga · Souplesse'),
      flyTitle: text('Encart orange : titre', 'Investir l’espace du corps'),
      flyText: textarea(
        'Encart orange : texte',
        'Fly Yoga, ateliers signature, pratique dédiée aux enfants et exploration de la souplesse : des cours en petit groupe, dans la joie et le partage, sans compétition.',
      ),
      sophroLabel: text('Encart vert : étiquette', 'Sophrologie · Neuroatypie'),
      sophroTitle: text(
        'Encart vert : titre',
        'Réguler la sphère émotionnelle',
      ),
      sophroText: textarea(
        'Encart vert : texte',
        'Un accompagnement individuel pour mieux traverser le stress, les émotions et les périodes de changement, avec une attention particulière aux profils neuroatypiques.',
      ),
    }),
    ateliers: section(
      'Prochains ateliers',
      {
        eyebrow: text('Petit titre', 'Prochains ateliers'),
        title: text('Titre', 'Les rendez-vous à ne pas manquer.'),
        intro: textarea(
          'Introduction',
          'Des ateliers ponctuels pour explorer autrement, seul·e, en duo ou en famille.',
          { optional: true },
        ),
        cardCta: text('Lien sur chaque atelier', 'Découvrir l’atelier'),
      },
      'Ce bloc n’apparaît que s’il y a au moins un atelier publié à venir.',
    ),
    methode: section('La méthode', {
      eyebrow: text('Petit titre', 'La méthode Gao Mata'),
      title: text('Titre', 'Une approche psychocorporelle et écologique.'),
      text: textarea(
        'Texte',
        'Ma boîte à outils, au service de la révélation de ton potentiel. Le hamac, le mouvement, la respiration et l’imaginaire deviennent des outils concrets, et la pratique s’adapte à toi, pas l’inverse.',
      ),
      points: tagItems('Points numérotés', 'un point', [
        'Le Fly, et toutes ses déclinaisons',
        'La souplesse, active et passive',
        'La sophrologie, au fil de l’élan du jour',
      ]),
      buttonLabel: text('Bouton', 'Découvrir l’approche'),
      imageAlt: imageAlt(
        'Marion accompagne une élève pendant un travail de souplesse',
      ),
      caption: text('Légende sur la photo', 'Respecter · Ajuster · Encourager'),
    }),
    temoignages: section('Avis', {
      eyebrow: text('Petit titre', 'Vos mots'),
      title: text('Titre', 'Ce sont elles et eux qui en parlent le mieux.'),
      items: list(
        'Avis',
        {
          itemLabel: 'un avis',
          itemTitle: 'author',
          fields: {
            quote: textarea('Citation', '', {
              help: 'Sans guillemets, ils sont ajoutés automatiquement.',
            }),
            author: text('Auteur', ''),
          },
          min: 1,
        },
        [
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
            author: 'Une yogini volante',
          },
        ],
      ),
    }),
    lieux: section(
      'Lieux',
      {
        eyebrow: text('Petit titre', 'En Haute-Vienne'),
        title: text(
          'Titre',
          'Deux espaces pour t’accueillir dès septembre 2026.',
        ),
      },
      'La liste des lieux se modifie dans « Éléments communs ».',
    ),
  }),

  fly: page('Fly & Souplesse', '/fly-yoga-souplesse', {
    seo: seo(
      'Fly Yoga et cours de souplesse à Boisseuil',
      'Mes cours de Fly Yoga, Fly & Zen, Fly Kids et souplesse à Boisseuil, près de Limoges. Aucun prérequis, pas de niveaux.',
    ),
    hero: section('Haut de page', {
      eyebrow: text('Petit titre', 'Ma boîte à outils'),
      title: text('Grand titre', 'Le corps comme terrain de jeu.'),
      intro: textarea(
        'Introduction',
        'Je t’accompagne du sol au hamac. On commence toujours par bouger sans le tissu, pour réveiller, parfois renforcer le corps, avant de t’envoler progressivement.',
      ),
      ctaLabel: text('Bouton', 'Réserver un cours'),
      imageAlt: imageAlt('Pratique de Fly Yoga dans un hamac aérien'),
    }),
    pratique: section('La pratique aérienne', {
      eyebrow: text('Petit titre', 'La pratique aérienne'),
      title: text('Titre', 'Le Fly, bien plus qu’un yoga dans les airs.'),
      text: textarea(
        'Texte',
        'Ma pratique est peu conventionnelle. Elle s’inspire du yoga, bien sûr, mais aussi du cirque, du pilates, avec parfois quelques touches de sophrologie selon l’inspiration du jour.',
      ),
      detailLabel: text('Encadré : titre', 'Avant de s’envoler'),
      detailText: textarea(
        'Encadré : texte',
        'Tu prendras toujours le temps de bouger d’abord sans le hamac, pour réveiller, parfois renforcer le corps, avant de t’envoler progressivement.',
      ),
    }),
    formules: section('Les pratiques', {
      eyebrow: text('Petit titre', 'Six façons d’explorer'),
      title: text('Titre', 'Je décline cette activité en plusieurs pratiques.'),
      items: list(
        'Pratiques',
        {
          itemLabel: 'une pratique',
          itemTitle: 'name',
          fields: {
            name: text('Nom', ''),
            marker: text('Étiquette', '', {
              help: 'Le petit badge en haut de la carte (ex. « Duo »).',
            }),
            text: textarea('Description', '', {
              help: 'Laisse une ligne vide pour créer un nouveau paragraphe.',
            }),
          },
          min: 1,
        },
        [
          {
            name: 'Hamac et Sophro',
            marker: 'Découverte',
            text: 'Un espace adapté aux personnes non initiées, désireuses d’explorer de nouvelles sensations en douceur au profit d’un relâchement en profondeur. Cette pratique convient aussi aux yogis volants expérimentés qui veulent simplement se poser et profiter d’une séance plus en douceur.',
          },
          {
            name: 'Fly Yoga',
            marker: 'Dynamique',
            text: 'Une séance plus dynamique, construite comme une montagne, avec un démarrage en douceur qui mène à un pic plus intense dans les airs pour finalement redescendre et se poser tranquillement. Cet espace est conçu pour des explorations un peu plus poussées, avec une inspiration circassienne, toujours dans la joie et le partage.',
          },
          {
            name: 'Fly & Zen',
            marker: 'Atelier signature',
            text: 'Mon incontournable atelier signature, développé il y a 4 ans, il fait partie de vos chouchous ! Sophrologie et hamac très proche du sol, voici un atelier conçu comme un véritable espace thérapeutique, pour une exploration profonde de son intériorité. Dès septembre 2026, il se décline en Pyjama, un vendredi soir par mois, ou en version dominicale un week-end par mois.',
          },
          {
            name: 'Fly & Flex',
            marker: 'Souplesse',
            text: 'Mon deuxième atelier signature, très apprécié des explorateurs de la souplesse. On approfondit des postures complexes avec l’appui de différents supports, dont le hamac, pour développer de belles amplitudes.',
          },
          {
            name: 'Fly Adulte-Enfant',
            marker: 'Duo',
            text: 'Un temps de pratique en duo pour se créer des souvenirs hors du commun.\n\nLa recette secrète de cet atelier : composer un duo avec un enfant de 4 à 10 ans et un adulte, puis se munir d’une bonne dose de joie et de curiosité pour réaliser un cocktail pétillant.\n\nVous êtes prêts ? À vous de jouer !',
          },
          {
            name: 'Fly Kids',
            marker: '7 ans et plus',
            text: 'Réservé à vos enfants dès 7 ans, et aux ados, pour explorer tout leur potentiel à l’aide du hamac. Un merveilleux espace de création, d’apprentissage de la conscience du corps, et de régulation émotionnelle. Ludique, convivial, sans compétition.',
          },
        ],
      ),
    }),
    souplesse: section('La souplesse', {
      eyebrow: text('Petit titre', 'Explorer ses amplitudes'),
      title: text('Titre', 'La souplesse, sans se plier aux normes.'),
      text: textarea(
        'Texte',
        'La méthode que j’utilise allie souplesse active et passive, pour un travail minutieux dédié à la connaissance de soi, au respect de tes sensations, à l’exploration des amplitudes. Bien que ce travail se déroule très souvent dans un climat de joie et de camaraderie, l’exploration n’en est souvent pas moins intense.',
      ),
      tags: tagItems('Étiquettes', 'une étiquette', [
        'Aucun niveau requis',
        'Chers amis hypermobiles, bienvenus',
        'Méthode Sophie Lanka',
      ]),
      imageAlt: imageAlt(
        'Travail accompagné de souplesse dans un studio lumineux',
      ),
      imageCaption: text('Légende sur la photo', 'Souplesse active + passive'),
    }),
    cadre: section('Le cadre', {
      eyebrow: text('Petit titre', 'Le cadre'),
      title: text('Titre', 'Pas de prérequis. Pas de niveaux.'),
      text: textarea(
        'Texte',
        'Tous les corps sont les bienvenus ! Chacun travaille et développe selon son potentiel corporel. Et chers amis hypermobiles, je comprends vos corps : on travaille dans le respect de vos articulations. Les cours collectifs Fly accueillent huit personnes maximum.',
      ),
      buttonLabel: text('Bouton', 'Voir les cours'),
      imageAlt: imageAlt(
        'Une jeune participante explore le hamac pendant un cours Fly Kids',
      ),
      badgeNumber: text('Pastille : chiffre', '8', { max: 4 }),
      badgeText: text('Pastille : texte', 'personnes maximum en cours Fly'),
    }),
    tarifs: section('Tarifs', {
      eyebrow: text('Petit titre', 'Des formules souples'),
      title: text('Titre', 'Les tarifs'),
      collectiveTitle: text(
        'Carte 1 : titre',
        'Fly & Souplesse, les cours collectifs',
      ),
      collectiveNote: text(
        'Carte 1 : sous-titre',
        'Sur réservation · 8 personnes maximum',
        { optional: true },
      ),
      collectiveColumn1: text('Carte 1 : nom de la 1re colonne de prix', 'Fly'),
      collectiveColumn2: text(
        'Carte 1 : nom de la 2e colonne de prix',
        'Souplesse',
      ),
      collectiveItems: list(
        'Carte 1 : tarifs',
        {
          itemLabel: 'un tarif',
          itemTitle: 'label',
          help: 'Remplis les deux prix pour un tarif différent Fly / Souplesse, ou seulement le premier pour un prix unique.',
          fields: {
            label: text('Intitulé', ''),
            price: text('Prix (Fly, ou prix unique)', ''),
            price2: text('Prix Souplesse', '', {
              optional: true,
              help: 'Laisser vide si le prix est le même pour tout.',
            }),
            note: text('Précision', '', { optional: true }),
          },
        },
        [
          { label: 'Cours d’essai', price: '12 €', price2: '', note: '' },
          {
            label: 'Cours à l’unité',
            price: '20 €',
            price2: '18 €',
            note: '',
          },
          {
            label: 'Carte de 5 cours',
            price: '95 €',
            price2: '85 €',
            note: '',
          },
          {
            label: 'Carte de 10 cours',
            price: '180 €',
            price2: '160 €',
            note: '',
          },
          {
            label: 'Abonnement 1 cours / semaine',
            price: '59 €',
            price2: '53 €',
            note: 'Par mois',
          },
          {
            label: 'Abonnement Mix Fly + Souplesse',
            price: '89 € / mois',
            price2: '',
            note: '2 cours / semaine',
          },
        ],
      ),
      workshopsTitle: text('Carte 2 : titre', 'Ateliers et cours particuliers'),
      workshopsNote: text(
        'Carte 2 : sous-titre',
        'Ateliers à thème ou accompagnement personnalisé',
        { optional: true },
      ),
      workshopsItems: list(
        'Carte 2 : tarifs',
        {
          itemLabel: 'un tarif',
          itemTitle: 'label',
          fields: {
            label: text('Intitulé', ''),
            price: text('Prix', ''),
            note: text('Précision', '', { optional: true }),
          },
        },
        [
          { label: 'Fly Kids, 1 h', price: '18 €', note: '' },
          { label: 'Fly Adulte-Enfant', price: '20 €', note: '' },
          { label: 'Stage Kids Vacances, 1 h 30', price: '25 €', note: '' },
          { label: 'Fly & Zen', price: '27 €', note: '' },
          {
            label: 'Cours particulier',
            price: '70 €',
            note: 'Au Chat qui Médite, espace et matériel inclus',
          },
          { label: 'Cours particulier en duo', price: '95 €', note: '' },
          {
            label: 'Séances collectives privées',
            price: 'Sur devis',
            note: '',
          },
        ],
      ),
    }),
    planning: section('Planning de réservation', {
      title: text('Titre', 'Le planning des cours'),
      description: textarea(
        'Texte',
        'Choisis directement ton cours de Fly Yoga, de souplesse ou ton prochain atelier.',
      ),
    }),
    faq: section('Questions fréquentes', {
      eyebrow: text('Petit titre', 'Avant de venir'),
      title: text('Titre', 'Les questions les plus fréquentes.'),
      items: faqItems([
        {
          question: 'Faut-il déjà pratiquer le yoga ou être souple ?',
          answer:
            'Non. Il n’y a pas de prérequis sur les cours que je dispense, pas de niveaux. Hamac et Sophro est particulièrement indiqué si tu veux explorer de nouvelles sensations en douceur.',
        },
        {
          question: 'Combien de personnes participent aux cours de Fly ?',
          answer:
            'Huit personnes maximum. Comme ça je peux vraiment ajuster, proposer, et te laisser explorer sans compétition.',
        },
        {
          question: 'Les personnes hypermobiles peuvent-elles participer ?',
          answer:
            'Oui. Chers amis hypermobiles, je comprends vos corps : on travaille dans le respect de vos articulations.',
        },
        {
          question: 'À partir de quel âge les enfants peuvent-ils pratiquer ?',
          answer:
            'Fly Kids accueille les enfants dès 7 ans, et les ados. Fly Adulte-Enfant, c’est un duo : un enfant de 4 à 10 ans, et un adulte ressource pour cet enfant.',
        },
      ]),
    }),
  }),

  sophro: page('Sophrologie', '/sophrologie-neuroatypie', {
    seo: seo(
      'Sophrologue à Limoges et Boisseuil',
      'Je t’accompagne en sophrologie à Boisseuil et Limoges : stress, émotions, neuroatypie. Adultes, enfants, sans jugement.',
    ),
    hero: section('Haut de page', {
      eyebrow: text('Petit titre', 'Retrouver un équilibre vivant'),
      title: text(
        'Grand titre',
        'Un espace pour souffler, comprendre et avancer.',
      ),
      intro: textarea(
        'Introduction',
        'Je t’accompagne en sophrologie avec des outils concrets. Corps, mental, émotions : une approche douce, pédagogique, et sans jugement.',
      ),
      ctaLabel: text('Bouton', 'Prendre rendez-vous'),
      imageAlt: imageAlt(
        'Marion dans un environnement naturel calme au bord de l’eau',
      ),
    }),
    definition: section('Comprendre la sophrologie', {
      eyebrow: text('Petit titre', 'Comprendre'),
      title: text('Titre', 'La science de l’esprit harmonieux.'),
      text: textarea(
        'Texte',
        'Développée par le psychiatre Alfonso Caycedo, la sophrologie s’inspire notamment du yoga, du zen et de l’hypnose. Avec mon soutien, elle devient un espace pour exprimer, bouger, respirer, visualiser, et finalement, mieux te connaître.',
      ),
      quote: textarea(
        'Citation',
        'Prendre conscience de sa capacité à traverser, à s’ajuster pour cheminer avec une plus grande sérénité.',
        { help: 'Sans guillemets, ils sont ajoutés automatiquement.' },
      ),
    }),
    raisons: section('Quand la sophrologie peut t’aider', {
      eyebrow: text('Petit titre', 'Pour quoi venir ?'),
      title: text('Titre', 'Quand la sophrologie peut t’aider.'),
      items: tagItems('Raisons', 'une raison', [
        'Mieux reconnaître et réguler les émotions',
        'Trouver des stratégies adaptées à un fonctionnement neuroatypique',
        'Apaiser le stress et l’anxiété',
        'Traverser une peur, une phobie ou une période de changement',
        'Préparer un examen, un accouchement ou un événement important',
      ]),
    }),
    deroule: section('Le déroulé d’une séance', {
      eyebrow: text('Petit titre', 'Le déroulé'),
      title: text('Titre', 'Une séance construite autour du besoin du jour.'),
      text: textarea(
        'Texte',
        'Chaque rencontre commence et se termine par un échange. On associe relaxation dynamique (mouvement et respiration) et exercices de suggestion mentale. Je pars de toi, pas d’un protocole figé.',
      ),
      steps: list(
        'Étapes',
        {
          itemLabel: 'une étape',
          itemTitle: 'title',
          fields: {
            title: text('Titre', ''),
            text: textarea('Texte', ''),
          },
        },
        [
          {
            title: 'Échanger',
            text: 'Poser le besoin, les ressentis et ce qui est possible aujourd’hui.',
          },
          {
            title: 'Expérimenter',
            text: 'Mouvement, respiration et visualisation s’ajustent à la séance.',
          },
          {
            title: 'Intégrer',
            text: 'Mettre des mots et repartir avec des outils réutilisables au quotidien.',
          },
        ],
      ),
      imageAlt: imageAlt('Marion Aubreton, praticienne en sophrologie'),
      imageLabel: text('Légende sur la photo', 'Écouter avant de proposer'),
    }),
    neuro: section('Neuroatypie', {
      eyebrow: text('Petit titre', 'TND · TDAH · TSA · DYS · HPI'),
      title: text(
        'Titre',
        'Une attention particulière aux profils neuroatypiques.',
      ),
      text: textarea(
        'Texte',
        'TDAH, TSA, troubles DYS, HPI : diagnostiqué ou non, enfant ou adulte. En 2026, j’oriente aussi cette aventure vers une spécialisation en troubles du neurodéveloppement.',
      ),
      boundary: textarea(
        'Encadré « limites »',
        'La sophrologie ne pose pas de diagnostic et ne remplace pas un suivi médical ou paramédical. J’interviens en complément, dans une position pleinement pédagogique.',
      ),
      tags: tagItems('Mots-clés', 'un mot-clé', [
        'Décoder',
        'Réguler',
        'Adapter',
        'Soutenir',
      ]),
    }),
    tarifs: section('Tarifs', {
      eyebrow: text('Petit titre', 'Accompagnement individuel'),
      title: text('Titre', 'Tarifs des accompagnements'),
      text: textarea(
        'Texte',
        'Certaines complémentaires santé prennent en charge la sophrologie. Le plus simple, c’est de leur en faire la demande.',
      ),
      listTitle: text('Carte : titre', 'Séances de sophrologie'),
      listNote: text(
        'Carte : sous-titre',
        'Premier rendez-vous uniquement par email',
        {
          optional: true,
        },
      ),
      items: list(
        'Carte : tarifs',
        {
          itemLabel: 'un tarif',
          itemTitle: 'label',
          fields: {
            label: text('Intitulé', ''),
            price: text('Prix', ''),
            note: text('Précision (durée…)', '', { optional: true }),
          },
        },
        [
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
        ],
      ),
    }),
    prestations: section('Module de réservation', {
      title: text('Titre', 'Choisir une prestation'),
      description: textarea(
        'Texte',
        'Retrouve les accompagnements en sophrologie et les créneaux proposés sur Aurarios.',
      ),
    }),
    rendezVous: section(
      'Où se rencontrer',
      {
        eyebrow: text('Petit titre', 'Où se rencontrer ?'),
        title: text('Titre', 'Deux lieux, le même cadre attentif.'),
        ctaText: textarea(
          'Encadré : texte',
          'Pour une première séance, échangeons d’abord par email.',
        ),
        ctaButton: text('Encadré : bouton', 'M’écrire'),
      },
      'La liste des lieux se modifie dans « Éléments communs ».',
    ),
    faq: section('Questions fréquentes', {
      eyebrow: text('Petit titre', 'Questions fréquentes'),
      title: text('Titre', 'Avant une première séance.'),
      items: faqItems([
        {
          question: 'La sophrologie remplace-t-elle un suivi médical ?',
          answer:
            'Non. J’accompagne en complément des sphères médicales et paramédicales, et je ne me substitue jamais à un diagnostic ou à un traitement.',
        },
        {
          question: 'Comment prendre un premier rendez-vous ?',
          answer:
            'Le premier rendez-vous se demande par email, pour qu’on précise ensemble ta demande. Les suivis peuvent ensuite se réserver via Aurarios.',
        },
        {
          question: 'Les enfants et adolescents peuvent-ils être accompagnés ?',
          answer:
            'Oui. J’accompagne les enfants, les adolescents et les étudiants, avec des formats et des tarifs adaptés.',
        },
        {
          question: 'Les séances peuvent-elles être remboursées ?',
          answer:
            'Certaines complémentaires santé prennent en charge la sophrologie. Le plus simple, c’est de les contacter directement.',
        },
      ]),
    }),
  }),

  aPropos: page('À propos', '/a-propos', {
    seo: seo(
      'Marion Aubreton, dite Gao Mata',
      'Moi, c’est Marion. Pédagogue peu conventionnelle, au service de l’atypique. Fly Yoga, souplesse et sophrologie à Boisseuil et Limoges.',
    ),
    hero: section('Haut de page', {
      eyebrow: text('Petit titre', 'Moi, c’est Marion Aubreton, dite Gao Mata'),
      title: text(
        'Grand titre',
        'Pédagogue peu conventionnelle, au service de l’atypique.',
      ),
      intro: textarea(
        'Introduction',
        'Je t’embarque avec moi. Peut-être as-tu déjà croisé ma route au détour d’une virée aérienne, d’un moment d’exploration corporelle, ou par le biais de la sophrologie ? Ou attends-tu simplement le bon moment, l’élan, pour venir à ma rencontre ? Alors tu es au bon endroit.',
      ),
      ctaLabel: text('Bouton', 'Découvrir une séance'),
      imageAlt: imageAlt('Marion Aubreton sourit devant un mur bleu intense'),
    }),
    histoire: section('Le point de départ', {
      year: text('Année en grand', '2013', { max: 6 }),
      eyebrow: text('Petit titre', 'Le point de départ'),
      title: text(
        'Titre',
        'Être au service de l’autre, c’est ce que je fais le mieux.',
      ),
      text: textarea(
        'Texte principal',
        'Je suis, tout d’abord, diplômée d’État en qualité de conseillère en économie sociale familiale depuis 2013. Après avoir exercé une dizaine d’années (oui, j’ai commencé avant d’être diplômée) au service de la protection des majeurs, de la protection de l’enfance ou encore de l’accompagnement de familles aux profils variés, j’ai fait le choix de stopper mon activité, en état de burn-out.',
      ),
      extra: textarea(
        'Texte complémentaire',
        'Je n’ai toutefois jamais pu me résoudre à abandonner ce que j’aime le plus, et ce que je pense faire le mieux aussi : être au service de l’autre, œuvrer pour que chaque être humain puisse s’accomplir dans l’expression de sa singularité.',
      ),
    }),
    parcours: section('Le parcours', {
      steps: list(
        'Étapes',
        {
          itemLabel: 'une étape',
          itemTitle: 'year',
          fields: {
            year: text('Année', '', { max: 6 }),
            title: text('Titre', ''),
            text: textarea('Texte', ''),
          },
          min: 1,
        },
        [
          {
            year: '2021',
            title: 'Croire à mes rêves d’enfant.',
            text: 'C’est ainsi que j’ai décidé de croire en mes rêves d’enfant, en me formant à une méthode de yoga aérien en 2021, le Fly Yoga, et, dans le même temps, de me certifier en sophrologie. Dans cet élan de construction d’une activité vraiment sur mesure, je me suis aussi formée à la méthode Sophie Lanka, en souplesse, dès 2023. Voilà donc déjà quatre ans que j’ai le bonheur d’accompagner de nombreuses âmes singulières, en séances collectives et individuelles, au sein de plusieurs établissements limougeauds.',
          },
          {
            year: '2026',
            title: '2026 marque un nouvel élan.',
            text: 'Un nouvel élan dans cette aventure au service du vivant : une activité qui se délocalise majoritairement sur la commune de Boisseuil, des cours collectifs qui se poursuivent dans cet écrin de verdure, et aussi une évolution en thérapie via la sophrologie, avec une spécialisation en troubles du neurodéveloppement.',
          },
        ],
      ),
      imageAlt: imageAlt(
        'Marion et Edwige marchent ensemble dans un lieu de retraite',
      ),
      imageCaption: text('Légende sur la photo', 'L’humain comme fil rouge'),
    }),
    manifeste: section('Le manifeste (bandeau citation)', {
      quote: textarea(
        'Citation',
        'Transmettre un maximum d’outils pour une meilleure connaissance de soi.',
        { help: 'Sans guillemets, ils sont ajoutés automatiquement.' },
      ),
      wish: textarea(
        'Texte',
        'Mon souhait reste le même : transmettre un maximum d’outils, pour une meilleure connaissance de soi, via une pédagogie qui s’est forgée au fil de toutes ces années, enrichie des centaines de visages et de corps rencontrés, et qui n’a pas peur de sortir des conventions.',
      ),
      signature: text('Signature', 'Marion · Gao Mata'),
    }),
    partenariats: section('Partenariats & événements', {
      eyebrow: text('Petit titre', 'Partenariats & événements'),
      title: text('Titre', 'Créer des expériences là où la vie se passe.'),
      items: list(
        'Partenariats',
        {
          itemLabel: 'un partenariat',
          itemTitle: 'title',
          fields: {
            title: text('Nom', ''),
            text: textarea('Description', ''),
          },
        },
        [
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
        ],
      ),
      imageAlt1: imageAlt(
        'Atelier collectif de yoga aérien lors d’un événement',
      ),
      imageAlt2: imageAlt('Moment de partage lors d’un événement Gao Mata'),
    }),
    evenements: section('Inventer un moment ensemble', {
      eyebrow: text('Petit titre', 'Inventer un moment ensemble'),
      title: text(
        'Titre',
        'Anniversaire, EVJF, retraite ou projet de structure ?',
      ),
      text: textarea(
        'Texte',
        'Je déplace mes hamacs, mes outils et mon grain de folie pour imaginer des formats sur mesure avec les groupes, les familles et les professionnels.',
      ),
      buttonLabel: text('Bouton', 'Parler de mon projet'),
    }),
  }),

  reserver: page('Réserver', '/reserver', {
    seo: seo(
      'Réserver une séance avec Gao Mata',
      'Réserve un cours collectif de Fly Yoga ou souplesse, ou un rendez-vous de sophrologie avec moi à Boisseuil et Limoges.',
    ),
    hero: section('Haut de page', {
      eyebrow: text('Petit titre', 'Choisir son prochain pas'),
      title: text('Grand titre', 'Ton espace est prêt.'),
      intro: textarea(
        'Introduction',
        'Cours collectif, atelier signature ou accompagnement individuel : sélectionne ce qui t’amène, et retrouve les disponibilités sur Aurarios.',
      ),
    }),
    choix: section('Les deux boutons de réservation', {
      collectiveTitle: text('Bouton 1 : titre', 'Cours collectifs'),
      collectiveText: text(
        'Bouton 1 : détail',
        'Fly Yoga · Souplesse · Ateliers',
      ),
      sophroTitle: text('Bouton 2 : titre', 'Sophrologie'),
      sophroText: text('Bouton 2 : détail', 'Adultes · Enfants · Neuroatypie'),
    }),
    premiere: section('Première séance de sophrologie', {
      eyebrow: text('Petit titre', 'Sophrologie'),
      title: text('Titre', 'Pour une première séance de sophrologie'),
      text: textarea(
        'Texte',
        'Le premier rendez-vous se prépare ensemble. Écris-moi pour préciser ta demande avant de choisir un créneau.',
      ),
      buttonLabel: text('Bouton', 'M’écrire'),
    }),
    aide: section('Besoin d’aide', {
      eyebrow: text('Petit titre', 'Besoin d’être guidé·e ?'),
      title: text('Titre', 'Un doute avant de réserver ?'),
      emailLabel: text('Carte email : intitulé', 'Email'),
      phoneLabel: text('Carte téléphone : intitulé', 'Téléphone'),
      bookingLabel: text('Carte Aurarios : intitulé', 'Réservation externe'),
      bookingName: text('Carte Aurarios : texte', 'Profil Aurarios'),
    }),
  }),

  ateliers: page(
    'Pages des ateliers',
    null,
    {
      page: section('Infos et boutons', {
        eyebrow: text('Petit titre avant la date', 'Atelier'),
        infosTitle: text('Titre de l’encadré pratique', 'Infos pratiques'),
        dateLabel: text('Intitulé « date »', 'Date'),
        timeLabel: text('Intitulé « horaires »', 'Horaires'),
        placeLabel: text('Intitulé « lieu »', 'Lieu'),
        priceLabel: text('Intitulé « tarif »', 'Tarif'),
        programTitle: text('Titre du programme', 'Programme'),
        bookingLabel: text(
          'Bouton de réservation par défaut',
          'Réserver ma place',
          {
            help: 'Utilisé quand le texte du bouton n’est pas précisé dans l’atelier.',
          },
        ),
        emailBookingLabel: text(
          'Bouton quand il n’y a pas de lien de réservation',
          'Réserver par email',
        ),
        pastNotice: text(
          'Bandeau d’un atelier passé',
          'Cet atelier est passé.',
        ),
        pastLink: text(
          'Lien du bandeau d’un atelier passé',
          'Voir les prochains rendez-vous',
        ),
      }),
      contact: section('Bloc « Une question ? »', {
        eyebrow: text('Petit titre', 'Une question ?'),
        title: text('Titre', 'Écris-moi avant de réserver.'),
        text: textarea(
          'Texte',
          'Je te réponds avec plaisir pour t’aider à savoir si cet atelier est fait pour toi.',
        ),
        buttonLabel: text('Bouton', 'M’écrire'),
        backLabel: text('Lien de retour', 'Retour à l’accueil'),
      }),
    },
    'Textes communs à toutes les pages d’atelier. Le contenu de chaque atelier se modifie dans « Ateliers ».',
  ),

  mentions: page('Mentions légales', '/mentions-legales', {
    seo: seo(
      'Mentions légales et confidentialité',
      'Informations légales, confidentialité et conditions d’utilisation du site Gao Mata.',
    ),
    hero: section('Haut de page', {
      eyebrow: text('Petit titre', 'Transparence'),
      title: text('Grand titre', 'Mentions légales & confidentialité.'),
      intro: textarea(
        'Introduction',
        'Les informations essentielles sur l’édition du site, l’utilisation de tes données et les limites de l’accompagnement.',
      ),
    }),
    articles: section('Contenu', {
      items: list(
        'Rubriques',
        {
          itemLabel: 'une rubrique',
          itemTitle: 'title',
          help: 'Les adresses email et numéros de téléphone deviennent des liens automatiquement.',
          fields: {
            title: text('Titre', ''),
            text: textarea('Texte', '', {
              help: 'Laisse une ligne vide pour créer un nouveau paragraphe.',
            }),
          },
          min: 1,
        },
        [
          {
            title: 'Édition du site',
            text: 'Le site gaomata.fr est édité par Marion Aubreton, fondatrice de Gao Mata. Tu peux me joindre à gao.mata87@gmail.com ou au 06 09 05 00 01. Je suis également directrice de la publication.',
          },
          {
            title: 'Données personnelles',
            text: 'Ce site ne comporte pas de formulaire et ne dépose aucun cookie publicitaire. Les messages envoyés par email servent uniquement à répondre à ta demande et à préparer, si besoin, un rendez-vous.\n\nLorsque tu choisis d’afficher un module de réservation, le service tiers Aurarios est chargé. Son fonctionnement et les informations que tu lui transmets relèvent alors de sa propre politique de confidentialité.',
          },
          {
            title: 'Propriété intellectuelle',
            text: 'Les textes, photographies, éléments graphiques et l’identité GAO MATA sont protégés. Toute reproduction ou réutilisation nécessite mon autorisation écrite préalable.',
          },
          {
            title: 'Limites de l’accompagnement',
            text: 'Les informations publiées ici ne constituent pas un avis médical. La sophrologie et les pratiques corporelles proposées ne remplacent ni un diagnostic, ni un traitement, ni un suivi médical ou paramédical.',
          },
        ],
      ),
    }),
  }),
};

export type ContentSchema = typeof CONTENT_SCHEMA;
export type PageId = keyof ContentSchema;
export type Content = {
  [P in PageId]: PageValues<ContentSchema[P]>;
};
