import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ReduxProvider from "@/store/ReduxProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RAG Chat Assistant | Advanced PDF Q&A",
  description: "An intelligent retrieval-augmented generation chat assistant to analyze, query, and search through your PDF and text documents in real-time.",
  keywords: ["RAG", "Chatbot", "LangGraph", "FastAPI", "PDF Ingestion", "Vector Search", "Gemini"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="h-full bg-slate-950 text-slate-100 selection:bg-brand-violet/30 selection:text-brand-purple">
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
