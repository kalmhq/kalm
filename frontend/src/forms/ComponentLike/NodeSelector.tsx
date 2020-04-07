import React from "react";
import { FilledTextFieldProps } from "@material-ui/core/TextField";
import { WrappedFieldProps } from "redux-form";
import { Field } from "redux-form/immutable";
import Immutable from "immutable";
import { FormControl, InputLabel, Select, MenuItem, Chip } from "@material-ui/core";
import {
  NodeSelectorLabels,
  PodAffinityTypePreferFanout,
  PodAffinityTypePreferGather
} from "../../types/componentTemplate";
import { RenderSelectField } from "../Basic";

interface Props {
  nodeLabels: Immutable.List<string>;
}

const renderSelectLabels = ({ input, nodeLabels }: FilledTextFieldProps & WrappedFieldProps & Props) => {
  const defaultValue: string[] = [];
  const inputValue = input.value as NodeSelectorLabels;

  if (inputValue) {
    inputValue.forEach((v, k) => {
      defaultValue.push(`${k}:${v}`);
    });
  }

  const inputLabel = "Node Selector Labels";
  return (
    <FormControl variant="outlined" size="small" margin="normal" style={{ width: "100%" }}>
      <InputLabel id="node-labels">{inputLabel}</InputLabel>
      <Select
        label={inputLabel}
        multiple={true}
        // multiline={true}
        onChange={(event: any) => {
          const value = event.target.value as string[];

          let nodeSelectorLabels = Immutable.OrderedMap({});

          value.forEach(nodeLabel => {
            const kv = nodeLabel.split(":");

            nodeSelectorLabels = nodeSelectorLabels.set(kv[0], kv[1]);
          });

          input.onChange(nodeSelectorLabels);
        }}
        defaultValue={defaultValue}
        // @ts-ignore
        renderValue={(selected: string[]) => (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap"
            }}>
            {selected.map(value => (
              <Chip key={value} label={value} style={{ margin: 2 }} />
            ))}
          </div>
        )}>
        {nodeLabels &&
          nodeLabels.map(label => {
            return (
              <MenuItem key={label} value={label}>
                {label}
              </MenuItem>
            );
          })}
      </Select>
    </FormControl>
  );
};

export const CustomLabels = (props: Props) => {
  return <Field name="nodeSelectorLabels" component={renderSelectLabels} nodeLabels={props.nodeLabels} />;
};

const renderAffinityType = (props: FilledTextFieldProps & WrappedFieldProps) => {
  const inputLabel = "Assign Node Policy";
  const { input } = props;
  return (
    <RenderSelectField input={input} label={inputLabel} value={input.value} meta={props.meta}>
      <MenuItem value={PodAffinityTypePreferFanout}>Prefer Fanout</MenuItem>
      <MenuItem value={PodAffinityTypePreferGather}>Prefer Gather</MenuItem>
    </RenderSelectField>
  );
};

export const AffinityType = (props: any) => {
  return <Field name="podAffinityType" component={renderAffinityType} {...props} />;
};
