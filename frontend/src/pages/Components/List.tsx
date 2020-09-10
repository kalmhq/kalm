import { Box, Button, createStyles, Theme, WithStyles } from "@material-ui/core";
import withStyles from "@material-ui/core/styles/withStyles";
import { deleteApplicationAction } from "actions/application";
import { setErrorNotificationAction, setSuccessNotificationAction } from "actions/notification";
import { ApplicationSidebar } from "pages/Application/ApplicationSidebar";
import { ComponentPanel } from "pages/Components/ComponentPanel";
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { RootState } from "reducers";
import { ApplicationDetails } from "types/application";
import { ConfirmDialog } from "widgets/ConfirmDialog";
import { Namespaces } from "widgets/Namespaces";
import { BasePage } from "../BasePage";
import { EmptyInfoBox } from "widgets/EmptyInfoBox";
import { CustomizedButton } from "widgets/Button";
import { blinkTopProgressAction } from "actions/settings";
import { push } from "connected-react-router";
import { KalmComponentsIcon } from "widgets/Icon";
import { indigo } from "@material-ui/core/colors";
import sc from "utils/stringConstants";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";

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
  const routesMap = state.routes.httpRoutes;
  const clusterInfo = state.cluster.info;
  return {
    clusterInfo,
    routesMap,
  };
};

interface Props extends WithStyles<typeof styles>, WithNamespaceProps, ReturnType<typeof mapStateToProps> {}

interface State {
  isDeleteConfirmDialogOpen: boolean;
  // TODO correct here
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

  private closeDeleteConfirmDialog = () => {
    this.setState({ isDeleteConfirmDialogOpen: false });
  };

  private renderDeleteConfirmDialog = () => {
    const { isDeleteConfirmDialogOpen, deletingComponentItem } = this.state;

    return (
      <ConfirmDialog
        open={isDeleteConfirmDialogOpen}
        onClose={this.closeDeleteConfirmDialog}
        title={`${sc.ARE_YOU_SURE_PREFIX} this Application(${deletingComponentItem?.name})?`}
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
        await dispatch(deleteApplicationAction(deletingComponentItem.name));
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
        {/* <H6>Components</H6> */}
        <Button
          tutorial-anchor-id="add-component-button"
          component={Link}
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

  private renderEmpty() {
    const { dispatch, activeNamespaceName } = this.props;

    return (
      <EmptyInfoBox
        image={<KalmComponentsIcon style={{ height: 120, width: 120, color: indigo[200] }} />}
        title={"This App doesn’t have any Components"}
        content="Components are the fundamental building blocks of your Application. Each Component corresponds to a single image, and typically represents a service or a cronjob."
        button={
          <CustomizedButton
            variant="contained"
            color="primary"
            onClick={() => {
              blinkTopProgressAction();
              dispatch(push(`/applications/${activeNamespaceName}/components/new`));
            }}
          >
            Add Component
          </CustomizedButton>
        }
      />
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
          {components && components.length > 0
            ? components?.map((component, index) => (
                <Box pb={1} key={component.name}>
                  <ComponentPanel component={component} application={activeNamespace!} defaultUnfold={index === 0} />
                </Box>
              ))
            : this.renderEmpty()}
        </Box>
      </BasePage>
    );
  }
}

export const ComponentListPage = withStyles(styles)(withNamespace(connect(mapStateToProps)(ComponentRaw)));
