import { createFileRoute } from "@tanstack/react-router";
import SysmartApp from "@/components/sysmart/App";

export const Route = createFileRoute("/")({
  component: SysmartApp,
  head: () => ({
    meta: [
      { title: "sysMART — Smart Supermarket Assistant" },
      { name: "description", content: "Unified indoor and outdoor supermarket experience: navigation, checkout, food tracking, and more." },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
    ],
  }),
});
