import { Button, Grid, Paper } from "@material-ui/core";
import { makeStyles, Theme } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import React from "react";
import {
  InjectedFormProps,
  reduxForm,
  FieldArray,
  formValueSelector
} from "redux-form";
import { ComponentFormValues, ApplicationFormValues } from "../../actions";
import { CustomTextField } from "../Basic";
import { ValidatorRequired } from "../validator";
import { Components } from "./component";
import { RenderSharedEnvs, EnvTypeExternal } from "../Basic/env";
import { PropType } from "../../typings";
import { RootState } from "../../reducers";
import { connect } from "react-redux";

const useStyles = makeStyles((theme: Theme) => ({
  sectionHeader: {
    fontSize: 24,
    fontWeight: 400
  },
  sectionDiscription: {
    fontSize: 16,
    margin: "16px 0"
  },
  paper: {
    padding: theme.spacing(3),
    marginBottom: theme.spacing(5)
  }
}));

const mapStateToProps = (state: RootState) => {
  const selector = formValueSelector("application");

  const formComponents: PropType<
    ApplicationFormValues,
    "components"
  > = selector(state, "components");

  const sharedEnv: PropType<ApplicationFormValues, "sharedEnv"> = selector(
    state,
    "sharedEnv"
  );

  return {
    sharedEnv,
    formComponents
  };
};

export interface Props {}

function ApplicationFormRaw(
  props: Props &
    InjectedFormProps<ComponentFormValues, Props> &
    ReturnType<typeof mapStateToProps>
) {
  const { sharedEnv, handleSubmit, formComponents } = props;
  const classes = useStyles();
  const [value, setValue] = React.useState(0);
  console.log(props);

  const handleChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setValue(newValue);
  };

  const isEnvInSharedEnv = (envName: string) => {
    return !!sharedEnv.find(x => x.name === envName);
  };

  const missingVariables = Array.from(
    new Set(
      formComponents
        .map(component => {
          return component.env
            .filter(env => env.type === EnvTypeExternal)
            .map(env => env.name);
        })
        .reduce((acc, item) => acc.concat(item))
    )
  ).filter(x => !isEnvInSharedEnv(x));

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={1}>
          <Grid item xs={12} sm={12} md={8} lg={8} xl={6}>
            <Typography
              variant="h2"
              classes={{
                root: classes.sectionHeader
              }}
            >
              Basic
            </Typography>
            <Typography classes={{ root: classes.sectionDiscription }}>
              Basic information of this application
            </Typography>
            <Paper
              elevation={4}
              square
              classes={{
                root: classes.paper
              }}
            >
              <CustomTextField
                name="name"
                label="Name"
                margin
                validate={ValidatorRequired}
                helperText='The characters allowed in names are: digits (0-9), lower case letters (a-z), "-", and ".". Max length is 180.'
                placeholder="Please type the component name"
              />
            </Paper>

            <Typography
              variant="h2"
              classes={{
                root: classes.sectionHeader
              }}
            >
              Components
            </Typography>
            <Typography classes={{ root: classes.sectionDiscription }}>
              Select compoents you want to include into this application.
            </Typography>
            <Paper
              elevation={4}
              square
              classes={{
                root: classes.paper
              }}
            >
              <Components />
            </Paper>

            <Typography
              variant="h2"
              classes={{
                root: classes.sectionHeader
              }}
            >
              Shared Environment Variables
            </Typography>
            <Typography classes={{ root: classes.sectionDiscription }}>
              Shared environment variable is consistent amoung all components.
            </Typography>
            <Paper
              elevation={4}
              square
              classes={{
                root: classes.paper
              }}
            >
              <FieldArray
                name="sharedEnv"
                valid={true}
                component={RenderSharedEnvs}
                missingVariables={missingVariables}
              />
            </Paper>
          </Grid>
        </Grid>
        <Button variant="contained" color="primary" type="submit">
          Submit
        </Button>
      </form>
    </div>
  );
}

const initialValues: ApplicationFormValues = {
  id: "0",
  name: "a-sample-application",
  sharedEnv: [
    {
      name: "DATABASE_URL",
      value: "postgres://user:password@db.host.com:5432/db_name"
    }
  ],
  components: [
    {
      id: "0",
      name: "api",
      image: "registry./bfd/api:count-of-stats",
      command: "/bin/api",
      env: [
        { name: "PORT", type: "static", value: "3000" },
        { name: "LOG_LEVEL", type: "static", value: "DEBUG" },
        { name: "ENGINE_URL", value: "engine:80", type: "static" },
        { name: "REDIS_URL", type: "external", value: "" },
        { name: "ENGINE_URL", type: "external", value: "" },
        { name: "JWT_SECRET", type: "external", value: "" },
        { name: "DATABASE_URL", type: "external", value: "" },
        { name: "KAFKA_ADDRESS", type: "external", value: "" },
        { name: "KUBE_NAMESPACE", type: "external", value: "" },
        { name: "RELAYER_ADDRESS", type: "external", value: "" },
        { name: "BLOCKCHAIN_NODE_URL", type: "external", value: "" },
        { name: "HOT_CONTRACT_ADDRESS", type: "external", value: "" },
        { name: "HYDRO_CONTRACT_ADDRESS", type: "external", value: "" }
      ],
      ports: [
        { name: "http", protocol: "TCP", containerPort: 3000, servicePort: 80 }
      ],
      cpu: 2600,
      memory: 2000,
      disk: []
    },
    {
      id: "1",
      name: "pnl",
      image: "registry./bfd/profit_and_loss:master",
      command: "/bin/api",
      env: [
        { name: "LOG_LEVEL", value: "DEBUG", type: "static" },
        { name: "REDIS_URL", value: "", type: "external" },
        { name: "REDIS_ADDR", value: "", type: "external" },
        { name: "DATABASE_URL", value: "", type: "external" },
        { name: "BFD_NAMESPACE", value: "", type: "external" },
        { name: "STOP_BLOCKNUM", value: "-1", type: "static" },
        { name: "SKIP_FORK_CHECK", value: "false", type: "static" },
        { name: "ETH_NODE_API_URL", value: "", type: "external" },
        {
          name: "FEED_PRICE_ADDRESS",
          value: "0x87d63f7589D27B0F0FDa9394300ea8EBBD0bDAce",
          type: "static"
        },
        { name: "BFD_CONTRACT_ADDRESS", value: "", type: "external" },
        { name: "KAFKA_BROKER_ADDRESS", value: "", type: "external" },
        { name: "STEP_SIZE_FOR_BIG_LAG", value: "500", type: "static" },
        { name: "STEP_SIZE_FOR_FORK_RE_RUN", value: "5000", type: "static" },
        {
          name: "INIT_START_SYNC_BLOCK_NUMBER",
          value: "6222007",
          type: "static"
        }
      ],
      ports: [
        { name: "http", protocol: "TCP", containerPort: 3000, servicePort: 80 }
      ],
      cpu: 2600,
      memory: 2000,
      disk: []
    },
    {
      id: "2",
      name: "web",
      image: "registry./bfd/web:master",
      command: "/bin/start_server",
      env: [
        { name: "BFD_WS", type: "external", value: "" },
        { name: "NETWORK_ID", type: "external", value: "" },
        { name: "API_VERSION", type: "static", value: "v4" },
        {
          name: "ETHEREUM_NODE_WS",
          type: "static",
          value: "wss://ethereum-jsonrpc-ropsten.intra./ws"
        },
        { name: "BFD_INTRA_API_URL", type: "external", value: "" },
        {
          name: "ETHEREUM_NODE_URL",
          type: "static",
          value: "https://ethereum-jsonrpc-ropsten.intra."
        },
        {
          name: "FORTMATIC_API_KEY",
          type: "static",
          value: "pk_test_BE70ABE584E3934E"
        },
        { name: "BFD_PUBLIC_API_URL", type: "external", value: "" },
        { name: "HYDRO_TOKEN_ADDRESS", type: "external", value: "" },
        { name: "HYDRO_CONTRACT_ADDRESS", type: "external", value: "" }
      ],
      ports: [
        { name: "http", protocol: "TCP", containerPort: 3000, servicePort: 80 }
      ],
      cpu: 2600,
      memory: 2000,
      disk: []
    },
    {
      id: "3",
      name: "web2",
      image: "registry./bfd/web:web2",
      command: "/bin/start_server",
      env: [],
      ports: [
        { name: "http", protocol: "TCP", containerPort: 3000, servicePort: 80 }
      ],
      cpu: 2600,
      memory: 2000,
      disk: []
    },
    {
      id: "4",
      name: "admin",
      image: "registry./bfd/admin:lending-pool-stats-price",
      command: "puma -b tcp://0.0.0.0:3000 -w 1 -t 0:16",
      env: [
        { name: "RAILS_ENV", type: "external", value: "" },
        { name: "REDIS_URL", type: "external", value: "" },
        { name: "BLOCKCHAIN", type: "external", value: "" },
        { name: "ENGINE_URL", type: "static", value: "engine:80" },
        { name: "SEED_ENABLE", type: "static", value: "true" },
        { name: "DATABASE_URL", type: "external", value: "" },
        {
          name: "SECRET_KEY_BASE",
          type: "static",
          value:
            "568eec62c04e2b0d02710d6cbe21dd419fee2dd9aee5cbae3d8b1421e01ebc935bf6c9d00cd8cf424b3e69a0b256f4cd16711ec45bd093cad32a18c6adafb0cc"
        },
        { name: "ETHERSCAN_DOMAIN", type: "external", value: "" },
        { name: "BLOCKCHAIN_NODE_URL", type: "external", value: "" },
        { name: "RAILS_LOG_TO_STDOUT", type: "static", value: "true" }
      ],
      ports: [
        { name: "http", protocol: "TCP", containerPort: 3000, servicePort: 80 }
      ],
      cpu: 2600,
      memory: 2000,
      disk: []
    },
    {
      id: "5",
      name: "engine",
      image: "registry./bfd/engine:avg-trade-price",
      command: "/bin/engine",
      env: [
        { name: "APP_NAME", type: "static", value: "engine" },
        { name: "ETCD_HOST", type: "static", value: "http://etcd:2379" },
        { name: "REDIS_URL", type: "external", value: "" },
        { name: "BLOCKCHAIN", type: "external", value: "" },
        { name: "DATABASE_URL", type: "external", value: "" },
        { name: "DDEX_NAMESPACE", type: "external", value: "" },
        { name: "RELAYER_ADDRESS", type: "external", value: "" },
        { name: "DB_MAX_IDLE_CONN", type: "static", value: "5" },
        { name: "DB_MAX_OPEN_CONN", type: "static", value: "5" },
        { name: "DDEX_API_ENDPOINT", type: "external", value: "" },
        { name: "DDEX_KAFKA_ADDRESS", type: "external", value: "" },
        { name: "BLOCKCHAIN_NODE_URL", type: "external", value: "" },
        { name: "HYDRO_PROXY_ADDRESS", type: "external", value: "" },
        { name: "BFD_CONTRACT_ADDRESS", type: "external", value: "" },
        { name: "HOT_CONTRACT_ADDRESS", type: "external", value: "" },
        { name: "HYDRO_CONTRACT_ADDRESS", type: "external", value: "" },
        { name: "PRICE_FETCHER_API_ENDPOINT", type: "external", value: "" },
        {
          name: "RELAYER_ADDRESS_PRIVATE_KEY",
          type: "external",
          value: ""
        }
      ],
      ports: [
        { name: "http", protocol: "TCP", containerPort: 3000, servicePort: 80 }
      ],
      cpu: 2600,
      memory: 2000,
      disk: []
    }
  ]
};

export default reduxForm<ComponentFormValues, Props>({
  form: "application",
  initialValues,
  onSubmitFail: (...args) => {
    console.log("submit failed", args);
  }
})(connect(mapStateToProps)(ApplicationFormRaw));
