import React from "react";
import IconButton from "@material-ui/core/IconButton";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import Icon from "@material-ui/core/Icon";
const ITEM_HEIGHT = 48;

interface Option {
  text: string;
  onClick: any;
  icon?: string;
}

interface Props {
  options: Option[];
}

export const FoldButtonGroup = (props: Props) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    event.stopPropagation();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <IconButton aria-label="more" aria-controls="long-menu" aria-haspopup="true" onClick={handleClick}>
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
            maxHeight: ITEM_HEIGHT * 4.5
          }
        }}>
        {props.options.map(option => (
          <MenuItem key={option.text} selected={false} onClick={option.onClick} style={{ padding: "6px 20px" }}>
            {option.icon ? <Icon style={{ marginRight: "20px" }}>{option.icon}</Icon> : null}
            {option.text}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
};
