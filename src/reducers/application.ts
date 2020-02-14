import Immutable from "immutable";
import { ImmutableMap } from "../typings";
import {
  CREATE_APPLICATION_ACTION,
  UPDATE_APPLICATION_ACTION,
  DELETE_APPLICATION_ACTION,
  Application,
  StatusTypeCreating,
  StatusTypePending,
  StatusTypeError,
  DUPLICATE_APPLICATION_ACTION
} from "../actions";
import { Actions } from "../actions";

export type State = ImmutableMap<{
  applications: Immutable.OrderedMap<string, Application>;
}>;

const sampleApplication: Application = Immutable.fromJS({
  id: "0",
  name: "a-sample-application",
  isEnabled: false,
  sharedEnv: [
    { name: "POSTGRES_PASSWORD", value: "password" },
    { name: "POSTGRES_USER", value: "admin" },
    { name: "POSTGRES_DB", value: "ddex" },
    { name: "NODE_ENV", value: "production" },
    { name: "RAILS_ENV", value: "production" },
    { name: "REDIS_URL", value: "redis://redis:6379" },
    { name: "REDIS_ADDR", value: "redis:6379" },
    { name: "REDIS_URL_WITH_DB", value: "redis://redis:6379/0" },
    {
      name: "DATABASE_URL",
      value: "postgresql://admin:password@postgres:5432/ddex?sslmode=disable"
    },
    { name: "ETCD_URL", value: "http://etcd:2379" },
    { name: "KAFKA_ADDRESS", value: "kafka:9092" },
    { name: "NAMESPACE", value: "ropsten" },
    { name: "API_URL", value: "http://api" },
    { name: "PRICE_URL", value: "http://localhost:3005" },
    { name: "PUBLIC_API_URL", value: "https://bfd-xxxxxx-api.xxx." },
    { name: "WS_URL", value: "wss://bfd-xxxxx-ws.xxx." },
    { name: "ETHERSCAN_DOMAIN", value: "https://ropsten.etherscan.io" },
    { name: "JWT_SECRET", value: "some value" }
  ],
  status: Immutable.Map({
    status: StatusTypeCreating,
    components: Immutable.List([])
  }),
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
        {
          name: "http",
          protocol: "TCP",
          containerPort: 3000,
          servicePort: 80
        }
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
        {
          name: "STEP_SIZE_FOR_FORK_RE_RUN",
          value: "5000",
          type: "static"
        },
        {
          name: "INIT_START_SYNC_BLOCK_NUMBER",
          value: "6222007",
          type: "static"
        }
      ],
      ports: [
        {
          name: "http",
          protocol: "TCP",
          containerPort: 3000,
          servicePort: 80
        }
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
        {
          name: "http",
          protocol: "TCP",
          containerPort: 3000,
          servicePort: 80
        }
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
        {
          name: "http",
          protocol: "TCP",
          containerPort: 3000,
          servicePort: 80
        }
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
        {
          name: "http",
          protocol: "TCP",
          containerPort: 3000,
          servicePort: 80
        }
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
        {
          name: "http",
          protocol: "TCP",
          containerPort: 3000,
          servicePort: 80
        }
      ],
      cpu: 2600,
      memory: 2000,
      disk: []
    }
  ]
});

const initialState: State = Immutable.Map({
  applications: Immutable.OrderedMap({
    "0": sampleApplication,
    "1": sampleApplication
      .set("id", "1")
      .set("name", sampleApplication.get("name") + "-duplicate-1")
      .setIn(["status", "status"], StatusTypePending),
    "2": sampleApplication
      .set("id", "2")
      .set("name", sampleApplication.get("name") + "-duplicate-2")
      .setIn(["status", "status"], StatusTypeError)
  })
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case CREATE_APPLICATION_ACTION: {
      const applications = state.get("applications");
      const tmpId = applications.size.toString(); // TODO fake id
      let applicationValues = action.payload.applicationValues;
      applicationValues = applicationValues.set("id", tmpId);
      state = state.set(
        "applications",
        applications.set(
          tmpId, // TODO fake id
          applicationValues
        )
      );
      break;
    }
    case UPDATE_APPLICATION_ACTION: {
      const applications = state.get("applications");
      const id = action.payload.applicationId;
      let applicationValues = action.payload.applicationValues;
      applicationValues = applicationValues.set("id", id);
      state = state.set(
        "applications",
        applications.set(id, applicationValues)
      );
      break;
    }
    case DELETE_APPLICATION_ACTION: {
      state = state.deleteIn(["applications", action.payload.applicationId]);
      break;
    }
    case DUPLICATE_APPLICATION_ACTION: {
      const applications = state.get("applications");
      const tmpId = applications.size.toString(); // TODO fake id

      let application = applications.get(action.payload.applicationId)!;
      application = application.set("id", tmpId);

      let i = 0;
      let name = "";
      do {
        i += 1;
        name = `${application.get("name")}-duplicate-${i}`;
      } while (applications.find(x => x.get("name") === name));

      application = application.set("name", name);
      state = state.set("applications", applications.set(tmpId, application));
      break;
    }
  }

  return state;
};

export default reducer;
