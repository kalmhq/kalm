import ApiClass from "@apiType/index";
import { Api } from "./base";

export const api: Api = new ApiClass();
// process.env.REACT_APP_USE_MOCK_API === "true" || process.env.NODE_ENV === "test" ? new MockApi() : new RealApi();
