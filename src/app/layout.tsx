import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "WikiCiv — collaborative Minecraft civilization lore",
  description:
    "An open, collaborative lore archive for Minecraft civilization events. Every telling has a home.",
};

// Set the theme before first paint to avoid a flash of the wrong mode.
const themeScript = `(function(){try{var t=localStorage.getItem('wikiciv-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Header user={user} />
        <main className="site-main">{children}</main>
        <footer className="site-footer">
          <div className="footer-inner">
            <span className="footer-cube" aria-hidden />
            <p>
              <strong>WikiCiv</strong> — every telling has a home. The archive
              documents and attributes lore; it never rules on which version is
              true.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
