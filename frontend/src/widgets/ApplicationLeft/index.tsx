import { createStyles, Theme, makeStyles } from "@material-ui/core";
import { WithStyles, withStyles } from "@material-ui/styles";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatch } from "types";
import AppsIcon from "@material-ui/icons/Apps";
import { NavLink } from "react-router-dom";
import TreeView from "@material-ui/lab/TreeView";
import TreeItem, { TreeItemProps } from "@material-ui/lab/TreeItem";
import Typography from "@material-ui/core/Typography";
import { SvgIconProps } from "@material-ui/core/SvgIcon";
import { LEFT_SECTION_WIDTH } from "../../pages/BasePage";
import { ApplicationDetails } from "../../types/application";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { blue } from "@material-ui/core/colors";

type StyledTreeItemProps = TreeItemProps & {
  labelText: string;
  depth: number; // start at 0
};

const useTreeItemStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      fontSize: 15,
      color: "#000000",
      position: "relative",
      "&:hover > $content:hover": {
        backgroundColor: theme.palette.action.hover
      },
      "&:hover > $content:hover $label:hover": {
        backgroundColor: `rgba(0,0,0,0) !important`
      },
      "&:focus > $content, &$selected > $content, &$selected > $content:hover": {
        backgroundColor: blue[50],
        borderRight: `4px solid ${blue[700]}`
      },
      "&:focus > $content $label, &$selected > $content $label": {
        backgroundColor: `rgba(0,0,0,0) !important`
      }
    },
    iconContainer: {
      position: "absolute",
      right: 16
    },
    content: {
      height: "40px",

      "$expanded > &": {
        fontWeight: theme.typography.fontWeightRegular
      }
    },
    group: {
      marginLeft: 0
    },
    expanded: {},
    selected: {},
    label: {
      fontWeight: "inherit",
      color: "inherit"
    },
    labelRoot: {
      display: "flex",
      alignItems: "center"
    },
    labelText: {
      fontWeight: "inherit",
      flexGrow: 1
    }
  })
);

function StyledTreeItem(props: StyledTreeItemProps) {
  const classes = useTreeItemStyles();
  const { depth, labelText, ...other } = props;

  return (
    <TreeItem
      label={
        <div className={classes.labelRoot} style={{ paddingLeft: 8 + 16 * (depth + 1) }}>
          <Typography variant="body2" className={classes.labelText}>
            {labelText}
          </Typography>
        </div>
      }
      classes={{
        root: classes.root,
        iconContainer: classes.iconContainer,
        content: classes.content,
        expanded: classes.expanded,
        selected: classes.selected,
        group: classes.group,
        label: classes.label
      }}
      {...other}
    />
  );
}

const mapStateToProps = (state: RootState) => {
  return {};
};

const styles = (theme: Theme) =>
  createStyles({
    root: {
      width: LEFT_SECTION_WIDTH,
      minWidth: LEFT_SECTION_WIDTH,
      backgroundColor: "#FFFFFF"
    }
  });

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps> {
  dispatch: TDispatch;
  application?: ApplicationDetails;
}

interface State {}

class ApplicationLeftRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {};
  }

  render() {
    const { classes, application } = this.props;

    if (!application) {
      return null;
    }

    console.log(application.toJS());

    return (
      <TreeView
        className={classes.root}
        defaultExpanded={["components"]}
        defaultEndIcon={<div style={{ width: 24 }} />}>
        <StyledTreeItem depth={0} nodeId="baisc" labelText="Application Baisc" />
        <StyledTreeItem depth={0} nodeId="components" labelText="Components">
          {application.get("components").map((component, index) => {
            return (
              <StyledTreeItem
                depth={1}
                key={index}
                nodeId={`components-${index}`}
                labelText={component.get("name")}
                collapseIcon={<ExpandLessIcon />}
                expandIcon={<ExpandMoreIcon />}>
                <StyledTreeItem depth={2} nodeId={`components-${index}-envs`} labelText="Environment variables" />
                <StyledTreeItem depth={2} nodeId={`components-${index}-ports`} labelText="Ports" />
                <StyledTreeItem depth={2} nodeId={`components-${index}-resources`} labelText="Resources" />
                <StyledTreeItem depth={2} nodeId={`components-${index}-plugins`} labelText="Plugins" />
                <StyledTreeItem depth={2} nodeId={`components-${index}-probes`} labelText="Probes" />
                <StyledTreeItem depth={2} nodeId={`components-${index}-advanced`} labelText="Advanced" />
              </StyledTreeItem>
            );
          })}
        </StyledTreeItem>
        <StyledTreeItem depth={0} nodeId="sharedEnvs" labelText="Shared Environments" />
      </TreeView>
    );
  }
}

export const ApplicationLeft = connect(mapStateToProps)(withStyles(styles)(ApplicationLeftRaw));
