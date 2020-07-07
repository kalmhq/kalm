import React from "react";
import { BaseLineChart, BaseLineChartProps } from "widgets/charts/baseLIneChart";
import { humanFileSize } from "utils/sizeConv";

export const HttpBytesSizeChart = (props: BaseLineChartProps) => {
  for (let i = 0; i < props.data.length; i++) {
    switch (props.data[i].legend) {
      case "request": {
        props.data[i].borderColor = "rgba(33, 150, 243, 1)";
        props.data[i].backgroundColor = "rgba(33, 150, 243, 0.5)";
        break;
      }
      case "response": {
        props.data[i].borderColor = "#ffc107";
        props.data[i].backgroundColor = "rgba(255, 193, 7, 0.5)";
        break;
      }
    }
  }
  return <BaseLineChart fill formatYAxesValue={humanFileSize} {...props} />;
};
