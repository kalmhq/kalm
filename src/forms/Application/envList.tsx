import React from "react";
import { Collapse, Box, List, ListItem, ListItemText } from "@material-ui/core";
import ExpandLess from "@material-ui/icons/ExpandLess";
import ExpandMore from "@material-ui/icons/ExpandMore";

export interface EnvListProps {
  title: React.ReactNode;
  options: React.ReactNode[];
  defaultOpen?: boolean;
}

export const EnvList = ({ title, options, defaultOpen }: EnvListProps) => {
  const [open, setOpen] = React.useState(!!defaultOpen);

  const handleClick = () => {
    setOpen(!open);
  };

  return (
    <List
      dense
      component="nav"
      aria-labelledby="nested-list-subheader"
      disablePadding
    >
      <ListItem dense disableGutters button onClick={handleClick}>
        <ListItemText>{title}</ListItemText>
        {open ? <ExpandLess /> : <ExpandMore />}
      </ListItem>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          <ListItem dense disableGutters>
            {options.map(o => (
              <ListItemText>
                <Box ml={2}>{o}</Box>
              </ListItemText>
            ))}
          </ListItem>
        </List>
      </Collapse>
    </List>
  );
};
