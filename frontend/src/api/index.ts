import MockApi from "./mockApi";
import RealApi from "./realApi";

export const api = process.env.REACT_APP_USE_MOCK_API ? new MockApi() : new RealApi();
