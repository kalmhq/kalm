import React from "react";
import PropTypes from "prop-types";
import SvgIcon from "@material-ui/core/SvgIcon";
import { fade, makeStyles, withStyles } from "@material-ui/core/styles";
import TreeView from "@material-ui/lab/TreeView";
import TreeItem, { TreeItemProps } from "@material-ui/lab/TreeItem";
import Collapse from "@material-ui/core/Collapse";
import { useSpring, animated } from "react-spring/web.cjs"; // web.cjs is required for IE 11 support
import FolderIcon from "@material-ui/icons/Folder";
import FolderOpenIcon from "@material-ui/icons/FolderOpen";
import InsertDriveFileOutlinedIcon from "@material-ui/icons/InsertDriveFileOutlined";
import { ConfigFormValues } from "../../actions";
import { setCurrentConfigIdChainAction } from "../../actions/config";

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
}))((props: TreeItemProps) => (
  <TreeItem {...props} TransitionComponent={TransitionComponent} />
));

const useStyles = makeStyles({
  root: {
    height: 400,
    flexGrow: 1,
    maxWidth: 400
  }
});

export interface FileTreeProp {
  rootConfig: ConfigFormValues;
  dispatch: any;
}

const renderStyledTreeItem = (
  config: ConfigFormValues,
  idChain: string[],
  dispatch: any
) => {
  let newIdChain: string[] = idChain.slice(0); // copy idChain to newIdChain, different memory addresses
  newIdChain.push(config.get("id"));

  if (config.get("type") === "file") {
    return (
      <StyledTreeItem
        nodeId={config.get("id")}
        label={config.get("name")}
        onClick={() => dispatch(setCurrentConfigIdChainAction(newIdChain))}
      />
    );
  }

  const childrenItems: any[] = [];
  config.get("children").forEach((childConfig: ConfigFormValues) => {
    // 递归渲染子树
    childrenItems.push(renderStyledTreeItem(childConfig, newIdChain, dispatch));
  });
  return (
    <StyledTreeItem nodeId={config.get("id")} label={config.get("name")}>
      {childrenItems}
    </StyledTreeItem>
  );
};

export const FileTree = (props: FileTreeProp) => {
  const classes = useStyles();

  return (
    <TreeView
      // onClick={v => console.log(v)}
      className={classes.root}
      defaultExpanded={[props.rootConfig.get("id")]}
      defaultCollapseIcon={<FolderOpenIcon htmlColor="#f9a825" />}
      defaultExpandIcon={<FolderIcon htmlColor="#f9a825" />}
      defaultEndIcon={<InsertDriveFileOutlinedIcon htmlColor="#0277bd" />}
    >
      {renderStyledTreeItem(props.rootConfig, [], props.dispatch)}
      {/* <StyledTreeItem nodeId="1" label="Main">
        <StyledTreeItem nodeId="2" label="Hello" />
        <StyledTreeItem nodeId="3" label="Subtree with children">
          <StyledTreeItem nodeId="6" label="Hello" />
          <StyledTreeItem nodeId="7" label="Sub-subtree with children">
            <StyledTreeItem nodeId="9" label="Child 1" />
            <StyledTreeItem nodeId="10" label="Child 2" />
            <StyledTreeItem nodeId="11" label="Child 3" />
          </StyledTreeItem>
          <StyledTreeItem
            nodeId="8"
            label="Hello"
            onClick={() => console.log("hello")}
          />
        </StyledTreeItem>
        <StyledTreeItem nodeId="4" label="World" />
        <StyledTreeItem nodeId="5" label="Something something" />
      </StyledTreeItem> */}
    </TreeView>
  );
};
