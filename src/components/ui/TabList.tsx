/******************************************************
 * UI-komponent: TabList
 * Wrapper som grupperar tabbar i en horisontell rad
 ******************************************************/

import type { PropsWithChildren } from "react";


export function TabList({ children }: PropsWithChildren) {
  return (
    <div
      className="flex gap-2 bg-gray-100 p-1 rounded-full mb-6"
      role="tablist"
      aria-label="Lobby tabs"
    >
      {children}
    </div>
  );
}