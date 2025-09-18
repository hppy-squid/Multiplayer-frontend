/******************************************************
 * Generella konfig inställningar (REST)
 * Talar om hur frontend ska prata med backend.
 ******************************************************/

// API_BASE hämtar adressen till backend från miljövariabeln VITE_API_BASE
export const API_BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");

// USE_BACKEND blir true om API_BASE inte är tom.
// Detta användes för att skilja på "frontend utan backend" och "frontend med backend".
export const USE_BACKEND = API_BASE.length > 0;

// IS_DEV är true när vi kör i utvecklingsläge (npm run dev)
export const IS_DEV = import.meta.env.DEV;



// Kontroll att rätt API_BASE används.
console.log("API_BASE", API_BASE, "USE_BACKEND", USE_BACKEND);