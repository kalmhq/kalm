import React from "react";
import { InfoBox } from "../../widgets/InfoBox";
export default {
  title: "Widgets/InfoBox",
  component: InfoBox,
};

export const Basic = () => <InfoBox title="Private Registry" options={[]} guideLink="google.com"></InfoBox>;
