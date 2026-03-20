import { env } from "../config/env.js";
import type {
  SalesforceDescribeObjectResponse,
  SalesforceQueryResponse
} from "./types.js";

export class SalesforceClient {
  private readonly baseUrl: string;
  private readonly apiVersion: string;
  private readonly token: string;

  constructor() {
    this.baseUrl = env.salesforceBaseUrl;
    this.apiVersion = env.salesforceApiVersion;
    this.token = env.salesforceAccessToken;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(
      `${this.baseUrl}/services/data/${this.apiVersion}${path}`,
      {
        ...init,
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
          ...(init?.headers ?? {})
        }
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Salesforce API error ${response.status}: ${text}`);
    }

    return (await response.json()) as T;
  }

  async describeObject(objectName: string): Promise<SalesforceDescribeObjectResponse> {
    return this.request<SalesforceDescribeObjectResponse>(`/sobjects/${objectName}/describe`);
  }

  async query<T = Record<string, unknown>>(soql: string): Promise<SalesforceQueryResponse<T>> {
    return this.request<SalesforceQueryResponse<T>>(
      `/query?q=${encodeURIComponent(soql)}`
    );
  }

  async createRecord(objectName: string, payload: Record<string, unknown>): Promise<{ id: string; success: boolean; errors: string[] }> {
    return this.request<{ id: string; success: boolean; errors: string[] }>(
      `/sobjects/${objectName}`,
      {
        method: "POST",
        body: JSON.stringify(payload)
      }
    );
  }

  async getRecordById<T = Record<string, unknown>>(
    objectName: string,
    recordId: string,
    fields: string[]
  ): Promise<T> {
    const query = `SELECT ${fields.join(", ")} FROM ${objectName} WHERE Id = '${recordId}' LIMIT 1`;
    const result = await this.query<T>(query);

    if (!result.records.length) {
      throw new Error(`Record not found: ${recordId}`);
    }

    return result.records[0];
  }
}
