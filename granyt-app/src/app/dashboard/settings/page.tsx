"use client";

import { useDocumentTitle } from "@/lib/use-document-title";
import { useSettingsPage } from "./_hooks";
import { SettingsContent } from "./_components";

export default function SettingsPage() {
  useDocumentTitle("Settings");
  const pageData = useSettingsPage();

  return <SettingsContent {...pageData} />;
}
