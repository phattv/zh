import { ColorSchemeScript } from "@mantine/core";
import "@mantine/core/styles.css";
import { type Metadata, type Viewport } from "next";
import { Noto_Serif_SC, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ZhProviders } from "./providers";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const notoSerifSC = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-noto-serif-sc",
  display: "swap",
  preload: false, // CJK fonts are large — lazy-load instead
});

export const metadata: Metadata = {
  title: "汉语 · Hànyǔ",
  description:
    "Search and learn Chinese words with pinyin, meanings, and Sino-Vietnamese equivalents",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

function Body({ children }: React.PropsWithChildren<object>): JSX.Element {
  return <ZhProviders>{children}</ZhProviders>;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html
      lang="zh"
      className={`${plusJakarta.variable} ${notoSerifSC.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
        {/* Apply stored display-size preference before first paint to prevent FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('zh-display-size'),m={small:'14px',medium:'16px',large:'18px'};document.documentElement.style.fontSize=m[s]||'16px';}catch(e){}})();`,
          }}
        />
      </head>
      <body className={plusJakarta.className}>
        <div className="zh-frame-outer">
          <div className="zh-app-shell">
            <Body>{children}</Body>
          </div>
        </div>
      </body>
    </html>
  );
}
