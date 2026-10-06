import { createFileRoute } from "@tanstack/react-router";
import { ResolveUApp } from "@/resolveu/App";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ResolveU – University Complaint Portal" },
      { name: "description", content: "Submit, track and escalate university complaints from your phone." },
      { property: "og:title", content: "ResolveU – University Complaint Portal" },
      { property: "og:description", content: "Submit, track and escalate university complaints from your phone." },
    ],
  }),
  component: ResolveUApp,
});
