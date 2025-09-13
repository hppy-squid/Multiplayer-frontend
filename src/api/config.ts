
export const API_BASE = import.meta.env.VITE_API_BASE ?? "";
export const USE_BACKEND = API_BASE.length > 0;
export const IS_DEV = import.meta.env.DEV;


export const TEST_CODE = (import.meta.env.VITE_TEST_LOBBY_CODE as string) || "123456";