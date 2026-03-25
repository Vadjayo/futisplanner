/**
 * Card.jsx
 * Yleiskäyttöinen kortti-komponentti tummalla teemalla.
 */

import styles from './Card.module.css'

export default function Card({ children, className = '', padding = 'md', ...props }) {
  return (
    <div
      className={[styles.card, styles[`pad_${padding}`], className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}
