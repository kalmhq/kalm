import {
  Collapse,
  createStyles,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Theme
} from "@material-ui/core";
import { blue, grey } from "@material-ui/core/colors";
import AddIcon from "@material-ui/icons/Add";
import ErrorIcon from "@material-ui/icons/Error";
import ExpandLess from "@material-ui/icons/ExpandLess";
import ExpandMore from "@material-ui/icons/ExpandMore";
import FiberManualRecordIcon from "@material-ui/icons/FiberManualRecord";
import { WithStyles, withStyles } from "@material-ui/styles";
import Immutable from "immutable";
import queryString from "query-string";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { getFormSyncErrors, hasSubmitFailed } from "redux-form/immutable";
import { TDispatch } from "types";
import { componentInitialValues } from "../forms/ComponentLike";
import { BaseDrawer } from "../layout/BaseDrawer";
import { ApplicationComponent, ApplicationComponentDetails, ApplicationDetails } from "../types/application";
import { IconButtonWithTooltip } from "./IconButtonWithTooltip";

const mapStateToProps = (state: RootState) => {
  const auth = state.get("auth");
  const isAdmin = auth.get("isAdmin");
  const entity = auth.get("entity");
  // const componentFormMeta = getFormMeta("componentLike")(state);
  const componentSyncErrors = getFormSyncErrors("componentLike")(state);
  const componentFormSubmitFailed = hasSubmitFailed("componentLike")(state);
  const applicationSyncErrors = getFormSyncErrors("application")(state);
  const applicationFormSubmitFailed = hasSubmitFailed("application")(state);

  return {
    activeNamespaceName: state.get("namespaces").get("active"),
    isAdmin,
    entity,
    // componentFormMeta,
    componentSyncErrors,
    componentFormSubmitFailed,
    applicationSyncErrors,
    applicationFormSubmitFailed
  };
};

const styles = (theme: Theme) =>
  createStyles({
    listItem: {
      color: "#000000 !important",
      height: 40,

      "& > .MuiListItemIcon-root": {
        minWidth: 32
      }
    },
    listItemSeleted: {
      backgroundColor: `${blue[50]} !important`,
      borderRight: `4px solid ${blue[700]}`
    },
    listSubHeader: {
      textTransform: "uppercase",
      color: "#000000 !important",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      paddingRight: "4px"
    }
  });

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps> {
  dispatch: TDispatch;
  application?: ApplicationDetails;
  currentComponent?: ApplicationComponent; // for add new component

  // handleClickBasic: () => void;
  handleClickSharedEnvs: () => void;
  handleClickApplicationPlugins: () => void;
  handleClickComponent: (component: ApplicationComponent) => void;
  handleClickComponentTab: (component: ApplicationComponent, tab: string) => void;
}

interface State {
  expandedComponentIndex: number;
  selectedListItemKey: string;
}

class ApplicationEditDrawerRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      expandedComponentIndex: 0,
      selectedListItemKey: this.generateComponentKey(0, "basic")
    };
  }

  // private handleClickBasic() {
  //   this.setState({ selectedListItemKey: "basic" });

  //   const { handleClickBasic } = this.props;
  //   handleClickBasic();
  // }

  private handleClickSharedEnvs() {
    this.setState({ selectedListItemKey: "sharedEnvs" });

    const { handleClickSharedEnvs } = this.props;
    handleClickSharedEnvs();
  }

  private handleClickApplicationPlugins() {
    this.setState({ selectedListItemKey: "applicationPlugins" });

    const { handleClickApplicationPlugins } = this.props;
    handleClickApplicationPlugins();
  }

  private handleClickComponent(component: ApplicationComponent, index: number) {
    this.setState({
      expandedComponentIndex: index,
      selectedListItemKey: this.generateComponentKey(index, "basic")
    });

    const { handleClickComponent } = this.props;
    handleClickComponent(component);
  }

  private handleClickComponentTab(component: ApplicationComponent, selectedListItemKey: string, tab: string) {
    this.setState({ selectedListItemKey: selectedListItemKey });

    const { handleClickComponentTab } = this.props;
    handleClickComponentTab(component, tab);
  }

  private handleAdd() {
    this.handleClickComponent(componentInitialValues, this.props.application?.get("components").size as number);
  }

  private showComponentError(panelKey: string): boolean {
    const { componentSyncErrors, componentFormSubmitFailed } = this.props;
    const fieldNames = this.getPanelFieldNames(panelKey);
    const errors: { [key: string]: any } = componentSyncErrors;

    let anyTouched = true;
    let hasError = false;
    if (anyTouched) {
      fieldNames.forEach(name => {
        if (errors[name]) {
          hasError = true;
        }
      });
    }
    return hasError && componentFormSubmitFailed;
  }

  private showAppliationError(tab: string): boolean {
    const { applicationSyncErrors, applicationFormSubmitFailed } = this.props;

    const errors: { [key: string]: any } = applicationSyncErrors;

    return errors[tab] && applicationFormSubmitFailed;
  }

  private getPanelFieldNames(panelKey: string): string[] {
    switch (panelKey) {
      case "basic":
        return ["name", "image", "workloadType", "command", "args"];
      case "envs":
        return ["env"];
      case "ports":
        return ["ports"];
      case "resources":
        return ["cpu", "memory", "volumes", "configs"];
      case "plugins":
        return ["plugins"];
      case "probes":
        return ["livenessProbe", "readinessProbe"];
      case "advanced":
        return [
          "restartStrategy",
          "terminationGracePeriodSeconds",
          "dnsPolicy",
          "nodeSelectorLabels",
          "podAffinityType"
        ];
      default:
        return [];
    }
  }

  private getComponentFields() {
    return [
      { tab: "basic", text: "Basic Info" },
      {
        tab: "envs",
        text: "Environment variables"
      },
      {
        tab: "ports",
        text: "Ports"
      },
      {
        tab: "resources",
        text: "Resources"
      },
      {
        tab: "plugins",
        text: "Plugins"
      },
      {
        tab: "probes",
        text: "Probes"
      },
      {
        tab: "advanced",
        text: "Advanced"
      }
    ];
  }

  private generateComponentKey(index: number, tab: string): string {
    return `components-${index}-${tab}`;
  }

  private renderComponentFields(component: ApplicationComponent, index: number, selectedListItemKey?: string) {
    const { classes } = this.props;
    selectedListItemKey = selectedListItemKey || this.state.selectedListItemKey;

    const fields = this.getComponentFields();
    return fields.map(field => {
      const key = this.generateComponentKey(index, field.tab);
      const showComponentError = this.showComponentError(field.tab);
      return (
        <ListItem
          key={key}
          onClick={() => {
            this.handleClickComponentTab(component, key, field.tab);
          }}
          selected={selectedListItemKey === key}
          className={classes.listItem}
          classes={{
            selected: classes.listItemSeleted
          }}
          style={{
            paddingLeft: 48
          }}
          button>
          <ListItemIcon>
            {showComponentError ? (
              <ErrorIcon color="error" style={{ marginLeft: -4 }} />
            ) : (
              <FiberManualRecordIcon
                style={{ fontSize: 15 }}
                htmlColor={selectedListItemKey === key ? blue[700] : grey[400]}
              />
            )}
          </ListItemIcon>
          {showComponentError ? (
            <ListItemText
              primary={field.text}
              secondary={"Some form fields are incorrect"}
              secondaryTypographyProps={{ color: "error" }}
            />
          ) : (
            <ListItemText primary={field.text} />
          )}
        </ListItem>
      );
    });
  }

  public componentDidMount() {
    const { application, handleClickComponent } = this.props;
    if (!application) {
      return;
    }

    let search = queryString.parse(window.location.search);
    if (search.component !== undefined) {
      if (search.component === "") {
        // new component form list
        if (application.get("components").size !== 0) {
          this.handleClickComponent(componentInitialValues as ApplicationComponent, application.get("components").size);
          return;
        }
      } else {
        // edit component form list
        const component = application.get("components").find(c => c.get("name") === search.component);
        const componentIndex = application.get("components").findIndex(c => c.get("name") === search.component);
        if (component) {
          this.handleClickComponent(component, componentIndex);
          return;
        }
      }
    }

    // default select
    if (application && application.get("components")?.get(0)) {
      handleClickComponent(application.get("components").get(0) as ApplicationComponent);
    }
  }

  public componentDidUpdate(prevProps: Props) {
    if (prevProps.application && this.props.application) {
      // after create
      if (this.props.application.get("components")?.size - prevProps.application.get("components")?.size === 1) {
        // select new created item
        this.handleClickComponent(
          this.props.application.get("components")?.get(this.state.expandedComponentIndex) as ApplicationComponent,
          this.props.application.get("components")!.size - 1
        );
      }
    }
  }

  private renderComponents() {
    const { application, classes } = this.props;

    if (!application) {
      return null;
    }

    let components: Immutable.List<ApplicationComponent>;
    if (application.get("components") && application.get("components").size > 0) {
      if (this.props.currentComponent && !this.props.currentComponent.get("name")) {
        components = application.get("components").push(this.props.currentComponent as ApplicationComponentDetails);
      } else {
        components = application.get("components");
      }
    } else {
      components = Immutable.List([componentInitialValues as ApplicationComponent]);
    }

    let expandedComponentIndex = this.state.expandedComponentIndex;
    let selectedListItemKey = this.state.selectedListItemKey;
    if (application.get("components")) {
      if (expandedComponentIndex > application.get("components").size) {
        expandedComponentIndex = 0;
        selectedListItemKey = this.generateComponentKey(0, "basic");
      } else if (expandedComponentIndex === application.get("components").size) {
        if (this.props.currentComponent && !this.props.currentComponent.get("name")) {
        } else {
          expandedComponentIndex = 0;
          selectedListItemKey = this.generateComponentKey(0, "basic");
        }
      }
    }

    return components.map((component, index) => {
      return (
        <React.Fragment key={index}>
          <ListItem
            className={classes.listItem}
            classes={{
              selected: classes.listItemSeleted
            }}
            button
            onClick={() => {
              this.handleClickComponent(component, index);
            }}>
            <ListItemIcon>
              <FiberManualRecordIcon style={{ fontSize: 15 }} htmlColor={grey[400]} />
            </ListItemIcon>
            <ListItemText primary={component.get("name") || `Please type component name`} />
            {expandedComponentIndex === index ? <ExpandLess /> : <ExpandMore />}
          </ListItem>
          <Collapse in={expandedComponentIndex === index} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {this.renderComponentFields(component, index, selectedListItemKey)}
            </List>
          </Collapse>
        </React.Fragment>
      );
    });
  }

  private renderSharedEnvs() {
    const { classes } = this.props;

    const tabItemKey = "sharedEnvs";
    return (
      <>
        <ListSubheader disableSticky={true} className={classes.listSubHeader}>
          Shared Environments
        </ListSubheader>

        <ListItem
          key={tabItemKey}
          onClick={() => {
            this.handleClickSharedEnvs();
          }}
          selected={this.state.selectedListItemKey === tabItemKey}
          className={classes.listItem}
          classes={{
            selected: classes.listItemSeleted
          }}
          button>
          <ListItemIcon>
            {this.showAppliationError("sharedEnvs") ? (
              <ErrorIcon color="error" style={{ marginLeft: -4 }} />
            ) : (
              <FiberManualRecordIcon
                style={{ fontSize: 15 }}
                htmlColor={this.state.selectedListItemKey === tabItemKey ? blue[700] : grey[400]}
              />
            )}
          </ListItemIcon>

          {this.showAppliationError("sharedEnvs") ? (
            <ListItemText
              primary={"Shared Environments"}
              secondary={"Some form fields are incorrect"}
              secondaryTypographyProps={{ color: "error" }}
            />
          ) : (
            <ListItemText primary={"Shared Environments"} />
          )}
        </ListItem>
      </>
    );
  }

  private renderApplicationPlugins() {
    const { classes } = this.props;

    const tabItemKey = "applicationPlugins";

    return (
      <>
        <ListSubheader disableSticky={true} className={classes.listSubHeader}>
          Application Plugins
        </ListSubheader>

        <ListItem
          key={tabItemKey}
          onClick={() => {
            this.handleClickApplicationPlugins();
          }}
          selected={this.state.selectedListItemKey === tabItemKey}
          className={classes.listItem}
          classes={{
            selected: classes.listItemSeleted
          }}
          button>
          <ListItemIcon>
            {this.showAppliationError("plugins") ? (
              <ErrorIcon color="error" style={{ marginLeft: -4 }} />
            ) : (
              <FiberManualRecordIcon
                style={{ fontSize: 15 }}
                htmlColor={this.state.selectedListItemKey === tabItemKey ? blue[700] : grey[400]}
              />
            )}
          </ListItemIcon>

          {this.showAppliationError("plugins") ? (
            <ListItemText
              primary={"Application Plugins"}
              secondary={"Some form fields are incorrect"}
              secondaryTypographyProps={{ color: "error" }}
            />
          ) : (
            <ListItemText primary={"Application Plugins"} />
          )}
        </ListItem>
      </>
    );
  }

  render() {
    const { classes, application, currentComponent } = this.props;

    if (!application) {
      return null;
    }

    const disableAdd = (currentComponent && !currentComponent.get("name")) || application.get("components")?.size === 0;

    return (
      <BaseDrawer>
        <List>
          <ListSubheader disableSticky={true} className={classes.listSubHeader}>
            Components
            <IconButtonWithTooltip
              tooltipTitle={"Add"}
              aria-label="add"
              disabled={disableAdd}
              onClick={() => this.handleAdd()}>
              <AddIcon />
            </IconButtonWithTooltip>
          </ListSubheader>

          {this.renderComponents()}

          {this.renderSharedEnvs()}

          {this.renderApplicationPlugins()}
        </List>
      </BaseDrawer>
    );
  }
}

export const ApplicationEditDrawer = connect(mapStateToProps)(withStyles(styles)(ApplicationEditDrawerRaw));
