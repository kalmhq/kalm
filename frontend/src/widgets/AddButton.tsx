import { Link } from "react-router-dom";
import { IconButton } from "@material-ui/core";
import AddCircleIcon from "@material-ui/icons/AddCircle";
import React from "react";

export const AddLink = (props: { to: string }) => {
  return (
    <Link to={props.to}>
      <IconButton>
        <AddCircleIcon color="primary" />
      </IconButton>
    </Link>
  );
};
