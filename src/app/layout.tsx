import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { userCache, cacheKeys } from "@/lib/cache";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StreamHub",
  description:
    "Tu plataforma de confianza para cuentas de streaming premium. Accede a Netflix, Disney+, HBO Max y más.",
  keywords: [
    "StreamHub",
    "Streaming",
    "Netflix",
    "Disney+",
    "HBO Max",
    "Cuentas Premium",
  ],
  authors: [{ name: "StreamHub Team" }],
  icons: {
    icon: "/logoS.png",
  },
  openGraph: {
    title: "StreamHub",
    description: "Tu plataforma de confianza para cuentas de streaming premium",
    url: "https://streamhub.com",
    siteName: "StreamHub",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "StreamHub",
    description: "Tu plataforma de confianza para cuentas de streaming premium",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  if (session?.user?.email) {
    const cacheKey = cacheKeys.userByEmail(session.user.email);
    let user = userCache.get(cacheKey);

    if (!user) {
      user = await db.user.findUnique({
        where: { email: session.user.email },
      });

      if (user) {
        userCache.set(cacheKey, user);
      }
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster
          position="top-center"
          expand={false}
          richColors
          closeButton={false}
          theme="dark"
          toastOptions={{
            style: {
              /*  background:
                "linear-gradient(135deg, rgba(139, 92, 246, 0.85) 0%, rgba(236, 72, 153, 0.85) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.3)", */
              borderRadius: "12px",
              padding: "16px 20px",
              margin: "8px",
              backdropFilter: "blur(12px)",
              color: "#ffffff",
              fontSize: "15px",
              fontWeight: "600",
              boxShadow:
                "0 6px 24px rgba(139, 92, 246, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)",
              minWidth: "320px",
              maxWidth: "520px",
            },
            className: "vibrant-toast",
          }}
        />
      </body>
    </html>
  );
}
