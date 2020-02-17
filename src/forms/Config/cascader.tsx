import React from "react";
import ReactDOM from "react-dom";
import Cascader from "antd/es/cascader";
import "antd/es/cascader/style/css";
import { FilledTextFieldProps } from "@material-ui/core/TextField";
import { WrappedFieldProps, BaseFieldProps } from "redux-form";
import { Field } from "redux-form/immutable";

const options = [
  {
    value: "zhejiang",
    label: "Zhejiang",
    children: [
      {
        value: "hangzhou",
        label: "Hangzhou",
        children: [
          {
            value: "xihu",
            label: "West Lakex"
          }
        ]
      }
    ]
  },
  {
    value: "jiangsu",
    label: "Jiangsu",
    children: [
      {
        value: "nanjing",
        label: "Nanjing",
        children: [
          {
            value: "zhonghuamen",
            label: "Zhong Hua Men"
          }
        ]
      }
    ]
  }
];

const displayRender = (labels: any, selectedOptions: any) => {
  return labels.map((label: any, i: any) => {
    const option = selectedOptions[i];
    // if (i === labels.length - 1) {
    //   return <span key={option.value}>{label}</span>;
    // }
    return <span key={option.value}>{label} / </span>;
  });
};

const renderCascader = ({
  input
}: FilledTextFieldProps & WrappedFieldProps) => {
  return (
    <Cascader
      options={options}
      defaultValue={["zhejiang", "hangzhou", "xihu"]}
      displayRender={displayRender}
      style={{ width: "100%" }}
      allowClear={false}
    />
  );
};

export const CustomCascader = (props: any) => {
  return <Field name="path" component={renderCascader} />;
};
