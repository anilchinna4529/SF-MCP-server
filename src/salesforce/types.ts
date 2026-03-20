export interface SalesforceDescribeField {
  name: string;
  label: string;
  type: string;
  length?: number;
  nillable?: boolean;
  createable?: boolean;
  updateable?: boolean;
}

export interface SalesforceDescribeObjectResponse {
  name: string;
  label: string;
  keyPrefix?: string;
  fields: SalesforceDescribeField[];
}

export interface SalesforceQueryResponse<T = Record<string, unknown>> {
  totalSize: number;
  done: boolean;
  records: T[];
}
