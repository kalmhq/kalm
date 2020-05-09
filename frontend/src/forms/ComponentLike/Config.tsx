import "antd/es/cascader/style/css";
import React from "react";
import { pathToAncestorIds } from "../../actions/config";
import { getConfigFilePaths } from "../../selectors/config";
import { EditComponentProps } from "material-table";
import Checkbox from "@material-ui/core/Checkbox";
import TextField from "@material-ui/core/TextField";
import Autocomplete from "@material-ui/lab/Autocomplete";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import CheckBoxIcon from "@material-ui/icons/CheckBox";
import { WrappedFieldProps } from "redux-form";

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" color="primary" />;

export const cascaderValueToPath = (value: string[]): string => {
  let path = "";
  for (let i = 1; i <= value.length - 1; i++) {
    path = path + "/" + value[i];
  }
  return path;
};

export const pathToCasCaderValue = (path: string): string[] => {
  let defaultValue;
  const ancestorIds = pathToAncestorIds(path);
  const splits = path.split("/");
  const configName = splits[splits.length - 1];
  ancestorIds.push(configName);
  defaultValue = ancestorIds;
  return defaultValue;
};

export interface RenderConfigFieldProps {
  label?: string;
}

export const RenderConfigField = (props: WrappedFieldProps & RenderConfigFieldProps) => {
  const { label, input } = props;
  return (
    <Autocomplete
      multiple
      options={getConfigFilePaths()}
      disableCloseOnSelect
      getOptionLabel={option => option}
      renderOption={(option, { selected }) => {
        return (
          <React.Fragment>
            <Checkbox icon={icon} checkedIcon={checkedIcon} style={{ marginRight: 8 }} checked={selected} />
            {option}
          </React.Fragment>
        );
      }}
      renderInput={params => <TextField {...params} variant="outlined" label={label} size={"small"} margin="normal" />}
      defaultValue={input.value ? input.value : []}
      onChange={(_, v: any) => {
        const value = v as string[];
        input.onChange(value);
      }}
    />
  );
};

export const MaterialTableEditConfigField = ({ value, onChange }: EditComponentProps<{}>) => {
  return (
    <Autocomplete
      multiple
      options={getConfigFilePaths()}
      disableCloseOnSelect
      getOptionLabel={option => option}
      renderOption={(option, { selected }) => (
        <React.Fragment>
          <Checkbox icon={icon} checkedIcon={checkedIcon} style={{ marginRight: 8 }} checked={selected} />
          {option}
        </React.Fragment>
      )}
      renderInput={params => (
        <TextField {...params} variant="outlined" label="Configs" placeholder="Select Config Paths" size={"small"} />
      )}
      defaultValue={value}
      onChange={(_, v: any) => {
        const value = v as string[];

        onChange(value);
      }}
    />
  );
};
