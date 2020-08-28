import axios from "axios";
import { ThunkResult } from "types";
import { INIT_DOMAIN_STATUS, SET_DOMAIN_A_RECORDS, SET_DOMAIN_CNAME } from "types/domain";
import { GoogleDNSARecordResponse, GoogleDNSCNAMEResponse } from "types/dns";

export const loadDomainDNSInfo = (domain: string): ThunkResult<void> => {
  return async (dispatch, getState) => {
    const currentDomainInfo = getState().get("domain").get(domain);
    if (currentDomainInfo) {
      return;
    }
    dispatch({ type: INIT_DOMAIN_STATUS, payload: { domain } });
    await dispatch(loadDomainDNSInfoWithType(domain, "A"));
    await dispatch(loadDomainDNSInfoWithType(domain, "CNAME"));
    await dispatch(loadDomainDNSInfoWithType(domain, "NS"));
  };
};

export const loadDomainDNSInfoWithType = (domain: string, type: "A" | "CNAME" | "NS"): ThunkResult<void> => {
  return async (dispatch) => {
    try {
      const res = await axios.get(`https://dns.google.com/resolve?name=${domain}&type=${type}`);
      if (res.data.Answer) {
        const aRecords = (res.data.Answer as GoogleDNSARecordResponse[]).map((aRecord) => aRecord.data);
        dispatch({ type: SET_DOMAIN_A_RECORDS, payload: { domain, aRecords } });
      }
      if (res.data.Authority) {
        const cname = (res.data.Authority as GoogleDNSCNAMEResponse[])[0].data;
        dispatch({ type: SET_DOMAIN_CNAME, payload: { domain, cname } });
      }
      if (res.data && !res.data.Authority && !res.data.Answer) {
        // dispatch({ type: SET_DOMAIN_CNAME, payload: { domain, } });
      }
    } catch (e) {
      console.log(e);
    }
  };
};
