import type { Metadata } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";
import AuthSessionProvider from "@/components/auth/session-provider";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  display: "swap",
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Work Hours Tracker",
  description: "Employee time tracking with admin oversight using Next.js, Prisma, and NextAuth.",
  icons: {
    icon: [
      { url: "/logo40.png", type: "image/png" },
      { url: "/logo40.svg", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${roboto.variable} ${robotoMono.variable} min-h-screen bg-slate-50 text-slate-900 antialiased`}
      >
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
