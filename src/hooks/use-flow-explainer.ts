import { useCallback } from "react";
import { useFlowLearning } from "@/hooks/use-flow-learning";
import { benefitVoice, explainerVoice, type ExplainerTopic } from "@/lib/flow-tone";

/**
 * Gradvis förklarande copy baserad på Flows befintliga learning level.
 * Nya användare får hela förklaringen, vana användare får ingen alls.
 */
export function useFlowExplainer() {
  const { level, insights } = useFlowLearning();
  const count = insights.length;

  const explain = useCallback(
    (topic: ExplainerTopic) => explainerVoice(topic, level, count),
    [level, count],
  );

  const benefit = useCallback(() => benefitVoice(level, count), [level, count]);

  return { explain, benefit, level, insightCount: count };
}
