/**
 * Button.jsx
 * Uudelleenkäytettävä nappikomponentti.
 *
 * @param {'primary'|'ghost'|'danger'|'secondary'} variant
 * @param {'sm'|'md'|'lg'} size
 * @param {boolean} loading  - Näyttää latauspyörän ja disabloi napin
 * @param {boolean} disabled
 * @param {boolean} fullWidth
 */
const Button = ({
  children,
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  disabled = false,
  fullWidth = false,
  onClick,
  style,
  ...props
}) => {
  const variantStyles = {
    primary: {
      background: '#1D9E75',
      color: '#fff',
      border: 'none',
    },
    secondary: {
      background: '#1a1d27',
      color: '#d0dce8',
      border: '0.5px solid #2a2d3e',
    },
    ghost: {
      background: 'transparent',
      color: '#8b8d97',
      border: '0.5px solid #2a2d35',
    },
    danger: {
      background: 'transparent',
      color: '#E24B4A',
      border: '0.5px solid rgba(226,75,74,0.25)',
    },
  }

  const sizeStyles = {
    sm: { fontSize: '11px', padding: '4px 10px' },
    md: { fontSize: '12px', padding: '6px 14px' },
    lg: { fontSize: '14px', padding: '8px 18px' },
  }

  const isDisabled = disabled || loading

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      style={{
        ...variantStyles[variant] ?? variantStyles.primary,
        ...sizeStyles[size]       ?? sizeStyles.md,
        borderRadius:  '6px',
        cursor:        isDisabled ? 'not-allowed' : 'pointer',
        opacity:       isDisabled ? 0.5 : 1,
        fontFamily:    'inherit',
        fontWeight:    500,
        display:       'inline-flex',
        alignItems:    'center',
        justifyContent:'center',
        gap:           '6px',
        transition:    'opacity 0.15s, background 0.15s',
        whiteSpace:    'nowrap',
        width:         fullWidth ? '100%' : undefined,
        ...style,
      }}
      {...props}
    >
      {loading && (
        <span
          aria-hidden="true"
          style={{
            display: 'inline-block',
            width: '11px', height: '11px',
            border: '2px solid rgba(255,255,255,0.3)',
            borderTopColor: 'currentColor',
            borderRadius: '50%',
            animation: 'btn-spin 0.7s linear infinite',
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </button>
  )
}

export default Button
