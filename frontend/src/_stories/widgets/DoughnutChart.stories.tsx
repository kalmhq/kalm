import React from "react";
import { storiesOf } from "@storybook/react";
import { DoughnutChart } from "widgets/DoughnutChart";

storiesOf("Widgets/DoughnutChart", module)
  .add("Has data", () => {
    return <DoughnutChart title={"Pods"} labels={["Running", "Pending", "Error"]} data={[1, 1, 1]} />;
  })
  .add("No data", () => {
    return <DoughnutChart title={"Pods"} labels={["Running", "Pending", "Error"]} data={[0, 0, 0]} />;
  })
  .add("Empty state", () => {
    return <DoughnutChart title={"Pods"} labels={["Running", "Pending", "Error"]} data={[0, 0, 0]} />;
  });
