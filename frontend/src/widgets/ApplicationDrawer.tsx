import {
  createStyles,
  Theme,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Collapse
} from "@material-ui/core";
import { WithStyles, withStyles } from "@material-ui/styles";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatch } from "types";
import { blue, grey } from "@material-ui/core/colors";
import { BaseDrawer } from "../layout/BaseDrawer";
import { ApplicationDetails, ApplicationComponent, ApplicationComponentDetails } from "../types/application";
import FiberManualRecordIcon from "@material-ui/icons/FiberManualRecord";
import ExpandLess from "@material-ui/icons/ExpandLess";
import ExpandMore from "@material-ui/icons/ExpandMore";
import { componentInitialValues } from "../forms/ComponentLike";
import Immutable from "immutable";
import AddIcon from "@material-ui/icons/Add";
import { IconButtonWithTooltip } from "./IconButtonWithTooltip";

const mapStateToProps = (state: RootState) => {
  const auth = state.get("auth");
  const isAdmin = auth.get("isAdmin");
  const entity = auth.get("entity");
  return {
    activeNamespaceName: state.get("namespaces").get("active"),
    isAdmin,
    entity
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
  handleClickComponent: (component: ApplicationComponent) => void;
  handleClickComponentTab: (component: ApplicationComponent, tab: string) => void;
}

interface State {
  expandedComponentIndex: number;
  selectedListItemKey: string;
}

class ApplicationDrawerRaw extends React.PureComponent<Props, State> {
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
            <FiberManualRecordIcon
              style={{ fontSize: 15 }}
              htmlColor={selectedListItemKey === key ? blue[700] : grey[400]}
            />
          </ListItemIcon>
          <ListItemText primary={field.text} />
        </ListItem>
      );
    });
  }

  public componentDidMount() {
    const { application, handleClickComponent } = this.props;
    if (application && application.get("components").get(0)) {
      handleClickComponent(application.get("components").get(0) as ApplicationComponent);
    }
  }

  public componentDidUpdate(prevProps: Props) {
    if (prevProps.application && this.props.application) {
      // after create
      if (this.props.application.get("components").size - prevProps.application.get("components").size === 1) {
        // select new created item
        this.props.handleClickComponent(
          this.props.application.get("components").get(this.state.expandedComponentIndex) as ApplicationComponent
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

  render() {
    const { classes, application, currentComponent } = this.props;

    if (!application) {
      return null;
    }

    const disableAdd = (currentComponent && !currentComponent.get("name")) || application.get("components").size === 0;

    return (
      <BaseDrawer>
        <List>
          {/* <ListItem
            key={"basic"}
            onClick={() => this.handleClickBasic()}
            selected={this.state.selectedListItemKey === "basic"}
            className={classes.listItem}
            classes={{
              selected: classes.listItemSeleted
            }}
            button>
            <ListItemIcon>
              <FiberManualRecordIcon
                style={{ fontSize: 15 }}
                htmlColor={this.state.selectedListItemKey === "basic" ? blue[700] : grey[400]}
              />
            </ListItemIcon>
            <ListItemText primary={"Application Basic"} />
          </ListItem> */}

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

          <ListSubheader disableSticky={true} className={classes.listSubHeader}>
            Shared Environments
          </ListSubheader>

          <ListItem
            key={"sharedEnvs"}
            onClick={() => {
              this.handleClickSharedEnvs();
            }}
            selected={this.state.selectedListItemKey === "sharedEnvs"}
            className={classes.listItem}
            classes={{
              selected: classes.listItemSeleted
            }}
            button>
            <ListItemIcon>
              <FiberManualRecordIcon
                style={{ fontSize: 15 }}
                htmlColor={this.state.selectedListItemKey === "sharedEnvs" ? blue[700] : grey[400]}
              />
            </ListItemIcon>
            <ListItemText primary={"Shared Environments"} />
          </ListItem>
        </List>
      </BaseDrawer>
    );
  }
}

export const ApplicationDrawer = connect(mapStateToProps)(withStyles(styles)(ApplicationDrawerRaw));
