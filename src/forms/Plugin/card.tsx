import Button from "@material-ui/core/Button";
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import React from "react";

const useStyles = makeStyles({
  root: {
    // maxWidth: 200
  },
  media: {
    height: 140
  }
});

interface Props {
  title: string;
  description: React.ReactNode;
  onSelect: () => void;
}

export const PluginCard = (props: Props) => {
  const classes = useStyles();

  return (
    <Card className={classes.root}>
      <CardContent>
        <Typography gutterBottom variant="h5" component="h2">
          {props.title}
        </Typography>
        <Typography variant="body2" color="textSecondary" component="p">
          {props.description}
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small" color="primary" fullWidth onClick={props.onSelect}>
          Select
        </Button>
      </CardActions>
    </Card>
  );
};
