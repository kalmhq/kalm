import React from "react";
import { Box, createStyles, Paper, Theme, withStyles, WithStyles } from "@material-ui/core";
import { TDispatchProp } from "types";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { H5, Body2 } from "./Label";
import { KalmApplicationIcon } from "widgets/Icon";
import { indigo } from "@material-ui/core/colors";

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

class EmptyListRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  public render() {
    const { image, title, content, button } = this.props;
    return (
      <Paper square variant="outlined">
        <Box p={2}>
          <Box p={2} display="flex" justifyContent="center">
            {image ? (
              image
            ) : (
              <div style={{ height: 150, width: 150 }}>
                <KalmApplicationIcon style={{ height: 150, width: 150, color: indigo[200] }} />
              </div>
            )}
          </Box>
          <Box p={2} display="flex" justifyContent="center">
            <H5>{title}</H5>
          </Box>
          <Box pb={2} display="flex" justifyContent="center">
            <Body2>{content}</Body2>
          </Box>
          <Box p={2} display="flex" justifyContent="center">
            {button}
          </Box>
        </Box>
      </Paper>
    );
  }
}

export const EmptyList = withStyles(styles)(connect(mapStateToProps)(EmptyListRaw));
