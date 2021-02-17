import { Box, createStyles, Paper, Theme, Typography, withStyles, WithStyles } from "@material-ui/core";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
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
    const { image, title, content, button } = this.props;
    return (
      <Paper variant="outlined" style={{ border: "none" }}>
        <Box p={2}>
          <Box p={2} display="flex" justifyContent="center">
            {image ? image : null}
          </Box>
          <Box p={2} display="flex" justifyContent="center">
            <Typography color="textPrimary">{title}</Typography>
          </Box>
          <Box pb={2} display="flex" justifyContent="center" alignItems="center" marginX="auto" maxWidth={800}>
            <Typography color="textSecondary" style={{ textAlign: "center" }}>
              {content}
            </Typography>
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
