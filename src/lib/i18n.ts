import * as Localization from 'expo-localization';

const en = {
  welcomeTitle: 'The best AI chatbot in the world with a fun concept',
  welcomeOr: 'or',
  welcomeSkip: 'Continue without signing in',

  homeTitle: 'Explore knowledge with AI chat',
  homeNewChat: 'New Chat',
  homeChatHistory: 'Chat history',
  homeSeeAll: 'See All',
  homePopularPrompt: 'Popular Prompt',
  homeGeneratedBy: 'Generate by\n{author}',
  homeUsePrompt: 'Use this prompt',
  historyEmpty: 'No conversations yet',
  homePromptSushiTitle: 'Explain about Sushi Roll receipt',
  homePromptResolutionTitle: 'Give the best resolution for 2024',

  chatPlaceholder: 'Type here...',
  chatNewChatTitle: 'New chat',
  chatServerError: "Sorry, I couldn't reach the server. Is it running?",
  chatStopGenerating: 'Stop generate',
  chatEditMessage: 'Edit',
  chatCopyMessage: 'Copy',
  chatMessageCopied: 'Copied!',
  chatRecording: 'Recording...',
  chatMicPermissionTitle: 'Microphone access needed',
  chatMicPermissionMessage: 'Allow microphone access in your phone settings to record voice messages.',

  loginTitle: 'Sign in to ChaTin',
  loginSubtitle:
    'Optional — sign in to sync your conversations across devices. You can keep chatting as a guest.',
  loginSigningIn: 'Signing in...',
  loginContinueGoogle: 'Continue with Google',
  loginContinueApple: 'Continue with Apple',
  loginMaybeLater: 'Maybe later',
  loginComingSoonTitle: 'Coming soon',
  loginAppleOnlyIOS: 'Sign in with Apple is only available on iOS for now.',
  loginNotConfiguredTitle: 'Not configured yet',
  loginGoogleNotConfigured: 'Add EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID to your .env file to enable Google sign-in.',
  loginSignInFailedTitle: 'Sign in failed',
  loginSignInFailedMessage: "Couldn't reach the server. Is it running?",

  settingsTitle: 'Settings',
  settingsAccount: 'Account',
  settingsSignedInAs: 'Signed in as',
  settingsSignOut: 'Sign out',
  settingsSignOutConfirmTitle: 'Sign out?',
  settingsSignOutConfirmMessage: "You'll need to sign in again to sync your conversations.",
  settingsCancel: 'Cancel',
  settingsOk: 'OK',
  settingsNotSignedIn: "You're not signed in",
  settingsNotSignedInSubtitle: 'Sign in to sync your conversations across devices.',
  settingsSignIn: 'Sign in',
  settingsGeneral: 'General',
  settingsLanguage: 'Language',
  settingsVersion: 'Version',

  settingsFeedback: 'Help us improve',
  settingsFeedbackPlaceholder: 'A suggestion, a bug to report...',
  settingsFeedbackSend: 'Send',
  settingsFeedbackSending: 'Sending...',
  settingsFeedbackSuccess: 'Thanks for your feedback!',
  settingsFeedbackError: "Couldn't send your feedback. Try again later.",
  settingsFeedbackEmpty: 'Write a message before sending.',

  settingsOther: 'Other',
  settingsShareApp: 'Share the app',
  settingsShareMessage: 'Check out ChaTin, a free AI chatbot: {url}',
  settingsCheckUpdate: 'Check for updates',
  settingsCheckUpdateUpToDateTitle: 'Up to date',
  settingsCheckUpdateUpToDateMessage: "You're already using the latest version of ChaTin.",
  settingsCheckUpdateErrorTitle: 'Error',
  settingsCheckUpdateErrorMessage: "Couldn't check for updates. Try again later.",
  settingsClearHistory: 'Clear local history',
  settingsClearHistoryConfirmTitle: 'Clear history?',
  settingsClearHistoryConfirmMessage: 'All conversations stored on this device will be permanently deleted.',
  settingsClearHistoryConfirmButton: 'Clear',
  settingsClearHistoryDone: 'History cleared.',

  settingsAbout: 'About',
  settingsAboutTagline: 'The free AI chatbot that speaks French and English.',
  settingsAboutCredit: 'Built with Expo & React Native, by Evrard Baho',
  settingsAboutWebsite: 'Website',
};

const fr: Record<keyof typeof en, string> = {
  welcomeTitle: 'Le meilleur chatbot IA au monde, avec un concept fun',
  welcomeOr: 'ou',
  welcomeSkip: 'Continuer sans se connecter',

  homeTitle: 'Explore la connaissance avec un chat IA',
  homeNewChat: 'Nouvelle discussion',
  homeChatHistory: 'Historique',
  homeSeeAll: 'Tout voir',
  homePopularPrompt: 'Prompts populaires',
  homeGeneratedBy: 'Généré par\n{author}',
  homeUsePrompt: 'Utiliser ce prompt',
  historyEmpty: 'Aucune conversation pour l’instant',
  homePromptSushiTitle: 'Explique la recette des sushis',
  homePromptResolutionTitle: 'Donne la meilleure résolution pour 2024',

  chatPlaceholder: 'Écris ici...',
  chatNewChatTitle: 'Nouvelle discussion',
  chatServerError: 'Désolé, impossible de contacter le serveur. Est-il démarré ?',
  chatStopGenerating: 'Arrêter la génération',
  chatEditMessage: 'Modifier',
  chatCopyMessage: 'Copier',
  chatMessageCopied: 'Copié !',
  chatRecording: 'Enregistrement...',
  chatMicPermissionTitle: 'Accès au micro requis',
  chatMicPermissionMessage:
    'Autorise l’accès au micro dans les paramètres de ton téléphone pour enregistrer des messages vocaux.',

  loginTitle: 'Connecte-toi à ChaTin',
  loginSubtitle:
    "Optionnel — connecte-toi pour synchroniser tes conversations entre appareils. Tu peux continuer en tant qu'invité.",
  loginSigningIn: 'Connexion...',
  loginContinueGoogle: 'Continuer avec Google',
  loginContinueApple: 'Continuer avec Apple',
  loginMaybeLater: 'Plus tard',
  loginComingSoonTitle: 'Bientôt disponible',
  loginAppleOnlyIOS: "La connexion avec Apple n'est disponible que sur iOS pour le moment.",
  loginNotConfiguredTitle: 'Pas encore configuré',
  loginGoogleNotConfigured:
    "Ajoute EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID à ton fichier .env pour activer la connexion Google.",
  loginSignInFailedTitle: 'Échec de connexion',
  loginSignInFailedMessage: 'Impossible de contacter le serveur. Est-il démarré ?',

  settingsTitle: 'Paramètres',
  settingsAccount: 'Compte',
  settingsSignedInAs: 'Connecté en tant que',
  settingsSignOut: 'Se déconnecter',
  settingsSignOutConfirmTitle: 'Se déconnecter ?',
  settingsSignOutConfirmMessage: 'Tu devras te reconnecter pour synchroniser tes conversations.',
  settingsCancel: 'Annuler',
  settingsOk: 'OK',
  settingsNotSignedIn: "Tu n'es pas connecté",
  settingsNotSignedInSubtitle: 'Connecte-toi pour synchroniser tes conversations entre appareils.',
  settingsSignIn: 'Se connecter',
  settingsGeneral: 'Général',
  settingsLanguage: 'Langue',
  settingsVersion: 'Version',

  settingsFeedback: 'Nous améliorer',
  settingsFeedbackPlaceholder: 'Une suggestion, un bug à signaler...',
  settingsFeedbackSend: 'Envoyer',
  settingsFeedbackSending: 'Envoi...',
  settingsFeedbackSuccess: 'Merci pour ton retour !',
  settingsFeedbackError: "Impossible d'envoyer ton retour. Réessaie plus tard.",
  settingsFeedbackEmpty: "Écris un message avant d'envoyer.",

  settingsOther: 'Autres',
  settingsShareApp: "Partager l'app",
  settingsShareMessage: 'Découvre ChaTin, un chatbot IA gratuit : {url}',
  settingsCheckUpdate: 'Vérifier les mises à jour',
  settingsCheckUpdateUpToDateTitle: 'À jour',
  settingsCheckUpdateUpToDateMessage: 'Tu utilises déjà la dernière version de ChaTin.',
  settingsCheckUpdateErrorTitle: 'Erreur',
  settingsCheckUpdateErrorMessage: 'Impossible de vérifier les mises à jour. Réessaie plus tard.',
  settingsClearHistory: "Effacer l'historique local",
  settingsClearHistoryConfirmTitle: "Effacer l'historique ?",
  settingsClearHistoryConfirmMessage:
    'Toutes tes conversations enregistrées sur cet appareil seront supprimées définitivement.',
  settingsClearHistoryConfirmButton: 'Effacer',
  settingsClearHistoryDone: 'Historique effacé.',

  settingsAbout: 'À propos',
  settingsAboutTagline: 'Le chatbot IA gratuit qui parle français et anglais.',
  settingsAboutCredit: 'Construit avec Expo & React Native, par Evrard Baho',
  settingsAboutWebsite: 'Site web',
};

const translations = { fr, en };

export type Locale = keyof typeof translations;
export type TranslationKey = keyof typeof en;

function detectLocale(): Locale {
  const languageCode = Localization.getLocales()[0]?.languageCode;
  return languageCode === 'en' ? 'en' : 'fr';
}

export const locale: Locale = detectLocale();

export function t(key: TranslationKey, vars?: Record<string, string>): string {
  let text = translations[locale][key];
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replace(`{${name}}`, value);
    }
  }
  return text;
}
