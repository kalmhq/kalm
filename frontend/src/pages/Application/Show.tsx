import { Box, createStyles, Theme, WithStyles, withStyles } from "@material-ui/core";
import React from "react";
import { connect } from "react-redux";
import { ApplicationSidebar } from "pages/Application/ApplicationSidebar";
import { H4 } from "widgets/Label";
import { Namespaces } from "widgets/Namespaces";
import { BasePage } from "../BasePage";
import { ApplicationOverview } from "./Detail";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
import { RootState } from "reducers";

const mapStateToProps = (_state: RootState) => {
  return {};
};

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

interface Props extends WithNamespaceProps, WithStyles<typeof styles> {}

class ApplicationShowRaw extends React.PureComponent<Props> {
  public render() {
    return (
      <BasePage
        secondHeaderLeft={<Namespaces />}
        secondHeaderRight={<H4>Metrics</H4>}
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
