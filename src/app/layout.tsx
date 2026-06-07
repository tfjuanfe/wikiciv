import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "WikiCiv | Minecraft civilization lore archive",
  description:
    "A community archive of Minecraft civilization roleplay events: the nations, wars, characters, and places that players create.",
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
              <strong>WikiCiv</strong> is a community-run archive for Minecraft
              civilization events. Records hold the documented facts; Accounts
              hold the stories players tell.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
