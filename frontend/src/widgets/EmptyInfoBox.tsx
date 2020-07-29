import { Box, createStyles, Paper, Theme, withStyles, WithStyles } from "@material-ui/core";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { Subtitle1 } from "./Label";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
    hackBody: {
      "font-size": "16px", //HACK - discuss re-factoring of global font sizes in theme
      color: theme.palette.text.secondary,
    },
  });

const mapStateToProps = (state: RootState) => {
  return {};
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {
  image?: React.ReactNode;
  title: string;
  content: React.ReactNode;
  button: React.ReactNode;
}

interface State {}

class EmptyInfoBoxRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  public render() {
    const { classes, image, title, content, button } = this.props;
    return (
      <Paper square variant="outlined">
        <Box p={2}>
          <Box p={2} display="flex" justifyContent="center">
            {image ? image : null}
          </Box>
          <Box p={2} display="flex" justifyContent="center">
            <Subtitle1>{title}</Subtitle1>
          </Box>
          <Box pb={2} display="flex" justifyContent="center">
            <Box className={classes.hackBody}>{content}</Box>
          </Box>
          <Box p={2} display="flex" justifyContent="center">
            {button}
          </Box>
        </Box>
      </Paper>
    );
  }
}

export const EmptyInfoBox = withStyles(styles)(connect(mapStateToProps)(EmptyInfoBoxRaw));
