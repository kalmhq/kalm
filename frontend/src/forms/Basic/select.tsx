import React from "react";
import { FormControl, InputLabel, Select, SelectProps, makeStyles } from "@material-ui/core";
import { EditComponentProps } from "material-table";
import { ID } from "../../utils";

export const MaterialTableEditSelectField = ({
  value,
  onChange,
  selectProps,
  children
}: EditComponentProps<{}> & { selectProps: SelectProps; children?: React.ReactNode }) => {
  const id = ID();
  const labelId = ID();

  const classes = makeStyles(_theme => ({
    root: {
      display: "flex"
    }
  }))();

  const [labelWidth, setLabelWidth] = React.useState(0);

  React.useEffect(() => {
    setLabelWidth(inputLabel.current!.offsetWidth);
  }, []);

  const inputLabel = React.useRef<HTMLLabelElement>(null);

  const handleOnChange = (event: React.ChangeEvent<{ name?: string; value: unknown }>, child: React.ReactNode) => {
    onChange(event.target.value);
  };

  return (
    <FormControl classes={{ root: classes.root }} variant="outlined" size="small">
      <InputLabel ref={inputLabel} htmlFor={id} id={labelId}>
        {selectProps.label}
      </InputLabel>
      <Select
        labelWidth={labelWidth}
        autoFocus={false}
        labelId={labelId}
        value={value}
        onChange={handleOnChange}
        inputProps={{
          id: id
        }}>
        {children}
      </Select>
    </FormControl>
  );
};
