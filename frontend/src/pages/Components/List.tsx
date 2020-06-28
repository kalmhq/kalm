import { Box, Button, createStyles, Theme, WithStyles } from "@material-ui/core";
import { loadRoutes } from "actions/routes";
import React from "react";
import { RootState } from "reducers";
import { deleteApplicationAction } from "actions/application";
import { setErrorNotificationAction, setSuccessNotificationAction } from "actions/notification";
import { ApplicationDetails } from "types/application";
import { ConfirmDialog } from "widgets/ConfirmDialog";
import { H4 } from "widgets/Label";
import { BasePage } from "../BasePage";
import withStyles from "@material-ui/core/styles/withStyles";
import { connect } from "react-redux";
import { withComponents, WithComponentsProps } from "hoc/withComponents";
import { Namespaces } from "widgets/Namespaces";
import { ApplicationSidebar } from "pages/Application/ApplicationSidebar";
import { ComponentPanel } from "pages/Components/Panel";
import { Link } from "react-router-dom";

const externalEndpointsModalID = "externalEndpointsModalID";
const internalEndpointsModalID = "internalEndpointsModalID";

const styles = (theme: Theme) =>
  createStyles({
    emptyWrapper: {
      width: "100%",
      display: "flex",
      justifyContent: "center",
      paddingTop: "110px",
    },
  });

const mapStateToProps = (state: RootState) => {
  const internalEndpointsDialog = state.get("dialogs").get(internalEndpointsModalID);
  const externalEndpointsDialog = state.get("dialogs").get(externalEndpointsModalID);
  const routesMap = state.get("routes").get("httpRoutes");
  const clusterInfo = state.get("cluster").get("info");
  return {
    clusterInfo,
    internalEndpointsDialogData: internalEndpointsDialog ? internalEndpointsDialog.get("data") : {},
    externalEndpointsDialogData: externalEndpointsDialog ? externalEndpointsDialog.get("data") : {},
    routesMap,
  };
};

interface Props extends WithStyles<typeof styles>, WithComponentsProps, ReturnType<typeof mapStateToProps> {}

interface State {
  isDeleteConfirmDialogOpen: boolean;
  deletingComponentItem?: ApplicationDetails;
}

class ComponentRaw extends React.PureComponent<Props, State> {
  private defaultState = {
    isDeleteConfirmDialogOpen: false,
    deletingComponentItem: undefined,
  };

  constructor(props: Props) {
    super(props);
    this.state = this.defaultState;
  }

  public componentDidMount() {
    const { dispatch } = this.props;
    dispatch(loadRoutes(""));
  }

  private closeDeleteConfirmDialog = () => {
    this.setState(this.defaultState);
  };

  private renderDeleteConfirmDialog = () => {
    const { isDeleteConfirmDialogOpen, deletingComponentItem } = this.state;

    return (
      <ConfirmDialog
        open={isDeleteConfirmDialogOpen}
        onClose={this.closeDeleteConfirmDialog}
        title={`Are you sure to delete this Application(${deletingComponentItem?.get("name")})?`}
        content="This application is already disabled. You will lost this application config, and this action is irrevocable."
        onAgree={this.confirmDelete}
      />
    );
  };

  private confirmDelete = async () => {
    const { dispatch } = this.props;
    try {
      const { deletingComponentItem } = this.state;
      if (deletingComponentItem) {
        await dispatch(deleteApplicationAction(deletingComponentItem.get("name")));
        await dispatch(setSuccessNotificationAction("Successfully delete an application"));
      }
    } catch {
      dispatch(setErrorNotificationAction());
    }
  };

  private renderSecondHeaderRight() {
    const { activeNamespaceName } = this.props;

    return (
      <>
        <H4>Components</H4>
        <Button
          tutorial-anchor-id="add-component"
          component={(props: any) => <Link {...props} />}
          color="primary"
          size="small"
          variant="outlined"
          to={`/applications/${activeNamespaceName}/components/new`}
        >
          Add Component
        </Button>
      </>
    );
  }

  public render() {
    const { components, activeNamespace } = this.props;

    return (
      <BasePage
        secondHeaderRight={this.renderSecondHeaderRight()}
        secondHeaderLeft={<Namespaces />}
        leftDrawer={<ApplicationSidebar />}
      >
        {this.renderDeleteConfirmDialog()}

        <Box p={2}>
          {components.map((component) => (
            <Box pb={1} key={component.get("name")}>
              <ComponentPanel component={component} application={activeNamespace!} />
            </Box>
          ))}
        </Box>
      </BasePage>
    );
  }
}

export const ComponentListPage = withStyles(styles)(withComponents(connect(mapStateToProps)(ComponentRaw)));
