"use client";

import { localStorageColorSchemeManager, MantineProvider } from "@mantine/core";
import { cssVariablesResolver, theme } from "./theme";

const colorSchemeManager = localStorageColorSchemeManager({ key: "zh_theme" });

function ZhProviders({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      defaultColorScheme="dark"
      colorSchemeManager={colorSchemeManager}
    >
      {children}
    </MantineProvider>
  );
}

export { ZhProviders };
