/**
 * AIAssistantPanel.jsx
 * AI-avustajan chat-paneeli treenisuunnittelijassa.
 * Näytetään oikeassa sivupalkissa välilehtinä Kirjasto-napin rinnalla.
 */

import { useState, useRef, useEffect } from 'react'
import { useAIAssistant } from '../../hooks/useAIAssistant'
import { COLORS } from '../../constants/colors'

/** Pikaehdotukset käyttäjälle */
const SUGGESTIONS = [
  'Passelirinki 6 pelaajaa',
  '4v2 hallintapeli',
  '1v1 rata tötsillä',
  'Lämmittely juoksurata',
]

/**
 * AI-avustajan paneeli.
 * @param {object}   props
 * @param {function} props.onElementsGenerated - Callback kun elementit hyväksytään kentälle
 * @param {boolean}  [props.isPro=false]       - Pro-käyttäjätarkistus
 */
export default function AIAssistantPanel({ onElementsGenerated, isPro = false }) {
  const [input, setInput] = useState('')
  const messagesEndRef    = useRef(null)

  const {
    messages, loading, pendingElements,
    sendMessage, approveElements, rejectElements, clearChat,
  } = useAIAssistant({ onElementsGenerated })

  // Skrollaa uusimpaan viestiin
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend() {
    if (!input.trim()) return
    sendMessage(input)
    setInput('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Pro-lukko
  if (!isPro) {
    return (
      <div style={s.locked}>
        <div style={{ fontSize: 24 }}>🔒</div>
        <div style={s.lockedTitle}>AI-avustaja</div>
        <div style={s.lockedText}>Saatavilla Pro-käyttäjille</div>
        <button style={s.upgradeBtn}>Päivitä Pro:hun →</button>
      </div>
    )
  }

  return (
    <div style={s.panel}>

      {/* Otsikkorivi */}
      <div style={s.header}>
        <div style={s.title}>
          🤖 AI-avustaja
          <span style={s.badge}>Pro</span>
        </div>
        <button onClick={clearChat} style={s.clearBtn} title="Tyhjennä keskustelu">↺</button>
      </div>

      {/* Viestit */}
      <div style={s.messages}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ ...s.msgRow, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
            <div style={{
              ...s.avatar,
              background: msg.role === 'ai' ? '#534AB720' : `${COLORS.brand.primaryLight}`,
              color:      msg.role === 'ai' ? '#7F77DD'   : COLORS.brand.primary,
            }}>
              {msg.role === 'ai' ? 'AI' : 'V'}
            </div>
            <div style={{ maxWidth: '85%' }}>
              <div style={{
                ...s.bubble,
                background:  msg.role === 'ai' ? COLORS.bg.secondary : COLORS.brand.primaryLight,
                borderColor: msg.role === 'ai' ? COLORS.bg.border    : `${COLORS.brand.primary}40`,
                color:       msg.role === 'ai' ? COLORS.text.primary  : COLORS.brand.primary,
                whiteSpace:  'pre-line',
              }}>
                {msg.text}
                {msg.tip && (
                  <div style={s.tip}>💡 {msg.tip}</div>
                )}
              </div>

              {/* Hyväksy / hylkää -napit */}
              {msg.type === 'elements' && pendingElements && (
                <div style={s.actions}>
                  <button onClick={approveElements} style={s.approveBtn}>✓ Lisää kentälle</button>
                  <button onClick={rejectElements}  style={s.rejectBtn}>Hylkää</button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Latausanimaatio */}
        {loading && (
          <div style={s.msgRow}>
            <div style={{ ...s.avatar, background: '#534AB720', color: '#7F77DD' }}>AI</div>
            <div style={{ ...s.bubble, background: COLORS.bg.secondary, borderColor: COLORS.bg.border, display: 'flex', gap: 4 }}>
              {[0, 0.2, 0.4].map((delay, i) => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#7F77DD',
                  animation: `aiBounce 1.2s ${delay}s ease-in-out infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Pikaehdotukset */}
      <div style={s.suggestions}>
        {SUGGESTIONS.map((suggestion, i) => (
          <button
            key={i}
            style={s.chip}
            onClick={() => sendMessage(suggestion)}
            disabled={loading}
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Syöttökenttä */}
      <div style={s.inputArea}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Kuvaile harjoite..."
          style={s.input}
          rows={2}
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{ ...s.sendBtn, opacity: loading || !input.trim() ? 0.4 : 1 }}
        >
          →
        </button>
      </div>
    </div>
  )
}

const s = {
  panel: {
    display: 'flex', flexDirection: 'column', height: '100%',
    background: COLORS.bg.primary,
  },
  header: {
    padding: '12px 14px',
    borderBottom: `0.5px solid ${COLORS.bg.border}`,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  title: {
    fontSize: 13, fontWeight: 500, color: COLORS.text.primary,
    display: 'flex', alignItems: 'center', gap: 6,
  },
  badge: {
    fontSize: 9, padding: '2px 6px', borderRadius: 4,
    background: '#534AB720', color: '#7F77DD',
  },
  clearBtn: {
    background: 'transparent', border: 'none',
    color: COLORS.text.secondary, cursor: 'pointer', fontSize: 16,
  },
  messages: {
    flex: 1, padding: 12, overflowY: 'auto',
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  msgRow: {
    display: 'flex', gap: 8, alignItems: 'flex-start',
  },
  avatar: {
    width: 24, height: 24, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 10, fontWeight: 500, flexShrink: 0,
  },
  bubble: {
    padding: '8px 10px', borderRadius: 8,
    fontSize: 12, lineHeight: 1.5,
    border: '0.5px solid',
  },
  tip: {
    marginTop: 6, padding: '6px 8px',
    background: '#534AB720', borderRadius: 5,
    fontSize: 11, color: '#7F77DD',
  },
  actions: { display: 'flex', gap: 4, marginTop: 6 },
  approveBtn: {
    fontSize: 11, padding: '4px 10px', borderRadius: 5,
    background: COLORS.brand.primary, color: '#fff',
    border: 'none', cursor: 'pointer', fontWeight: 500,
  },
  rejectBtn: {
    fontSize: 11, padding: '4px 10px', borderRadius: 5,
    background: 'transparent', color: COLORS.text.secondary,
    border: `0.5px solid ${COLORS.bg.border}`, cursor: 'pointer',
  },
  suggestions: {
    padding: '6px 12px', borderTop: `0.5px solid ${COLORS.bg.border}`,
    display: 'flex', flexDirection: 'column', gap: 3,
  },
  chip: {
    fontSize: 11, padding: '4px 8px', borderRadius: 6,
    background: COLORS.bg.secondary, border: `0.5px solid ${COLORS.bg.border}`,
    color: COLORS.text.secondary, cursor: 'pointer',
    textAlign: 'left', fontFamily: 'inherit',
  },
  inputArea: {
    padding: '10px 12px', borderTop: `0.5px solid ${COLORS.bg.border}`,
    display: 'flex', gap: 6, alignItems: 'flex-end',
  },
  input: {
    flex: 1, background: COLORS.bg.secondary,
    border: `0.5px solid ${COLORS.bg.border}`,
    borderRadius: 8, padding: '8px 10px',
    color: COLORS.text.primary, fontSize: 12,
    fontFamily: 'inherit', resize: 'none', outline: 'none',
  },
  sendBtn: {
    width: 32, height: 32, borderRadius: 7,
    background: '#534AB7', border: 'none',
    color: '#fff', cursor: 'pointer', fontSize: 16, flexShrink: 0,
  },
  locked: {
    padding: 24, display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 8, textAlign: 'center',
  },
  lockedTitle: { fontSize: 14, fontWeight: 500, color: COLORS.text.primary },
  lockedText:  { fontSize: 12, color: COLORS.text.secondary },
  upgradeBtn: {
    fontSize: 12, padding: '8px 16px', borderRadius: 8,
    background: COLORS.brand.primary, color: '#fff',
    border: 'none', cursor: 'pointer', fontWeight: 500, marginTop: 8,
  },
}
