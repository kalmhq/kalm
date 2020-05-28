import React from "react";
import { FilledTextFieldProps } from "@material-ui/core/TextField";
import { WrappedFieldProps } from "redux-form";
import { Field } from "redux-form/immutable";
import Immutable from "immutable";
import { MenuItem } from "@material-ui/core";
import {
  NodeSelectorLabels,
  PodAffinityTypePreferFanout,
  PodAffinityTypePreferGather
} from "../../types/componentTemplate";
import { RenderSelectField } from "../Basic";
import Checkbox from "@material-ui/core/Checkbox";
import TextField from "@material-ui/core/TextField";
import Autocomplete from "@material-ui/lab/Autocomplete";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import CheckBoxIcon from "@material-ui/icons/CheckBox";

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" color="primary" />;

interface Props {
  nodeLabels: Immutable.List<string>;
}

const RenderSelectLabels = ({ input, nodeLabels }: FilledTextFieldProps & WrappedFieldProps & Props) => {
  const defaultValue: string[] = [];
  const inputValue = input.value as NodeSelectorLabels;

  if (inputValue) {
    inputValue.forEach((v, k) => {
      defaultValue.push(`${k}:${v}`);
    });
  }

  const options = nodeLabels.toArray();

  return (
    <Autocomplete
      multiple
      options={options}
      disableCloseOnSelect
      getOptionLabel={option => option}
      renderOption={(option, { selected }) => (
        <React.Fragment>
          <Checkbox icon={icon} checkedIcon={checkedIcon} style={{ marginRight: 8 }} checked={selected} />
          {option}
        </React.Fragment>
      )}
      renderInput={params => (
        <TextField
          {...params}
          variant="outlined"
          label="Node Selector Labels"
          placeholder="Select Node Selector Labels"
          size={"small"}
        />
      )}
      defaultValue={defaultValue}
      onChange={(_, v: any) => {
        const value = v as string[];

        let nodeSelectorLabels = Immutable.OrderedMap({});

        value.forEach(nodeLabel => {
          const kv = nodeLabel.split(":");

          nodeSelectorLabels = nodeSelectorLabels.set(kv[0], kv[1]);
        });

        input.onChange(nodeSelectorLabels);
      }}
    />
  );
};

export const CustomLabels = (props: Props) => {
  return <Field name="nodeSelectorLabels" component={RenderSelectLabels} nodeLabels={props.nodeLabels} />;
};

const RenderAffinityType = (props: FilledTextFieldProps & WrappedFieldProps) => {
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
  return <Field name="podAffinityType" component={RenderAffinityType} {...props} />;
};
