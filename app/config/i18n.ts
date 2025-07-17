import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// To add i18n to your project, follow these steps:

// 1. Install dependencies:
//     npm install i18next react-i18next

// 2. Create a config/i18n.ts file with the following content:

   const resources = {
     en: {
        translation: {
           welcome: "Welcome",
           // Add more keys as needed
        },
     },
     fr: {
        translation: {
           welcome: "Bienvenue",
           // Add more keys as needed
        },
     },
   };

   i18n
     .use(initReactI18next)
     .init({
        resources,
        lng: 'en', // default language
        fallbackLng: 'en',
        interpolation: {
           escapeValue: false,
        },
     });

   export default i18n;

