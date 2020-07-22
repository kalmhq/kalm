import React from "react";
import { BaseLineChart, BaseLineChartProps } from "widgets/charts/baseLIneChart";

export const HttpStatusCodeLineChart = (props: BaseLineChartProps) => {
  for (let i = 0; i < props.data.length; i++) {
    switch (props.data[i].legend) {
      case "2xx": {
        props.data[i].borderColor = "#4caf50";
        props.data[i].backgroundColor = "rgba(76, 175, 80, 0.5)";
        break;
      }
      case "4xx": {
        props.data[i].borderColor = "#ffc107";
        props.data[i].backgroundColor = "rgba(255, 193, 7, 0.5)";
        break;
      }
      case "5xx": {
        props.data[i].borderColor = "#f44336";
        props.data[i].backgroundColor = "rgba(255, 67, 54, 0.5)";
        break;
      }
    }
  }
  return <BaseLineChart fill={false} {...props} yAxesWidth={80} />;
};
