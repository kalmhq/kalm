import {
  createStyles,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Theme,
  withStyles,
  WithStyles,
} from "@material-ui/core";
import React from "react";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      width: "100%",
      height: "45px",
      "& .MuiInputBase-root": {
        height: "45px",
      },
    },
  });

interface Props extends WithStyles<typeof styles> {
  variant?: "standard" | "outlined" | "filled";
  label: string;
  value: string | number;
  options: {
    value: string | number;
    text: string;
  }[];
  onChange: (value: string | number) => void;
}

class KSelectRaw extends React.PureComponent<Props> {
  onInputContainerChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const { onChange } = this.props;
    const x = event.target.value as string;
    onChange(x);
  };

  public render() {
    const { classes, label, value, options, variant } = this.props;
    return (
      <FormControl variant={variant || "outlined"} className={classes.root}>
        <InputLabel id="input-container-label">{label}</InputLabel>
        <Select
          labelId="input-container-label"
          id="input-container"
          onChange={this.onInputContainerChange}
          value={value}
          label={label}
        >
          {options.map((option) => {
            return (
              <MenuItem key={option.value} value={option.value}>
                {option.text}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    );
  }
}

export const KSelect = withStyles(styles)(KSelectRaw);
