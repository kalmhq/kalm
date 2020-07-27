import React from "react";
import { Box, Button, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { TDispatchProp } from "types";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { BasePage } from "pages/BasePage";
import { EmptyList } from "widgets/EmptyList";
import { CIIcon } from "widgets/Icon";
import { indigo } from "@material-ui/core/colors";
import { CustomizedButton } from "widgets/Button";
import { Link } from "react-router-dom";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

const mapStateToProps = (state: RootState) => {
  return {};
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {}

interface State {}

class CIPageRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  private renderEmpty() {
    // const { dispatch } = this.props;

    return (
      <EmptyList
        image={<CIIcon style={{ height: 120, width: 120, color: indigo[200] }} />}
        title={"To integration with your pipeline, apply an deploy key first."}
        content="In Kalm, you can use webhooks to modify components. You can implement automatic deployment updates in this way. Kalm can be easily integrated with popular CI tools, such as CircleCI, Github Actions."
        button={
          <CustomizedButton component={Link} variant="contained" to="/ci/tokens/new" color="primary">
            New Deploy Key
          </CustomizedButton>
        }
      />
    );
  }

  public render() {
    return (
      <BasePage
        secondHeaderRight={
          <>
            <Button component={Link} color="primary" variant="outlined" size="small" to="/ci/tokens/new">
              New Deploy Key
            </Button>
          </>
        }
      >
        <Box p={2}>{this.renderEmpty()}</Box>
      </BasePage>
    );
  }
}

export const CIPage = withStyles(styles)(connect(mapStateToProps)(CIPageRaw));
