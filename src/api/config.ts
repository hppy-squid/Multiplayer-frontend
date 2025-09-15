/**
 * Filens syfte:
 * 
 * Den här filen är till för att samla konfiguration som frontend behöver för att veta:
 * - om den ska prata med backend
 * - vilken adress backend har
 * - om appen körs i utvecklingsläge
 * - lite testdata
 */

// API_BASE hämtar adressen till backend från miljövariabeln VITE_API_BASE
// Om den inte är satt används en tom sträng.
// .replace(/\/$/, "") tar bort ett eventuellt "/" på slutet så vi får en ren adress.
export const API_BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");

// USE_BACKEND blir true om API_BASE inte är tom.
// Detta användes för att skilja på "frontend utan backend" och "frontend med backend".
export const USE_BACKEND = API_BASE.length > 0;

// IS_DEV är true när vi kör i utvecklingsläge (npm run dev),
// annars false när appen är byggd för produktion.
export const IS_DEV = import.meta.env.DEV;

// TEST_CODE används för att hämta en testkod från miljövariabeln VITE_TEST_LOBBY_CODE.
// Om ingen variabel är satt används standardvärdet "123456".
export const TEST_CODE = (import.meta.env.VITE_TEST_LOBBY_CODE as string) || "123456";

// Skriver ut inställningarna i konsolen när appen startar.
// Praktiskt för att kontrollera att rätt API_BASE används.
console.log("API_BASE", API_BASE, "USE_BACKEND", USE_BACKEND);