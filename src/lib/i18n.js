import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  fi: {
    translation: {
      // Auth
      'auth.title': 'FutisPlanner',
      'auth.subtitle': 'Jalkapallovalmentajan harjoitustyökalu',
      'auth.email': 'Sähköposti',
      'auth.password': 'Salasana',
      'auth.login': 'Kirjaudu sisään',
      'auth.register': 'Luo tili',
      'auth.switchToRegister': 'Ei tiliä? Luo tili',
      'auth.switchToLogin': 'Onko sinulla jo tili? Kirjaudu',
      'auth.loading': 'Ladataan...',
      'auth.checkEmail': 'Tarkista sähköpostisi — lähetimme vahvistuslinkin!',

      // TopBar
      'topbar.placeholder': 'Nimetön harjoitus',
      'topbar.save': 'Tallenna',
      'topbar.share': 'Jaa',
      'topbar.pdf': 'PDF',
      'topbar.signOut': 'Kirjaudu ulos',

      // LeftToolbar
      'toolbar.select': 'Valitse',
      'toolbar.player': 'Pelaaja',
      'toolbar.coach': 'Valmentaja',
      'toolbar.ball': 'Pallo',
      'toolbar.cone': 'Tötsä',
      'toolbar.pole': 'Keppi',
      'toolbar.arrow': 'Liike',
      'toolbar.arrow.syotto': 'Syöttö',
      'toolbar.arrow.liike': 'Liike',
      'toolbar.arrow.laukaus': 'Laukaus',
      'toolbar.arrow.kuljetus': 'Kuljetus',
      'toolbar.text': 'Teksti',
      'toolbar.animate': 'Animoi',
      'toolbar.home': 'Koti',
      'toolbar.away': 'Vieras',

      // RightSidebar
      'sidebar.drills': 'Harjoitteet',
      'sidebar.addDrill': '+ Lisää harjoite',
      'sidebar.totalDuration': 'Kesto yhteensä',
      'sidebar.minutes': 'min',

      // DrillList
      'drill.untitled': 'Nimetön harjoite',
      'drill.minutes': 'min',
      'drill.addFirst': 'Lisää ensimmäinen harjoite →',
    },
  },
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'fi',
  fallbackLng: 'fi',
  interpolation: { escapeValue: false },
})

export default i18n
