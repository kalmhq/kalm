import { FilledTextFieldProps } from "@material-ui/core/TextField";
import Cascader from "antd/es/cascader";
import "antd/es/cascader/style/css";
import React from "react";
import { WrappedFieldProps } from "redux-form";
import { Field } from "redux-form/immutable";
import { pathToAncestorIds } from "../../actions/config";
import { getCascaderOptions } from "../../selectors/config";

const displayRender = (labels: any, selectedOptions: any) => {
  return labels.map((label: any, i: any) => {
    const option = selectedOptions[i];
    if (label === "/") {
      return <span key={option.value}></span>;
    }
    return <span key={option.value}>/ {label} </span>;
  });
};

const renderKappConfigPath = ({ input }: FilledTextFieldProps & WrappedFieldProps) => {
  let defaultValue;
  if (input.value) {
    const ancestorIds = pathToAncestorIds(input.value);
    const splits = input.value.split("/");
    const configName = splits[splits.length - 1];
    ancestorIds.push(configName);
    defaultValue = ancestorIds;
  }

  return (
    <Cascader
      placeholder="Kapp Config Path"
      options={getCascaderOptions(false)}
      displayRender={displayRender}
      style={{ width: "100%" }}
      allowClear={false}
      // showSearch={true}
      // changeOnSelect={true}
      defaultValue={defaultValue}
      onChange={(value: string[]) => {
        let path = "";
        for (let i = 1; i <= value.length - 1; i++) {
          path = path + "/" + value[i];
        }
        console.log("value", value);
        console.log("path", path);
        input.onChange(path);
      }}>
      {/* <input /> */}
    </Cascader>
  );
};

export const KappConfigPath = (props: any) => {
  return <Field name="kappConfigPath" component={renderKappConfigPath} />;
};
