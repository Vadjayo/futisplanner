/**
 * Badge.jsx
 * Pieni merkintä-komponentti kategorioille, tiloille, numeroille.
 */

import styles from './Badge.module.css'

/**
 * @param {'green'|'blue'|'purple'|'orange'|'red'|'gray'} color
 * @param {'sm'|'md'} size
 */
export default function Badge({ children, color = 'gray', size = 'md', className = '', ...props }) {
  return (
    <span
      className={[styles.badge, styles[color], styles[size], className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </span>
  )
}
