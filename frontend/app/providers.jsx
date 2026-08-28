"use client";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "@/components/ui/sonner";

function ToasterWithTheme() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      theme={resolvedTheme}
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast: "bg-card border border-border text-foreground",
          title: "text-foreground font-medium",
          description: "text-muted-foreground",
        },
      }}
    />
  );
}

export default function Providers({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <SessionProvider>
        {children}
        <ToasterWithTheme />
      </SessionProvider>
    </ThemeProvider>
  );
}
