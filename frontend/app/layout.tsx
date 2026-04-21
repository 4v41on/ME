import type { Metadata } from "next";
import { JetBrains_Mono, Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { OnboardingFlow } from "@/app/components/onboarding/OnboardingFlow";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "ME",
  description: "Sistema de memoria y asistente personal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable} h-full`}
    >
      <body className="min-h-full bg-[#050508] text-[#F0F0F5] antialiased">
        <OnboardingFlow>{children}</OnboardingFlow>
      </body>
    </html>
  );
}
