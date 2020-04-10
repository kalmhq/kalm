import { Link } from "react-router-dom";
import { Button, ButtonProps } from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import React from "react";

export const AddLink = (props: { to: string }) => {
  return (
    <Link to={props.to}>
      <Button color="primary" size="large" startIcon={<AddIcon />} onClick={() => {}}>
        Add
      </Button>
    </Link>
  );
};

export const AddButton = (props: React.PropsWithChildren<React.RefAttributes<SVGSVGElement>> & ButtonProps) => {
  return (
    <Button ref={props.ref} color="primary" size="large" startIcon={<AddIcon />} onClick={props.onClick}>
      Add
    </Button>
  );
};
