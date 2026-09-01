import FlowView from "@/components/flow/flow-view";

export default function Assistant({ chatId }: { chatId?: string }) {
  return <FlowView initialTab="chatt" chatId={chatId} />;
}
