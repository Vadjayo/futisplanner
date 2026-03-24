/**
 * LandingPage.jsx
 * Julkinen etusivu uusille käyttäjille. Hero, ominaisuudet, hinnoittelu.
 */

import { Link } from 'react-router-dom'
import styles from './LandingPage.module.css'

// Ominaisuuskortit — näytetään 3×2 gridissä
const FEATURES = [
  {
    icon: '🎯',
    title: 'Kenttäpiirtotyökalu',
    desc: 'Piirrä harjoitteet visuaalisesti suoraan selaimessa. Pelaajat, tötsät, nuolet, maalit ja paljon muuta.',
    pro: false,
  },
  {
    icon: '☁️',
    title: 'Pilvitallennus',
    desc: 'Harjoituksesi tallentuvat automaattisesti pilveen. Käytä millä tahansa laitteella.',
    pro: false,
  },
  {
    icon: '▶',
    title: 'Animaatiot',
    desc: 'Näytä pelaajien liike animaationa. Selitä harjoite visuaalisesti helpommin.',
    pro: true,
  },
  {
    icon: '📚',
    title: 'Harjoituskirjasto',
    desc: '150+ valmista harjoitetta ikäluokittain ja kategorioittain. Kloonaa ja muokkaa omaksesi.',
    pro: true,
  },
  {
    icon: '🤖',
    title: 'AI-avustaja',
    desc: 'Generoi harjoituksia tekoälyllä yhdellä lauseella. Saa ehdotuksia ikäluokan ja teeman mukaan.',
    pro: true,
  },
  {
    icon: '📄',
    title: 'PDF-vienti',
    desc: 'Tulosta harjoitteet paperille tai jaa PDF pelaajille ja vanhemmille.',
    pro: true,
  },
]

// Hinnoittelusuunnitelmat
const PLANS = [
  {
    name: 'Ilmainen',
    price: '0€',
    period: '/ kk',
    desc: 'Hyvä alku harjoitusten suunnitteluun',
    features: [
      'Kenttäpiirtotyökalu',
      'Kaikki elementit (pelaajat, tötsät, nuolet...)',
      'Pilvitallennus',
      'Rajaton määrä harjoituksia',
    ],
    missing: ['Animaatiot', 'PDF-vienti', 'Jakaminen', 'Harjoituskirjasto', 'AI-avustaja'],
    cta: 'Aloita ilmaiseksi',
    ctaLink: '/kirjaudu',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '7€',
    period: '/ kk',
    desc: 'Kaikki ominaisuudet ammattivalmentajalle',
    features: [
      'Kaikki ilmaisen ominaisuudet',
      'Animaatiot',
      'PDF-vienti',
      'Harjoitusten jakaminen linkillä',
      '150+ harjoitteen kirjasto',
      'AI-avustaja harjoitusten luontiin',
      'Kausisuunnitelmat',
    ],
    missing: [],
    cta: 'Kokeile Pro:ta',
    ctaLink: '/kirjaudu',
    highlighted: true,
  },
]

export default function LandingPage() {
  return (
    <div className={styles.page}>

      {/* ── NAVIGAATIO ── */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <Link to="/" className={styles.logo}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{display:'block'}}>
              <circle cx="11" cy="11" r="10" fill="#1D9E75"/>
              <path d="M11 3 L11 19 M3 11 L19 11 M5 5 L17 17 M17 5 L5 17" stroke="white" strokeWidth="1.3" strokeLinecap="round" opacity="0.5"/>
              <circle cx="11" cy="11" r="3.5" fill="white"/>
            </svg>
            <span>Futis<span className={styles.logoBrand}>Planner</span></span>
          </Link>
          <div className={styles.navLinks}>
            <a href="#ominaisuudet" className={styles.navLink}>Ominaisuudet</a>
            <a href="#hinnoittelu" className={styles.navLink}>Hinnoittelu</a>
          </div>
          <div className={styles.navActions}>
            <Link to="/kirjaudu" className={styles.btnOutline}>Kirjaudu sisään</Link>
            <Link to="/kirjaudu" className={styles.btnPrimary}>Aloita ilmaiseksi</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className={styles.hero}>

        {/* Animoitu jalkapallokenttä taustaksi */}
        <svg className={styles.fieldBg} viewBox="0 0 100 65" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          {/* Kenttätekstuuri: pystysuorat raidat */}
          {Array.from({ length: 11 }, (_, i) => (
            <rect key={i} x={i * (100/11)} y={0} width={100/11} height={65}
              fill={i % 2 === 0 ? '#0a3d18' : '#093615'} />
          ))}
          {/* Ulkoraja */}
          <path className={`${styles.fline} ${styles.fl1}`} pathLength="1" d="M3,3 L97,3 L97,62 L3,62 Z" />
          {/* Keskiviiva */}
          <line className={`${styles.fline} ${styles.fl2}`} pathLength="1" x1="50" y1="3" x2="50" y2="62" />
          {/* Keskiympyrä */}
          <circle className={`${styles.fline} ${styles.fl3}`} pathLength="1" cx="50" cy="32.5" r="8.5" />
          {/* Vasen rangaistusalue */}
          <path className={`${styles.fline} ${styles.fl4}`} pathLength="1" d="M3,15 L19,15 L19,50 L3,50" />
          {/* Oikea rangaistusalue */}
          <path className={`${styles.fline} ${styles.fl5}`} pathLength="1" d="M97,15 L81,15 L81,50 L97,50" />
          {/* Vasen maalialue */}
          <path className={`${styles.fline} ${styles.fl6}`} pathLength="1" d="M3,25 L8,25 L8,40 L3,40" />
          {/* Oikea maalialue */}
          <path className={`${styles.fline} ${styles.fl7}`} pathLength="1" d="M97,25 L92,25 L92,40 L97,40" />
          {/* Rangaistuskaaret */}
          <path className={`${styles.fline} ${styles.fl8}`} pathLength="1" d="M 19 25.6 A 8.5 8.5 0 0 1 19 39.4" />
          <path className={`${styles.fline} ${styles.fl8}`} pathLength="1" d="M 81 25.6 A 8.5 8.5 0 0 0 81 39.4" />
          {/* Kulmakaaret */}
          <path className={`${styles.fline} ${styles.fl9}`} pathLength="1" d="M 3 6 A 3 3 0 0 1 6 3" />
          <path className={`${styles.fline} ${styles.fl9}`} pathLength="1" d="M 94 3 A 3 3 0 0 1 97 6" />
          <path className={`${styles.fline} ${styles.fl9}`} pathLength="1" d="M 97 59 A 3 3 0 0 1 94 62" />
          <path className={`${styles.fline} ${styles.fl9}`} pathLength="1" d="M 6 62 A 3 3 0 0 1 3 59" />
          {/* Pisteet */}
          <circle className={`${styles.fdot}`} cx="50" cy="32.5" r="0.6" />
          <circle className={`${styles.fdot}`} cx="13" cy="32.5" r="0.6" />
          <circle className={`${styles.fdot}`} cx="87" cy="32.5" r="0.6" />
        </svg>

        {/* Tumma peite häviää — "valot syttyvät" */}
        <div className={styles.fieldDark} />
        {/* Liukuvärjäys tekstin alle luettavuuden vuoksi */}
        <div className={styles.fieldGradient} />

        <div className={styles.heroInner}>
          {/* Badge */}
          <div className={styles.badge}>
            ✦ Moderni harjoitussuunnittelutyökalu valmentajille ✦
          </div>

          {/* Pääotsikko */}
          <h1 className={styles.heroTitle}>
            Suunnittele harjoitukset<br />
            <span className={styles.heroAccent}>ammattimaisesti</span>
          </h1>

          <p className={styles.heroDesc}>
            FutisPlanner on moderni selainpohjainen harjoitussuunnittelutyökalu
            jalkapallovalmentajille. Toimii kaikilla laitteilla — ei asennuksia.
          </p>

          {/* CTA-napit */}
          <div className={styles.heroBtns}>
            <Link to="/kirjaudu" className={styles.btnPrimaryLg}>
              Aloita ilmaiseksi →
            </Link>
            <a href="#ominaisuudet" className={styles.btnGhostLg}>
              Katso ominaisuudet
            </a>
          </div>

          {/* Tilastot */}
          <div className={styles.heroStats}>
            <div className={styles.stat}>
              <span className={styles.statNum}>150+</span>
              <span className={styles.statLabel}>Valmista harjoitetta kirjastossa</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNum}>11</span>
              <span className={styles.statLabel}>Eri elementtityyppiä</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNum}>0€</span>
              <span className={styles.statLabel}>Aloituskustannus</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── OMINAISUUDET ── */}
      <section className={styles.features} id="ominaisuudet">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Kaikki mitä tarvitset</h2>
            <p className={styles.sectionDesc}>
              Kenttäpiirtotyökalusta AI-avustettuun harjoitusten luontiin
            </p>
          </div>
          <div className={styles.featuresGrid}>
            {FEATURES.map((f) => (
              <div key={f.title} className={styles.featureCard}>
                <div className={styles.featureIcon}>{f.icon}</div>
                <div className={styles.featureContent}>
                  <div className={styles.featureTitleRow}>
                    <h3 className={styles.featureTitle}>{f.title}</h3>
                    {/* Pro-merkki Pro-ominaisuuksille */}
                    {f.pro && <span className={styles.proBadge}>Pro</span>}
                  </div>
                  <p className={styles.featureDesc}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HINNOITTELU ── */}
      <section className={styles.pricing} id="hinnoittelu">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Selkeä hinnoittelu</h2>
            <p className={styles.sectionDesc}>Aloita ilmaiseksi, päivitä kun tarvitset lisää</p>
          </div>
          <div className={styles.pricingGrid}>
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`${styles.pricingCard} ${plan.highlighted ? styles.pricingHighlighted : ''}`}
              >
                {/* Pro-kortin korostusmerkki */}
                {plan.highlighted && (
                  <div className={styles.popularBadge}>Suosituin</div>
                )}
                <h3 className={styles.planName}>{plan.name}</h3>
                <div className={styles.planPrice}>
                  <span className={styles.planPriceNum}>{plan.price}</span>
                  <span className={styles.planPricePeriod}>{plan.period}</span>
                </div>
                <p className={styles.planDesc}>{plan.desc}</p>
                <ul className={styles.planFeatures}>
                  {plan.features.map((f) => (
                    <li key={f} className={styles.planFeature}>
                      <span className={styles.checkIcon}>✓</span> {f}
                    </li>
                  ))}
                  {/* Puuttuvat ominaisuudet harmaalla */}
                  {plan.missing.map((f) => (
                    <li key={f} className={`${styles.planFeature} ${styles.planFeatureMissing}`}>
                      <span className={styles.crossIcon}>✕</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to={plan.ctaLink}
                  className={plan.highlighted ? styles.btnPrimaryLg : styles.btnOutlineLg}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span className={styles.footerLogo}>⚽ FutisPlanner</span>
          <span className={styles.footerCopy}>© 2026 FutisPlanner. Tehty Suomessa 🇫🇮</span>
        </div>
      </footer>

    </div>
  )
}
