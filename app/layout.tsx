import type { Metadata } from "next";
import { defaultShopSettings } from "@/lib/demo/seed";
import { DemoBranding } from "@/components/DemoBranding";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export function generateMetadata(): Metadata {
  const settings = defaultShopSettings;
  return {
    title: settings.name,
    description: settings.tagline,
    icons: { icon: settings.icon },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${poppins.variable} h-full`}
    >
      <body className="flex min-h-full flex-col antialiased">
        <DemoBranding />
        {children}
      </body>
    </html>
  );
}
