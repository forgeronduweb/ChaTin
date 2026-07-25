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
  chatActionCopy: 'Copy',
  chatActionCopied: 'Copied',
  chatActionShare: 'Share',
  chatActionReadAloud: 'Read aloud',
  chatActionStopReading: 'Stop reading',
  chatActionLike: 'Good response',
  chatActionDislike: 'Bad response',
  chatActionExportExcel: 'Export as Excel',
  chatActionExportPdf: 'Export as PDF',
  chatActionExportChart: 'Export as image',
  chatLoadingThinking: 'Thinking…',
  chatLoadingGenerating: 'Generating a reply…',
  chatLoadingAlmost: 'Almost there…',
  chatCodeLanguageText: 'Text',
  chatChartOther: 'Other',

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
  settingsThemeLight: 'Light theme',
  settingsThemeDark: 'Dark theme',
  settingsThemeAuto: 'Automatic theme',

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

  settingsMemory: 'Memory',
  settingsCity: 'My city',
  settingsCityUnknown: 'Not detected yet — tap to detect',
  settingsCityUnavailableTitle: "Couldn't detect your city",
  settingsCityUnavailableMessage: 'Check that location access is allowed for ChaTin in your phone settings, then try again.',

  memoryTitle: 'Memory',
  memoryIntro: 'What ChaTin remembers about you across your conversations.',
  memoryEmpty: "ChaTin doesn't remember anything about you yet. It learns as you chat.",
  memoryDeleteAll: 'Delete everything',
  memoryDeleteAllConfirmTitle: 'Delete all memories?',
  memoryDeleteAllConfirmMessage: 'ChaTin will forget everything it has learned about you. This cannot be undone.',
  memoryDeleteAllConfirmButton: 'Delete',

  settingsAbout: 'About',
  settingsAboutTagline: 'Your friendly AI chat companion, anytime.',
  aboutTermsRow: 'Terms of Use',
  aboutPrivacyRow: 'Privacy Policy',
  aboutLicenseRow: 'Licenses',

  termsTitle: 'Terms of Use',
  termsBody: `**Acceptance of these terms**

By using ChaTin, you agree to these terms of use. If you don't agree, please don't use the app.

**The service**

ChaTin is a chatbot powered by third-party AI models (Google Gemini and Groq). Generated replies can contain mistakes, approximations, or outdated information. Don't rely on ChaTin for medical, legal, financial, or safety decisions without independent verification.

**Account and use**

Signing in with Google is optional - you can use the app without an account, but some features (synced history, memory across conversations, detected city) require being signed in. You're responsible for the content you send to the app and agree not to use it for illegal, harmful, or abusive purposes.

**Availability**

The service is provided "as is", with no guarantee of continuous availability. Interruptions, updates, or feature changes can happen at any time.

**Changes**

These terms may be updated over time; the latest version is always available in the app.

**Contact**

For any question, use the "Contact us" form in Settings.`,

  privacyTitle: 'Privacy Policy',
  privacyBody: `**Data we collect**

- **Account**: if you sign in with Google, we receive your name, email address, and profile picture (if any).
- **Conversations**: the messages you send and the AI's replies are stored on our servers, tied to your account if you're signed in, so you can find your history again. A copy is also kept locally on your phone.
- **Memory**: ChaTin may remember certain lasting facts mentioned in conversation (first name, preferences, city, etc.) to personalize its replies. You can review and clear these memories anytime in Settings > Memory.
- **Approximate city**: only if you grant location access, to give location-aware replies (weather, local time...).
- **Audio**: if you use voice input, the recording is sent to our transcription provider and isn't kept by us after processing.
- **Feedback**: messages you send via "Contact us" are kept so we can follow up.

**Sharing with third parties**

The content of your messages is sent to third-party AI providers (Google Gemini, Groq) to generate replies; audio files are sent to Groq for transcription. These providers process data under their own privacy policies. We don't sell or share your data for advertising, and the app has no tracking or ad SDKs.

**Retention and deletion**

You can clear your local history anytime (Settings > Clear local history), delete your remembered memories (Settings > Memory), or sign out of your account. To request full deletion of your server-side data, contact us via the feedback form.

**Security**

Data travels over HTTPS between the app and our servers.

**Changes**

This policy may evolve over time; the latest version is always available in the app.

**Contact**

For any question about your data, use the "Contact us" form in Settings.`,

  licenseTitle: 'License',
  licenseBody: `ChaTin's source code is released under the MIT License.

The MIT License (MIT)

Copyright (c) 2026 ChaTin

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

ChaTin also relies on third-party open source libraries (React Native, Expo, and others), each distributed under their own license.`,

  weatherConditionClear: 'Clear sky',
  weatherConditionPartlyCloudy: 'Partly cloudy',
  weatherConditionCloudy: 'Cloudy',
  weatherConditionFog: 'Fog',
  weatherConditionDrizzle: 'Drizzle',
  weatherConditionRain: 'Rain',
  weatherConditionSnow: 'Snow',
  weatherConditionThunderstorm: 'Thunderstorm',
  weatherWind: 'Wind',
  weatherHumidity: 'Humidity',
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
  chatActionCopy: 'Copier',
  chatActionCopied: 'Copié',
  chatActionShare: 'Partager',
  chatActionReadAloud: 'Lire à voix haute',
  chatActionStopReading: 'Arrêter la lecture',
  chatActionLike: 'Bonne réponse',
  chatActionDislike: 'Mauvaise réponse',
  chatActionExportExcel: 'Exporter en Excel',
  chatActionExportPdf: 'Exporter en PDF',
  chatActionExportChart: 'Exporter en image',
  chatLoadingThinking: 'Réflexion en cours…',
  chatLoadingGenerating: 'Génération de la réponse…',
  chatLoadingAlmost: 'Presque prêt…',
  chatCodeLanguageText: 'Texte',
  chatChartOther: 'Autres',

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
  settingsThemeLight: 'Thème clair',
  settingsThemeDark: 'Thème sombre',
  settingsThemeAuto: 'Thème automatique',

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

  settingsMemory: 'Mémoire',
  settingsCity: 'Ma ville',
  settingsCityUnknown: 'Pas encore détectée — appuie pour détecter',
  settingsCityUnavailableTitle: "Impossible de détecter ta ville",
  settingsCityUnavailableMessage:
    "Vérifie que l'accès à la position est autorisé pour ChaTin dans les paramètres de ton téléphone, puis réessaie.",

  memoryTitle: 'Mémoire',
  memoryIntro: 'Ce que ChaTin retient de toi entre tes conversations.',
  memoryEmpty: "ChaTin ne se souvient encore de rien à ton sujet. Il apprend au fil de vos échanges.",
  memoryDeleteAll: 'Tout effacer',
  memoryDeleteAllConfirmTitle: 'Effacer tous les souvenirs ?',
  memoryDeleteAllConfirmMessage: 'ChaTin oubliera tout ce qu’il a appris à ton sujet. Cette action est irréversible.',
  memoryDeleteAllConfirmButton: 'Effacer',

  settingsAbout: 'À propos',
  settingsAboutTagline: 'Ton compagnon IA sympa, disponible à tout moment.',
  aboutTermsRow: "Conditions d'utilisation",
  aboutPrivacyRow: 'Politique de confidentialité',
  aboutLicenseRow: 'Licences',

  termsTitle: "Conditions d'utilisation",
  termsBody: `**Acceptation des conditions**

En utilisant ChaTin, tu acceptes les présentes conditions d'utilisation. Si tu n'es pas d'accord, merci de ne pas utiliser l'application.

**Le service**

ChaTin est un chatbot propulsé par des modèles d'intelligence artificielle tiers (Google Gemini et Groq). Les réponses générées peuvent contenir des erreurs, des approximations ou des informations incorrectes ou obsolètes. Ne te fie pas à ChaTin pour des décisions médicales, juridiques, financières ou de sécurité sans vérification indépendante.

**Compte et utilisation**

La connexion via Google est optionnelle : tu peux utiliser l'app sans compte, mais certaines fonctionnalités (historique synchronisé, mémoire entre conversations, ville détectée) nécessitent d'être connecté. Tu es responsable du contenu que tu envoies à l'app et t'engages à ne pas l'utiliser à des fins illégales, nuisibles ou abusives.

**Disponibilité**

Le service est fourni "tel quel", sans garantie de disponibilité continue. Des interruptions, mises à jour ou changements de fonctionnalités peuvent survenir à tout moment.

**Modifications**

Ces conditions peuvent être mises à jour ; la version la plus récente est toujours disponible dans l'app.

**Contact**

Pour toute question, utilise le formulaire "Nous contacter" dans Paramètres.`,

  privacyTitle: 'Politique de confidentialité',
  privacyBody: `**Données collectées**

- **Compte** : si tu te connectes avec Google, on reçoit ton nom, ton adresse e-mail et une photo de profil éventuelle.
- **Conversations** : les messages que tu envoies et les réponses de l'IA sont enregistrés sur nos serveurs, liés à ton compte si tu es connecté, pour te permettre de retrouver ton historique. Une copie est aussi gardée localement sur ton téléphone.
- **Mémoire** : ChaTin peut retenir certains faits durables évoqués en conversation (prénom, préférences, ville, etc.) pour personnaliser ses réponses. Tu peux consulter et effacer ces souvenirs à tout moment dans Paramètres > Mémoire.
- **Ville approximative** : uniquement si tu autorises l'accès à la position, pour des réponses tenant compte du lieu (météo, heure locale...).
- **Audio** : si tu utilises la saisie vocale, l'enregistrement est envoyé à notre fournisseur de transcription puis n'est pas conservé par nous après traitement.
- **Retours** : les messages que tu envoies via "Nous contacter" sont conservés pour assurer le suivi.

**Partage avec des tiers**

Le contenu de tes messages est transmis à des fournisseurs d'IA tiers (Google Gemini, Groq) pour générer les réponses ; les fichiers audio sont transmis à Groq pour la transcription. Ces prestataires traitent les données selon leurs propres politiques de confidentialité. On ne vend ni ne partage tes données à des fins publicitaires, et l'app n'intègre aucun SDK de tracking ou de publicité.

**Conservation et suppression**

Tu peux effacer ton historique local à tout moment (Paramètres > Effacer l'historique local), supprimer tes souvenirs mémorisés (Paramètres > Mémoire), ou te déconnecter de ton compte. Pour demander la suppression complète de tes données côté serveur, contacte-nous via le formulaire de retour.

**Sécurité**

Les données transitent en HTTPS entre l'app et nos serveurs.

**Modifications**

Cette politique peut évoluer ; la version la plus récente est toujours disponible dans l'app.

**Contact**

Pour toute question sur tes données, utilise le formulaire "Nous contacter" dans Paramètres.`,

  licenseTitle: 'Licence',
  licenseBody: `Le code source de ChaTin est publié sous licence MIT.

The MIT License (MIT)

Copyright (c) 2026 ChaTin

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

ChaTin s'appuie aussi sur des bibliothèques open source tierces (React Native, Expo, et d'autres), chacune distribuée sous sa propre licence.`,

  weatherConditionClear: 'Ciel dégagé',
  weatherConditionPartlyCloudy: 'Partiellement nuageux',
  weatherConditionCloudy: 'Nuageux',
  weatherConditionFog: 'Brouillard',
  weatherConditionDrizzle: 'Bruine',
  weatherConditionRain: 'Pluie',
  weatherConditionSnow: 'Neige',
  weatherConditionThunderstorm: 'Orage',
  weatherWind: 'Vent',
  weatherHumidity: 'Humidité',
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
