"use client";

import { useDocumentTitle } from "@/lib/use-document-title";
import { SettingsProvider } from "./_context";
import { SettingsContent } from "./_components";

export default function SettingsPage() {
  useDocumentTitle("Settings");

  return (
    <SettingsProvider>
      <SettingsContent />
    </SettingsProvider>
  );
}
