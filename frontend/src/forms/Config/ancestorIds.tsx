import React from "react";
import Cascader from "antd/es/cascader";
import "antd/es/cascader/style/css";
import { FilledTextFieldProps } from "@material-ui/core/TextField";
import { WrappedFieldProps } from "redux-form";
import { Field } from "redux-form/immutable";
import { getCascaderOptions, getAncestorIdsDefaultValue } from "../../selectors/config";
import Immutable from "immutable";

const displayRender = (labels: any, selectedOptions: any) => {
  return labels.map((label: any, i: any) => {
    const option = selectedOptions[i];
    if (label === "/") {
      return <span key={option.value}>/ </span>;
    }
    return <span key={option.value}>{label} / </span>;
  });
};

const renderAncestorIds = ({ input }: FilledTextFieldProps & WrappedFieldProps) => {
  return (
    <Cascader
      options={getCascaderOptions()}
      defaultValue={getAncestorIdsDefaultValue()}
      displayRender={displayRender}
      style={{ width: "100%" }}
      allowClear={false}
      changeOnSelect={true}
      // onCreate={() => input.onChange(getCascaderDefaultValue())}
      onChange={(value: string[]) => {
        input.onChange(Immutable.fromJS(value));
      }}>
      {/* <input /> */}
    </Cascader>
  );
};

export const AncestorIds = (props: any) => {
  return <Field name="ancestorIds" component={renderAncestorIds} />;
};
