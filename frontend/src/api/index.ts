import MockApi from "./mockApi";
import RealApi from "./realApi";
import { Api } from "./base";

export const api: Api =
  process.env.REACT_APP_USE_MOCK_API === "true" || process.env.NODE_ENV === "test" ? new MockApi() : new RealApi();
