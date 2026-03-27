import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers"; // Adjust path if needed
import { ToastProvider } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import '@rainbow-me/rainbowkit/styles.css';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "dChat | Secure Web3 Messaging",
  description: "Secure, encrypted, wallet-to-wallet messaging powered by XMTP.",
  keywords: ["web3", "messaging", "crypto", "blockchain", "secure chat", "XMTP"],
  authors: [{ name: "github.com/Swadesh-c0de" }],
  openGraph: {
    title: "dChat | Secure Web3 Messaging",
    description: "The next generation of secure, wallet-managed communication.",
    url: "https://d-chatapp.vercel.app",
    siteName: "dChat",
    images: [
      {
        url: "/dChat-dark.svg",
        width: 800,
        height: 600,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "dChat | Secure Web3 Messaging",
    description: "Secure, encrypted, wallet-to-wallet messaging.",
    images: ["/dChat-dark.svg"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/dChat-dark.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <Providers>
          <ToastProvider>
            {children}
            <Toaster />
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
