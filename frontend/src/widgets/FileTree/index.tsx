import React from "react";
import PropTypes from "prop-types";
import { fade, makeStyles, withStyles } from "@material-ui/core/styles";
import TreeView from "@material-ui/lab/TreeView";
import TreeItem, { TreeItemProps } from "@material-ui/lab/TreeItem";
import Collapse from "@material-ui/core/Collapse";
import { useSpring, animated } from "react-spring/web.cjs"; // web.cjs is required for IE 11 support
import FolderIcon from "@material-ui/icons/Folder";
import FolderOpenIcon from "@material-ui/icons/FolderOpen";
import InsertDriveFileOutlinedIcon from "@material-ui/icons/InsertDriveFileOutlined";
import { ConfigNode } from "../../types/config";
import { setCurrentConfigIdChainAction, getConfigPath } from "../../actions/config";

function TransitionComponent(props: any) {
  const style = useSpring({
    from: { opacity: 0, transform: "translate3d(30px,0,0)" },
    to: {
      opacity: props.in ? 1 : 0,
      transform: `translate3d(${props.in ? 0 : 30}px,0,0)`
    }
  });

  return (
    <animated.div style={style}>
      <Collapse {...props} />
    </animated.div>
  );
}

TransitionComponent.propTypes = {
  /**
   * Show the component; triggers the enter or exit states
   */
  in: PropTypes.bool
};

const StyledTreeItem = withStyles((theme: any) => ({
  group: {
    marginLeft: 12,
    paddingLeft: 12,
    borderLeft: `1px dashed ${fade(theme.palette.text.primary, 0.4)}`
  },
  content: {
    height: 30
  }
}))((props: TreeItemProps) => <TreeItem {...props} TransitionComponent={TransitionComponent} />);

const useStyles = makeStyles({
  root: {
    height: 400,
    flexGrow: 1,
    maxWidth: 400
  }
});

export interface FileTreeProp {
  rootConfig: ConfigNode;
  dispatch: any;
}

const renderStyledTreeItem = (config: ConfigNode, idChain: string[], dispatch: any) => {
  // copy idChain to newIdChain, different memory addresses
  let newIdChain: string[] = idChain.slice(0);
  newIdChain.push(config.get("id"));

  if (config.get("type") === "file") {
    return (
      <StyledTreeItem
        key={config.get("id")}
        nodeId={config.get("id")}
        label={config.get("name")}
        onClick={() => dispatch(setCurrentConfigIdChainAction(newIdChain))}
      />
    );
  }

  const childrenItems: any[] = [];
  config.get("children").forEach((childConfig: ConfigNode) => {
    // recursive render children
    childrenItems.push(renderStyledTreeItem(childConfig, newIdChain, dispatch));
  });
  return (
    <StyledTreeItem
      endIcon={
        childrenItems.length === 0 ? (
          <FolderOpenIcon htmlColor="#f9a825" />
        ) : (
          <InsertDriveFileOutlinedIcon htmlColor="#0277bd" />
        )
      }
      key={getConfigPath(config)}
      nodeId={getConfigPath(config)}
      label={config.get("name")}>
      {childrenItems}
    </StyledTreeItem>
  );
};

export const FileTree = (props: FileTreeProp) => {
  const classes = useStyles();

  return (
    <TreeView
      onNodeSelect={(event: React.ChangeEvent<{}>, nodeIds: string[]) => {
        console.log("onNodeSelect", event, nodeIds);
      }}
      onNodeToggle={(event: React.ChangeEvent<{}>, nodeIds: string[]) => {
        console.log("onNodeToggle", event, nodeIds);
      }}
      className={classes.root}
      defaultExpanded={[props.rootConfig.get("id")]}
      defaultCollapseIcon={<FolderOpenIcon htmlColor="#f9a825" />}
      defaultExpandIcon={<FolderIcon htmlColor="#f9a825" />}
      defaultEndIcon={<InsertDriveFileOutlinedIcon htmlColor="#0277bd" />}>
      {renderStyledTreeItem(props.rootConfig, [], props.dispatch)}
    </TreeView>
  );
};
