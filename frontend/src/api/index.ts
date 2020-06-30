import MockApi from "./mockApi";
import RealApi from "./realApi";
import { Api } from "./base";

export const api: Api = process.env.REACT_APP_USE_MOCK_API === "true" ? new MockApi() : new RealApi();
