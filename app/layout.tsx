import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "A premium brand focused on quality, comfort, and design",
  description:
    "YELLOW exists to deliver premium-quality and contemporary designs for style-conscious urbanites.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${poppins.variable} h-full`}
    >
      <body className="flex min-h-full flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
