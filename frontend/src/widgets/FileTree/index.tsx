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
import { ConfigNode, ConfigNodeType } from "../../types/config";
import { setCurrentConfigIdChainAction, getConfigPath } from "../../actions/config";
import { MenuItem, Popper, Grow, Paper, MenuList, ClickAwayListener } from "@material-ui/core";
import { TDispatch } from "../../types";
import { getCurrentConfig } from "../../selectors/config";

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

interface StyledTreeItemProps extends TreeItemProps {
  dispatch: TDispatch;
  config: ConfigNode;
  idChain: string[];
  handleAdd: (configType: ConfigNodeType) => void;
  handleEdit: () => void;
  handleDuplicate: () => void;
  handleDelete: () => void;
}

const StyledTreeItem = withStyles((theme: any) => ({
  group: {
    marginLeft: 12,
    paddingLeft: 12,
    borderLeft: `1px dashed ${fade(theme.palette.text.primary, 0.4)}`
  },
  content: {
    height: 30
  },
  label: {
    zIndex: -1
  }
}))((props: StyledTreeItemProps) => {
  const { dispatch, config, idChain, handleAdd, handleEdit, handleDuplicate, handleDelete } = props;

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleClick = () => {
    dispatch(setCurrentConfigIdChainAction(idChain));
  };

  const handleContextMenu = (event: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
    event.preventDefault();
    dispatch(setCurrentConfigIdChainAction(idChain));
    setAnchorEl(event.currentTarget.firstChild as any);
    event.stopPropagation();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleListKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Tab") {
      event.preventDefault();
      setAnchorEl(null);
    }
  };

  const copiedProps = { ...props };
  delete copiedProps.dispatch;
  delete copiedProps.config;
  delete copiedProps.idChain;
  delete copiedProps.handleAdd;
  delete copiedProps.handleEdit;
  delete copiedProps.handleDuplicate;
  delete copiedProps.handleDelete;

  return (
    <>
      <TreeItem
        {...copiedProps}
        TransitionComponent={TransitionComponent}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      />

      <Popper
        open={getConfigPath(config) === getConfigPath(getCurrentConfig()) && Boolean(anchorEl)}
        anchorEl={anchorEl}
        role={undefined}
        transition
        disablePortal>
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{ transformOrigin: placement === "bottom" ? "center top" : "center bottom" }}>
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList autoFocusItem={Boolean(anchorEl)} id="menu-list-grow" onKeyDown={handleListKeyDown}>
                  {config.get("type") === "folder"
                    ? [
                        <MenuItem key="add-file" onClick={() => handleAdd("file")}>
                          Add file
                        </MenuItem>,
                        <MenuItem key="add-folder" onClick={() => handleAdd("folder")}>
                          Add folder
                        </MenuItem>
                      ]
                    : [
                        <MenuItem key="edit" onClick={handleEdit}>
                          Edit
                        </MenuItem>,
                        <MenuItem key="duplicate" onClick={handleDuplicate}>
                          Duplicate
                        </MenuItem>,
                        <MenuItem key="delete" onClick={handleDelete}>
                          Delete
                        </MenuItem>
                      ]}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
});

const useStyles = makeStyles({
  root: {
    height: 400,
    flexGrow: 1,
    maxWidth: 400
  }
});

export interface FileTreeProps {
  rootConfig: ConfigNode;
  dispatch: any;
  handleAdd: (configType: ConfigNodeType) => void;
  handleEdit: () => void;
  handleDuplicate: () => void;
  handleDelete: () => void;
}

export const FileTree = (props: FileTreeProps) => {
  const classes = useStyles();

  const { dispatch, rootConfig, handleAdd, handleEdit, handleDuplicate, handleDelete } = props;

  const renderStyledTreeItem = (config: ConfigNode, idChain: string[]) => {
    // copy idChain to newIdChain, different memory addresses
    let newIdChain: string[] = idChain.slice(0);
    newIdChain.push(config.get("id"));

    if (config.get("type") === "file") {
      return (
        <StyledTreeItem
          dispatch={dispatch}
          config={config}
          idChain={newIdChain}
          key={getConfigPath(config)}
          nodeId={getConfigPath(config)}
          label={config.get("name")}
          handleAdd={handleAdd}
          handleEdit={handleEdit}
          handleDuplicate={handleDuplicate}
          handleDelete={handleDelete}
        />
      );
    }

    const childrenItems: any[] = [];
    config.get("children").forEach((childConfig: ConfigNode) => {
      // recursive render children
      childrenItems.push(renderStyledTreeItem(childConfig, newIdChain));
    });
    return (
      <StyledTreeItem
        handleAdd={handleAdd}
        handleEdit={handleEdit}
        handleDuplicate={handleDuplicate}
        handleDelete={handleDelete}
        dispatch={dispatch}
        config={config}
        idChain={newIdChain}
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

  return (
    <TreeView
      selected={getConfigPath(getCurrentConfig())}
      className={classes.root}
      defaultExpanded={[rootConfig.get("id")]}
      defaultCollapseIcon={<FolderOpenIcon htmlColor="#f9a825" />}
      defaultExpandIcon={<FolderIcon htmlColor="#f9a825" />}
      defaultEndIcon={<InsertDriveFileOutlinedIcon htmlColor="#0277bd" />}>
      {renderStyledTreeItem(rootConfig, [])}
    </TreeView>
  );
};
