import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/oauth/kalender-retur")({
  component: OAuthReturn,
  head: () => ({
    meta: [
      { property: "og:title", content: "Kopplar kalendern – MyFlove" },
      { property: "og:description", content: "Avslutar kopplingen mellan MyFlove och din kalender." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Kopplar kalendern – MyFlove" },
      { name: "description", content: "Avslutar kopplingen mellan MyFlove och din kalender." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function OAuthReturn() {
  const [message, setMessage] = useState("Avslutar kopplingen …");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const notify = (
      type: "appUserConnectorOAuthComplete" | "appUserConnectorOAuthFailed",
      code?: string,
    ) => {
      window.opener?.postMessage(
        { type, connectorId: params.get("connector_id") ?? null, code: code ?? null },
        window.location.origin,
      );
      window.close();
    };

    if (params.get("success") !== "true") {
      setMessage(params.get("error") ?? "Kopplingen blev inte klar.");
      notify("appUserConnectorOAuthFailed");
      return;
    }
    const code = params.get("code");
    if (!code) {
      if (params.get("offline_access_allowed") === "false") {
        notify("appUserConnectorOAuthComplete");
        return;
      }
      setMessage("Kopplingen blev inte klar.");
      notify("appUserConnectorOAuthFailed");
      return;
    }
    notify("appUserConnectorOAuthComplete", code);
  }, []);

  return <p style={{ fontFamily: "system-ui", padding: "2rem" }}>{message}</p>;
}
