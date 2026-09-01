"use client";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react";

function ErrorIcon() {
  return (
    <div className="flex-shrink-0 h-5 w-5 rounded-full bg-destructive flex items-center justify-center">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M2 2L8 8M8 2L2 8" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function SuccessIcon() {
  return <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />;
}

function WarningIcon() {
  return <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />;
}

function InfoIcon() {
  return <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />;
}

function ToasterWithTheme() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      theme={resolvedTheme}
      position="top-right"
      gap={8}
      icons={{
        error: <ErrorIcon />,
        success: <SuccessIcon />,
        warning: <WarningIcon />,
        info: <InfoIcon />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "!bg-card !border !border-border !text-foreground !shadow-lg !rounded-xl !px-4 !py-3",
          title: "!text-foreground !font-semibold !text-sm",
          description: "!text-muted-foreground !text-xs !mt-0.5",
          error: "!border-destructive/30",
          success: "!border-emerald-500/30",
          warning: "!border-amber-500/30",
          info: "!border-blue-500/30",
          icon: "!mt-0",
        },
        duration: 3500,
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
