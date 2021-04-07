export interface GoogleDNSARecordResponse {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

export interface GoogleDNSCNAMEResponse {
  TTL: number;
  data: string;
  name: string;
  type: number;
}

interface GoogleDNSNSResponse {
  TTL: number;
  data: string;
  name: string;
  type: number;
}
