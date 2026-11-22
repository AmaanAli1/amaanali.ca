import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./mobile.css";
import Transitions from "./transitions";

const title = "Amaan Ali · CS Portfolio";
const description =
  "Fourth-year Computer Science student at Wilfrid Laurier University. I build and test end-to-end applications. Open to technical internships and full-time roles.";

export const metadata: Metadata = {
  metadataBase: new URL("https://amaanali.ca"),
  title: { default: title, template: "%s · Amaan Ali" },
  description,
  openGraph: { title, description, url: "https://amaanali.ca", siteName: "Amaan Ali", images: ["/og.png"], type: "website" },
  twitter: { card: "summary_large_image", title, description, images: ["/og.png"] },
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = { themeColor: "#101010" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        {/* Case studies follow the home page's theme: set it before the first paint so there's no dark flash */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(location.pathname.indexOf('/projects/')===0&&localStorage.getItem('theme')==='light'){document.documentElement.classList.add('cs-light')}}catch(e){}",
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..700&family=Hanken+Grotesk:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>
        <Transitions />
        {children}
      </body>
    </html>
  );
}
