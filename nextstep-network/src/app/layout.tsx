import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getViewer } from "@/lib/auth";
import { getSetting } from "@/lib/queries";
import { Footer, PublicNav, TopNav } from "@/components/nav";
import { AiAdvisor } from "@/components/ai-advisor";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: { default: "NextStep Network — Connect. Learn. Apply. Succeed.", template: "%s · NextStep Network" },
  description: "The student education & career network. Build a professional profile, find colleges and scholarships, track applications and FAFSA progress, and discover internships.",
  openGraph: { siteName: "NextStep Network", type: "website" },
};

export const viewport: Viewport = { themeColor: "#11213B", width: "device-width", initialScale: 1 };

// Applies the saved or system theme before paint to avoid a flash.
const themeScript = `try{var t=localStorage.getItem('ns-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  const announcement = await getSetting("announcement");
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-surface focus:px-3 focus:py-2">Skip to content</a>
        {viewer ? <TopNav user={viewer.user} profile={viewer.profile} /> : <PublicNav />}
        {announcement && (
          <div className="no-print border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">{announcement}</div>
        )}
        <main id="main" className="pb-20 lg:pb-0">{children}</main>
        <Footer />
        {viewer && <AiAdvisor />}
      </body>
    </html>
  );
}
