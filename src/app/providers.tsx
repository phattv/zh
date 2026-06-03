"use client";

import { localStorageColorSchemeManager, MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { cssVariablesResolver, theme } from "./theme";

const colorSchemeManager = localStorageColorSchemeManager({ key: "zh_theme" });

// +-----------+
// | PROVIDERS |
// +-----------+

function ZhProviders({ children }: { children: React.ReactNode }): JSX.Element {
  // QueryClient in state so it's not recreated on hot reload
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      defaultColorScheme="light"
      colorSchemeManager={colorSchemeManager}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </MantineProvider>
  );
}

export { ZhProviders };
