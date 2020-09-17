import axios from "axios";
import { ThunkResult } from "types";
import {
  INIT_DOMAIN_STATUS,
  SET_DOMAIN_A_RECORDS,
  SET_DOMAIN_CNAME,
  SET_DOMAIN_NS,
  LOADED_DOMAIN_STATUS,
} from "types/domain";
import { GoogleDNSARecordResponse, GoogleDNSCNAMEResponse, GoogleDNSNSResponse } from "types/dns";
import { acmePrefix } from "widgets/DomainStatus";

export const loadDomainDNSInfo = (domain: string): ThunkResult<void> => {
  return async (dispatch, getState) => {
    const currentDomainInfo = getState().domain[domain];
    if (currentDomainInfo) {
      return;
    }
    dispatch({ type: INIT_DOMAIN_STATUS, payload: { domain } });
    await dispatch(loadDomainDNSInfoWithType(domain, "A"));
    await dispatch(loadDomainDNSInfoWithType(domain, "CNAME"));
    await dispatch(loadDomainDNSInfoWithType(acmePrefix + domain, "CNAME"));
    await dispatch(loadDomainDNSInfoWithType(domain, "NS"));
  };
};

export const loadDomainDNSInfoWithType = (domain: string, type: "A" | "CNAME" | "NS"): ThunkResult<void> => {
  return async (dispatch) => {
    const res = await axios.get(`https://dns.google.com/resolve?name=${domain}&type=${type}`);
    if (type === "A") {
      try {
        const aRecords = (res.data.Answer as GoogleDNSARecordResponse[]).map((aRecord) => aRecord.data);
        dispatch({ type: SET_DOMAIN_A_RECORDS, payload: { domain, aRecords } });
      } catch (error) {
        // console.log("loadDomainDNSInfoWithType exception: A ", domain, res.data, error);
      }
      dispatch({ type: LOADED_DOMAIN_STATUS, payload: { domain } });
    }
    if (type === "CNAME") {
      try {
        const cname = (res.data.Authority as GoogleDNSCNAMEResponse[])[0].data;
        dispatch({ type: SET_DOMAIN_CNAME, payload: { domain, cname } });
      } catch (error) {
        // console.log("loadDomainDNSInfoWithType exception: CNAME ", domain, res.data, error);
      }
      dispatch({ type: LOADED_DOMAIN_STATUS, payload: { domain } });
    }
    if (type === "NS") {
      try {
        const ns = (res.data.Answer as GoogleDNSNSResponse[]).map((aRecord) => aRecord.data);
        dispatch({ type: SET_DOMAIN_NS, payload: { domain, ns } });
      } catch (error) {
        // console.log("loadDomainDNSInfoWithType exception: NS ", domain, res.data, error);
      }
      dispatch({ type: LOADED_DOMAIN_STATUS, payload: { domain } });
    }
  };
};
