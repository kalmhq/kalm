import MockApi from "./mockApi";
import RealApi from "./realApi";
import { Api } from "./base";

export const api: Api = process.env.REACT_APP_USE_MOCK_API ? new MockApi() : new RealApi();
