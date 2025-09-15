/**
 * Filens syfte:
 *
 * Denna fil innehåller `TabList`-komponenten.
 * - Används som container för flera `TabButton`-komponenter.
 * - Lägger tabbarna i en horisontell rad med jämnt mellanrum.
 * - Har rollen `tablist` för bättre tillgänglighet.
 */

import type { PropsWithChildren } from "react";

/**
 * TabList
 * En wrapper för tabbar som grupperar `TabButton`-komponenter.
 */
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