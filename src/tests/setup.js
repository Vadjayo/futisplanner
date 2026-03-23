// Testiympäristön alustus — ladataan ennen jokaista testitiedostoa
// Tuo jest-dom matcherit (toBeInTheDocument, toHaveValue, jne.)

import React from 'react'
import '@testing-library/jest-dom'

// Aseta React globaaliksi jotta JSX toimii kaikissa testikomponenteissa
// (tarvitaan koska vitest ei aina sovella automaattista JSX-transformia)
global.React = React
