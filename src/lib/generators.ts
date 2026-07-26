// Static v1 catalogue of marketing/sales content generators - kept as plain
// data (not admin/server-driven like `prompts`) so this ships without any
// backend change. Each generator's `buildPrompt` turns short form answers
// into a single instruction string, sent through the exact same "prefill +
// auto-send" mechanism prompt cards already use (`router.push('/chat', {
// params: { title } })`, picked up by chat.tsx's existing effect) - so the
// result is a normal conversation with full history/copy/share for free.

export type GeneratorTextField = {
  key: string;
  type: 'text';
  label: string;
  placeholder: string;
  multiline?: boolean;
};

export type GeneratorSelectField = {
  key: string;
  type: 'select';
  label: string;
  options: string[];
};

export type GeneratorField = GeneratorTextField | GeneratorSelectField;

export type Generator = {
  id: string;
  emoji: string;
  title: string;
  description: string;
  fields: GeneratorField[];
  buildPrompt: (values: Record<string, string>) => string;
};

export const GENERATORS: Generator[] = [
  {
    id: 'cold-email',
    emoji: '📧',
    title: 'E-mail de prospection',
    description: 'Un e-mail de prise de contact prêt à envoyer.',
    fields: [
      { key: 'produit', type: 'text', label: 'Produit / service', placeholder: 'Ex : logiciel de facturation en ligne' },
      { key: 'cible', type: 'text', label: 'Cible', placeholder: 'Ex : PME du secteur du bâtiment' },
      { key: 'ton', type: 'select', label: 'Ton', options: ['Direct', 'Professionnel', 'Décontracté'] },
    ],
    buildPrompt: ({ produit, cible, ton }) =>
      `Rédige un e-mail de prospection commerciale pour "${produit}", destiné à "${cible}". ` +
      `Ton ${ton?.toLowerCase()}. Objet accrocheur, message court (max 120 mots), une seule idée par email, ` +
      `et une question de fin claire qui appelle une réponse.`,
  },
  {
    id: 'social-post',
    emoji: '📱',
    title: 'Post réseaux sociaux',
    description: 'Une publication adaptée à la plateforme choisie.',
    fields: [
      { key: 'produit', type: 'text', label: 'Produit / service', placeholder: 'Ex : coaching sportif en ligne' },
      { key: 'plateforme', type: 'select', label: 'Plateforme', options: ['LinkedIn', 'Instagram', 'Facebook'] },
      { key: 'objectif', type: 'select', label: 'Objectif', options: ['Notoriété', 'Vente', 'Engagement'] },
    ],
    buildPrompt: ({ produit, plateforme, objectif }) =>
      `Rédige un post ${plateforme} pour promouvoir "${produit}", avec pour objectif : ${objectif?.toLowerCase()}. ` +
      `Adapte le ton et le format aux codes de ${plateforme} (longueur, emojis, hashtags si pertinent). ` +
      `Termine par un appel à l'action clair.`,
  },
  {
    id: 'objection-handling',
    emoji: '🛡️',
    title: 'Réponse à une objection',
    description: "Un argumentaire pour désamorcer une objection client.",
    fields: [
      { key: 'objection', type: 'text', label: 'Objection du client', placeholder: 'Ex : "C\'est trop cher par rapport à la concurrence"', multiline: true },
      { key: 'produit', type: 'text', label: 'Produit / offre', placeholder: 'Ex : abonnement premium à 49€/mois' },
    ],
    buildPrompt: ({ objection, produit }) =>
      `Un client oppose l'objection suivante concernant "${produit}" : "${objection}". ` +
      `Propose 2-3 réponses courtes et convaincantes pour désamorcer cette objection sans être sur la défensive, ` +
      `en valorisant la valeur plutôt qu'en justifiant le prix.`,
  },
  {
    id: 'call-opener',
    emoji: '☎️',
    title: "Accroche d'appel de vente",
    description: 'Les premières phrases pour capter l’attention.',
    fields: [
      { key: 'produit', type: 'text', label: 'Produit / service', placeholder: 'Ex : solution de gestion de stock' },
      { key: 'cible', type: 'text', label: 'Cible', placeholder: 'Ex : responsable achats' },
      { key: 'contexte', type: 'text', label: 'Contexte', placeholder: 'Ex : suite à un salon professionnel' },
    ],
    buildPrompt: ({ produit, cible, contexte }) =>
      `Rédige une accroche des 30 premières secondes d'un appel de prospection téléphonique pour "${produit}", ` +
      `en s'adressant à "${cible}", dans le contexte suivant : ${contexte}. ` +
      `Doit capter l'attention rapidement et amener naturellement à poser une première question ouverte.`,
  },
  {
    id: 'ad-copy',
    emoji: '📣',
    title: 'Accroche publicitaire',
    description: 'Un slogan ou une accroche courte pour une annonce.',
    fields: [
      { key: 'produit', type: 'text', label: 'Produit / service', placeholder: 'Ex : chaussures de running' },
      { key: 'benefice', type: 'text', label: 'Bénéfice principal', placeholder: 'Ex : confort toute la journée' },
      { key: 'ton', type: 'select', label: 'Ton', options: ['Direct', 'Professionnel', 'Décontracté'] },
    ],
    buildPrompt: ({ produit, benefice, ton }) =>
      `Propose 5 accroches publicitaires courtes (moins de 12 mots chacune) pour "${produit}", ` +
      `mettant en avant le bénéfice suivant : "${benefice}". Ton ${ton?.toLowerCase()}.`,
  },
  {
    id: 'quote-followup',
    emoji: '⏳',
    title: 'Relance après devis',
    description: 'Un message de relance pour un devis resté sans réponse.',
    fields: [
      { key: 'produit', type: 'text', label: 'Produit / offre', placeholder: 'Ex : refonte de site web' },
      { key: 'jours', type: 'text', label: "Jours écoulés depuis l'envoi", placeholder: 'Ex : 5' },
      { key: 'ton', type: 'select', label: 'Ton', options: ['Direct', 'Professionnel', 'Décontracté'] },
    ],
    buildPrompt: ({ produit, jours, ton }) =>
      `Rédige un message de relance pour un devis concernant "${produit}", envoyé il y a ${jours} jours et resté sans réponse. ` +
      `Ton ${ton?.toLowerCase()}, court, sans pression excessive, qui relance la conversation plutôt que de réclamer une décision.`,
  },
];

export function getGenerator(id: string): Generator | undefined {
  return GENERATORS.find((generator) => generator.id === id);
}
