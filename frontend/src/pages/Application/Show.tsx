import { Box, Button, createStyles, Theme, WithStyles, withStyles } from "@material-ui/core";
import React from "react";
import { connect } from "react-redux";
import { ApplicationSidebar } from "pages/Application/ApplicationSidebar";
import { H4 } from "widgets/Label";
import { Namespaces } from "widgets/Namespaces";
import { BasePage } from "../BasePage";
import { ApplicationOverview } from "./Detail";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
import { RootState } from "reducers";
import { Link } from "react-router-dom";

const mapStateToProps = (_state: RootState) => {
  return {};
};

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

interface Props extends WithNamespaceProps, WithStyles<typeof styles> {}

class ApplicationShowRaw extends React.PureComponent<Props> {
  private renderSecondHeaderRight() {
    const { activeNamespaceName } = this.props;

    return (
      <>
        <H4>Overview</H4>
        <Button
          component={Link}
          color="primary"
          size="small"
          variant="outlined"
          to={`/applications/${activeNamespaceName}/components/new`}
          id="add-component-button"
        >
          Add Component
        </Button>
        <Button
          component={Link}
          color="primary"
          size="small"
          variant="outlined"
          to={`/applications/${activeNamespaceName}/routes/new`}
        >
          Add Route
        </Button>
      </>
    );
  }

  public render() {
    return (
      <BasePage
        secondHeaderLeft={<Namespaces />}
        secondHeaderRight={this.renderSecondHeaderRight()}
        leftDrawer={<ApplicationSidebar />}
      >
        <Box p={2}>
          <ApplicationOverview />
        </Box>
      </BasePage>
    );
  }
}

export const ApplicationShowPage = withStyles(styles)(withNamespace(connect(mapStateToProps)(ApplicationShowRaw)));
