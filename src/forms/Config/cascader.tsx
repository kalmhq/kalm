import React from "react";
import ReactDOM from "react-dom";
import Cascader from "antd/es/cascader";
import "antd/es/cascader/style/css";
import { FilledTextFieldProps } from "@material-ui/core/TextField";
import { WrappedFieldProps, BaseFieldProps } from "redux-form";
import { Field } from "redux-form/immutable";
import {
  getCascaderOptions,
  getCascaderDefaultValue
} from "../../selectors/config";

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
      options={getCascaderOptions()}
      defaultValue={getCascaderDefaultValue()}
      displayRender={displayRender}
      style={{ width: "100%" }}
      allowClear={false}
      changeOnSelect={true}
      // onCreate={() => input.onChange(getCascaderDefaultValue())}
      onChange={(value: string[]) => {
        input.onChange(value);
      }}
    />
  );
};

export const CustomCascader = (props: any) => {
  return <Field name="folders" component={renderCascader} />;
};
