import React from "react";
import { BasePage } from "../BasePage";
import { makeStyles, Theme } from "@material-ui/core/styles";
import ApplicationFrom from "../../forms/Application";
import { useTheme } from "@material-ui/core/styles";
import { ApplicationFormValues } from "../../actions";

export interface ApplicationNewProps {
  children?: React.ReactNode;
  className?: string;
}

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    flexGrow: 1,
    width: "100%",
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(3)
  }
}));

export function ApplicationNew() {
  const theme = useTheme();
  const classes = useStyles(theme);
  const [value, setValue] = React.useState(0);

  return (
    <BasePage title="New Application">
      <div className={classes.root}>
        <ApplicationFrom
          onSubmit={(values: ApplicationFormValues) => {
            console.log("submit", values);
          }}
        />
      </div>
    </BasePage>
  );
}
