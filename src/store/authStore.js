/**
 * authStore.js
 * Autentikointitila Zustand-storessa. Toteutetaan kun Zustand lisätään Vaiheessa 3.
 *
 * Tällä hetkellä autentikointi hoidetaan useAuth-hookissa Supabasen
 * onAuthStateChange-kuuntelijalla. Store korvaa sen kun siirrytään
 * yhtenäiseen tilarakenteeseen.
 *
 * Suunniteltu rajapinta:
 *   authStore.user          — kirjautunut käyttäjä tai null
 *   authStore.loading        — istunnon tarkistus kesken
 *   authStore.signIn(email, password)
 *   authStore.signOut()
 *   authStore.signUp(email, password, name)
 */

// TODO: Ota Zustand käyttöön ja siirrä useAuth-hookin logiikka tähän
// import { create } from 'zustand'

// Väliaikainen vienti — korvaa oikealla storella Vaiheessa 3
export const authStore = null
