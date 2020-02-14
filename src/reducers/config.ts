import Immutable from "immutable";
import { ImmutableMap } from "../typings";
import {
  CREATE_CONFIG_ACTION,
  ConfigFormValues,
  UPDATE_CONFIG_ACTION,
  DELETE_CONFIG_ACTION,
  SET_CURRENT_CONFIG_ID_CHAIN
} from "../actions";
import { Actions } from "../actions";

export type State = ImmutableMap<{
  currentConfigIdChain: string[];
  rootConfig: ConfigFormValues;
}>;

const initialState: State = Immutable.Map({
  currentConfigIdChain: ["0"],
  rootConfig: Immutable.fromJS({
    id: "0",
    type: "folder",
    name: "root",
    content: "",
    children: {
      "1": {
        id: "1",
        type: "folder",
        name: "nginx configs",
        content: "",
        children: {
          "2": {
            id: "2",
            type: "folder",
            name: "sites-available",
            content: "",
            children: {
              "3": {
                id: "3",
                type: "file",
                name: "test1.conf",
                content: `server {
                  listen 80;
                  server_name regolar.wanglei.me;
              
                  location / {
                      proxy_set_header   X-Real-IP $remote_addr;
                      proxy_set_header   Host      $http_host;
                      proxy_pass         http://localhost:8081;
                  }
                }`,
                children: {}
              },
              "4": {
                id: "4",
                type: "file",
                name: "test2.conf",
                content: `server {
                  listen 80;
                  server_name test.wanglei.me;
              
                  location / {
                      proxy_set_header   X-Real-IP $remote_addr;
                      proxy_set_header   Host      $http_host;
                      proxy_pass         http://localhost:8081;
                  }
                }`,
                children: {}
              }
            }
          },
          "5": {
            id: "5",
            type: "folder",
            name: "sites-enabled",
            content: "",
            children: {
              "6": {
                id: "6",
                type: "file",
                name: "test1.conf",
                content: `server {
                  listen 80;
                  server_name regolar.wanglei.me;
              
                  location / {
                      proxy_set_header   X-Real-IP $remote_addr;
                      proxy_set_header   Host      $http_host;
                      proxy_pass         http://localhost:8081;
                  }
                }`,
                children: {}
              },
              "7": {
                id: "7",
                type: "file",
                name: "test2.conf",
                content: `server {
                  listen 80;
                  server_name test.wanglei.me;
              
                  location / {
                      proxy_set_header   X-Real-IP $remote_addr;
                      proxy_set_header   Host      $http_host;
                      proxy_pass         http://localhost:8081;
                  }
                }`,
                children: {}
              }
            }
          },
          "8": {
            id: "8",
            type: "file",
            name: "nginx.conf",
            content: `server {
              listen 80;
              server_name regolar.wanglei.me;
          
              location / {
                  proxy_set_header   X-Real-IP $remote_addr;
                  proxy_set_header   Host      $http_host;
                  proxy_pass         http://localhost:8081;
              }
            }`,
            children: {}
          }
        }
      },
      "9": {
        id: "9",
        type: "folder",
        name: "dae configs",
        content: "",
        children: {
          "10": {
            id: "10",
            type: "folder",
            name: "DDEX configs",
            content: "",
            children: {
              "11": {
                id: "11",
                type: "file",
                name: "test1.json",
                content: `{
                  "POSTGRES_PASSWORD": "db-pass",
                  "POSTGRES_USER": "db-admin",
                  "POSTGRES_DB": "db-name",
                  "NODE_ENV": "production",
                  "RAILS_ENV": "production",
                }`,
                children: {}
              },
              "12": {
                id: "12",
                type: "file",
                name: "test2.json",
                content: `{
                  "POSTGRES_PASSWORD": "db-pass",
                  "POSTGRES_USER": "db-admin",
                  "POSTGRES_DB": "db-name",
                  "NODE_ENV": "production",
                  "RAILS_ENV": "production",
                }`,
                children: {}
              }
            }
          },
          "13": {
            id: "13",
            type: "folder",
            name: "BFD configs",
            content: "",
            children: {
              "14": {
                id: "14",
                type: "file",
                name: "test1.json",
                content: `{
                  "POSTGRES_PASSWORD": "db-pass",
                  "POSTGRES_USER": "db-admin",
                  "POSTGRES_DB": "db-name",
                  "NODE_ENV": "production",
                  "RAILS_ENV": "production",
                }`,
                children: {}
              },
              "15": {
                id: "15",
                type: "file",
                name: "test2.json",
                content: `{
                  "POSTGRES_PASSWORD": "db-pass",
                  "POSTGRES_USER": "db-admin",
                  "POSTGRES_DB": "db-name",
                  "NODE_ENV": "production",
                  "RAILS_ENV": "production",
                }`,
                children: {}
              }
            }
          },
          "16": {
            id: "16",
            type: "file",
            name: "daetest.json",
            content: `{
              "POSTGRES_PASSWORD": "db-pass",
              "POSTGRES_USER": "db-admin",
              "POSTGRES_DB": "ddex",
              "NODE_ENV": "production",
              "RAILS_ENV": "production",
            }`,
            children: {}
          }
        }
      },
      "17": {
        id: "17",
        type: "file",
        name: "config file 1",
        content: `{
          "POSTGRES_PASSWORD": "db-pass",
          "POSTGRES_USER": "db-admin",
          "POSTGRES_DB": "ddex",
          "NODE_ENV": "production",
          "RAILS_ENV": "production",
        }`,
        children: {}
      }
    }
  })
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case SET_CURRENT_CONFIG_ID_CHAIN: {
      const idChain = action.payload.idChain;
      state = state.set("currentConfigIdChain", idChain);
      break;
    }
    case CREATE_CONFIG_ACTION: {
      const configs = state.get("rootConfig");

      break;
    }
    case UPDATE_CONFIG_ACTION: {
      const configs = state.get("rootConfig");
      const id = action.payload.configId;
      break;
    }
    case DELETE_CONFIG_ACTION: {
      state = state.deleteIn(["rootConfig", action.payload.configId]);
      break;
    }
  }

  return state;
};

export default reducer;
