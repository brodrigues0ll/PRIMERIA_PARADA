"use client";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";

export default function Providers({ children }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        theme="dark"
        position="bottom-center"
        toastOptions={{
          classNames: {
            toast: "bg-card border border-border text-foreground",
            title: "text-foreground font-medium",
            description: "text-muted-foreground",
          },
        }}
      />
    </SessionProvider>
  );
}
