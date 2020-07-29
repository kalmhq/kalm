import React from "react";
import IconButton from "@material-ui/core/IconButton";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import Icon from "@material-ui/core/Icon";
import { NamespaceVisibleContainer } from "permission/Namespace";
import { blinkTopProgressAction } from "actions/settings";
import { Box, Theme, withStyles, WithStyles } from "@material-ui/core";
import { KLink } from "./Link";

const ITEM_HEIGHT = 48;

interface Option {
  text: string;
  onClick?: any;
  to?: string;
  icon?: React.ReactNode;
  iconName?: string;
  requiredRole?: string;
}

const styles = (theme: Theme) => ({
  button: {
    // color: theme.palette.grey[600],
    "&:disabled": {
      cursor: "not-allowed !important",
      background: theme.palette.type === "light" ? theme.palette.grey[100] : theme.palette.grey[800],
    },
    "&:hover": {
      // background: theme.palette.primary.light,
      // color: theme.palette.primary.main,
    },
  },
});

interface Props {
  options: Option[];
}

type FoldButtonGroupProps = WithStyles<typeof styles> & Props;

export const FoldButtonGroup = withStyles(styles)((props: FoldButtonGroupProps) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const { classes, ...iconButtonProps } = props;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    event.stopPropagation();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <IconButton
        className={classes.button}
        size={"small"}
        aria-label="more"
        aria-controls="long-menu"
        aria-haspopup="true"
        onClick={handleClick}
        {...iconButtonProps}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu
        id="long-menu"
        anchorEl={anchorEl}
        keepMounted
        open={open}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxHeight: ITEM_HEIGHT * 4.5,
          },
        }}
      >
        {props.options.map((option, index) => (
          <NamespaceVisibleContainer key={index} requiredRole={option.requiredRole}>
            <KLink
              onClick={() => {
                blinkTopProgressAction();
                option.onClick && option.onClick();
              }}
              to={option.to || "#"}
              // style={{ color: "inherit" }}
              key={index}
            >
              <MenuItem className={classes.button} key={option.text} selected={false} style={{ padding: "6px 20px" }}>
                {/* onClick={option.onClick}  */}

                <Box mr={2}>
                  {option.iconName ? <Icon>{option.iconName}</Icon> : null}
                  {option.icon ? option.icon : null}
                </Box>
                {option.text}
              </MenuItem>
            </KLink>
          </NamespaceVisibleContainer>
        ))}
      </Menu>
    </div>
  );
});
