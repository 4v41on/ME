import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { OnboardingFlow } from "@/app/components/onboarding/OnboardingFlow";
import { SphereProvider } from "@/app/context/SphereContext";
import { CustomCursor } from "@/app/components/ui/CustomCursor";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "𒈨 ME",
  description: "Sistema de memoria personal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="h-full bg-black text-[#fafafa] antialiased overflow-hidden">
        <SphereProvider>
          <CustomCursor />
          <OnboardingFlow>{children}</OnboardingFlow>
        </SphereProvider>
      </body>
    </html>
  );
}
