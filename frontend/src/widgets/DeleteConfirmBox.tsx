import { Box, Button, createStyles, Divider, Grid, makeStyles, TextField, Theme } from "@material-ui/core";
import React, { useState } from "react";
import { Subtitle2 } from "widgets/Label";

interface IDeleteConfirmBox {
  popupTitle: React.ReactNode;
  placeholder: string;
  label: string;
  popupContent?: React.ReactNode;
  target?: string;
  deleteAction: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  cancelAction: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

const useStyles = makeStyles<Theme, IDeleteConfirmBox>((theme) =>
  createStyles({
    deleteButton: {
      borderColor: theme.palette.error.main,
      color: theme.palette.error.main,
    },
  }),
);
export const DeleteConfirmBox = (props: IDeleteConfirmBox) => {
  const { popupTitle, placeholder, popupContent, target, deleteAction, cancelAction } = props;
  const [userInput, setUserInput] = useState("");
  const [hasVerified, setHasVerified] = useState(target !== undefined ? false : true);
  const classes = useStyles(props);
  return (
    <Box maxWidth={320}>
      <Box m={2}>
        <Subtitle2 align="center">{popupTitle}</Subtitle2>
        <Divider />
        {popupContent && <Box m={1}>{popupContent}</Box>}
        {target && (
          <TextField
            fullWidth
            label={"Please confirm the name"}
            placeholder={placeholder}
            autoFocus
            value={userInput}
            onChange={(e) => {
              const inputContent = e.target.value;
              setUserInput(inputContent);
              setHasVerified(inputContent === target);
            }}
            margin="dense"
            variant="outlined"
          />
        )}
      </Box>
      <Box p={2}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Button
              className={classes.deleteButton}
              variant="outlined"
              fullWidth
              disabled={!hasVerified}
              size="small"
              onClick={(e) => {
                deleteAction && deleteAction(e);
              }}
            >
              Delete
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              fullWidth
              size="small"
              variant="outlined"
              color="default"
              onClick={(e) => {
                cancelAction && cancelAction(e);
              }}
            >
              Cancel
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};
