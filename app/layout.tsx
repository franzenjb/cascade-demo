import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cascade County Emergency Mapping Demo",
  description:
    "A working demo of conversational, anticipatory emergency mapping. Companion to 'Before You Even Ask' by Jeff Franzen.",
};

const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('cascade-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var useDark = stored ? stored === 'dark' : prefersDark;
    if (useDark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
