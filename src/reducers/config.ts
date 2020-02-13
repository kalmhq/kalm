import Immutable from "immutable";
import { ImmutableMap } from "../typings";
import {
  CREATE_CONFIG_ACTION,
  ConfigFormValues,
  UPDATE_CONFIG_ACTION,
  DELETE_CONFIG_ACTION
} from "../actions";
import { Actions } from "../actions";

export type State = ImmutableMap<{
  configs: Immutable.OrderedMap<string, ConfigFormValues>;
}>;

const initialState: State = Immutable.Map({
  configs: Immutable.Map({
    id: "0",
    type: "folder",
    name: "/",
    content: "",
    children: [
      {
        id: "1",
        type: "folder",
        name: "nginx configs",
        content: "",
        children: [
          {
            id: "2",
            type: "folder",
            name: "sites-available",
            content: "",
            children: [
              {
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
                children: []
              },
              {
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
                children: []
              }
            ]
          },
          {
            id: "5",
            type: "folder",
            name: "sites-enabled",
            content: "",
            children: [
              {
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
                children: []
              },
              {
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
                children: []
              }
            ]
          },
          {
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
            children: []
          }
        ]
      },
      {
        id: "9",
        type: "folder",
        name: "dae configs",
        content: "",
        children: [
          {
            id: "10",
            type: "folder",
            name: "DDEX configs",
            content: "",
            children: [
              {
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
                children: []
              },
              {
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
                children: []
              }
            ]
          },
          {
            id: "13",
            type: "folder",
            name: "BFD configs",
            content: "",
            children: [
              {
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
                children: []
              },
              {
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
                children: []
              }
            ]
          },
          {
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
            children: []
          }
        ]
      },
      {
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
        children: []
      }
    ]
  })
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case CREATE_CONFIG_ACTION: {
      const configs = state.get("configs");
      const tmpId = configs.size.toString(); // TODO fake id
      state = state.set(
        "configs",
        configs.set(
          tmpId, // TODO fake id
          action.payload.config
        )
      );
      break;
    }
    case UPDATE_CONFIG_ACTION: {
      const configs = state.get("configs");
      const id = action.payload.configId;
      state = state.set("configs", configs.set(id, action.payload.config));
      break;
    }
    case DELETE_CONFIG_ACTION: {
      state = state.deleteIn(["configs", action.payload.configId]);
      break;
    }
  }

  return state;
};

export default reducer;
