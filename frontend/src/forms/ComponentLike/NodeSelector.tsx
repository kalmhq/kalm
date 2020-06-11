import Checkbox from "@material-ui/core/Checkbox";
import TextField, { FilledTextFieldProps } from "@material-ui/core/TextField";
import CheckBoxIcon from "@material-ui/icons/CheckBox";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import Autocomplete from "@material-ui/lab/Autocomplete";
import Immutable from "immutable";
import React from "react";
import { WrappedFieldProps } from "redux-form";
import {
  NodeSelectorLabels,
  PodAffinityTypePreferFanout,
  PodAffinityTypePreferGather
} from "../../types/componentTemplate";
import { RenderSelectField } from "../Basic/select";

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" color="primary" />;

interface Props {
  nodeLabels: Immutable.List<string>;
}

export const RenderSelectLabels = ({ input, nodeLabels }: FilledTextFieldProps & WrappedFieldProps & Props) => {
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
          InputLabelProps={{
            shrink: true
          }}
          variant="outlined"
          label="Node Selector"
          placeholder="Select node labels. Leave blank to schedule on all available nodes."
          helperText="The semantics between labels is AND. A node is a candidate if it match all the labels."
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

export const RenderAffinityType = (props: FilledTextFieldProps & WrappedFieldProps) => {
  const inputLabel = "Assign Node Policy";
  const { input } = props;
  return (
    <RenderSelectField
      input={input}
      label={inputLabel}
      value={input.value}
      meta={props.meta}
      options={[
        { value: PodAffinityTypePreferFanout, text: "Prefer Fanout" },
        { value: PodAffinityTypePreferGather, text: "Prefer Gather" }
      ]}></RenderSelectField>
  );
};
