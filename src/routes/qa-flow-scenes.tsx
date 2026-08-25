import { createFileRoute } from "@tanstack/react-router";
import { FlowCharacter, type FlowScene } from "@/components/flow/flow-character";

export const Route = createFileRoute("/qa-flow-scenes")({
  ssr: false,
  component: () => {
    const params = new URLSearchParams(window.location.search);
    const scene = (params.get("scene") ?? "rain") as FlowScene;
    const energy = Number(params.get("energy") ?? 60);
    const seed = Number(params.get("seed") ?? 0);
    return (
      <div className="p-4">
        <p className="text-center text-xs">{scene}</p>
        <FlowCharacter scene={scene} seed={seed} energy={energy} />
      </div>
    );
  },
});
