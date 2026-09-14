import React from "react";
import { useCurrentFrame } from "remotion";
import { ProductFrame } from "../theme";

export const QuickFlowScene: React.FC = () => {
  const frame = useCurrentFrame();
  return <ProductFrame src="demo/myflove-demo-quickflow.jpg" frame={frame} duration={165} />;
};
