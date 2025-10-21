import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { ThemeProvider } from "next-themes";
import { GlobalState } from "@/components/utility/global-state";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Wessley AI",
  description: "AI-assisted project-car companion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Keania+One&family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className={`${poppins.variable} ${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <GlobalState>
            {/* Full screen backgrounds behind everything */}
            <div 
              className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
              style={{
                backgroundImage: 'url(/background-light.png)'
              }}
            />
            <div 
              className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-0 dark:opacity-100 transition-opacity duration-300 z-0"
              style={{
                backgroundImage: 'url(/background-dark.png)'
              }}
            />
            
            {/* All content above backgrounds */}
            <div className="relative z-10">
              <AppShell>{children}</AppShell>
            </div>
          </GlobalState>
        </ThemeProvider>
      </body>
    </html>
  );
}
