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

  async createCustomObject(
    objectName: string,
    label: string,
    pluralLabel: string,
    fields: Array<{
      fullName: string;
      label: string;
      type: string;
      length?: number;
      required?: boolean;
      description?: string;
    }>
  ): Promise<{ success: boolean; id?: string; errors?: string[] }> {
    // Generate the SOAP fields XML
    const fieldsXml = fields.map(field => {
      let extra = "";
      if (field.length) {
        extra += `\n          <met:length>${field.length}</met:length>`;
      }
      if (field.type === "LongTextArea") {
        extra += `\n          <met:visibleLines>3</met:visibleLines>`;
      }
      if (field.description) {
        extra += `\n          <met:description>${this.escapeXml(field.description)}</met:description>`;
      }
      
      return `
        <met:fields>
          <met:fullName>${this.escapeXml(field.fullName)}__c</met:fullName>
          <met:label>${this.escapeXml(field.label)}</met:label>
          <met:type>${field.type}</met:type>${extra}
          <met:required>${field.required || false}</met:required>
        </met:fields>`;
    }).join("");

    const metadataXml = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:met="http://soap.sforce.com/2006/04/metadata">
  <soapenv:Header>
    <met:SessionHeader>
      <met:sessionId>${this.token}</met:sessionId>
    </met:SessionHeader>
  </soapenv:Header>
  <soapenv:Body>
    <met:createMetadata>
      <met:metadata xsi:type="met:CustomObject" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
        <met:fullName>${this.escapeXml(objectName)}__c</met:fullName>
        <met:label>${this.escapeXml(label)}</met:label>
        <met:pluralLabel>${this.escapeXml(pluralLabel)}</met:pluralLabel>
        <met:nameField>
          <met:label>${this.escapeXml(label)} Name</met:label>
          <met:type>Text</met:type>
        </met:nameField>${fieldsXml}
        <met:deploymentStatus>Deployed</met:deploymentStatus>
        <met:sharingModel>ReadWrite</met:sharingModel>
        <met:allowInChatterGroups>false</met:allowInChatterGroups>
        <met:enableActivities>false</met:enableActivities>
        <met:enableBulkApi>true</met:enableBulkApi>
        <met:enableFeeds>false</met:enableFeeds>
        <met:enableHistory>false</met:enableHistory>
        <met:enableReports>true</met:enableReports>
        <met:enableSearch>true</met:enableSearch>
        <met:enableSharing>true</met:enableSharing>
        <met:enableStreamingApi>true</met:enableStreamingApi>
      </met:metadata>
    </met:createMetadata>
  </soapenv:Body>
</soapenv:Envelope>`;

    const apiVersionNumber = this.apiVersion.startsWith('v') ? this.apiVersion.substring(1) : this.apiVersion;
    const soapUrl = `${this.baseUrl}/services/Soap/m/${apiVersionNumber}`;

    const response = await fetch(soapUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml",
        "SOAPAction": "createMetadata"
      },
      body: metadataXml
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, errors: [`Salesforce SOAP API error ${response.status}: ${text}`] };
    }

    const responseText = await response.text();
    
    if (responseText.includes("faultstring")) {
      const match = responseText.match(/<faultstring>(.*?)<\/faultstring>/);
      const errorStr = match ? match[1] : "Unknown SOAP error";
      return { success: false, errors: [errorStr] };
    }

    return { success: true };
  }

  private escapeXml(unsafe: string): string {
    if (!unsafe) return "";
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }
  async updateRecord(objectName: string, recordId: string, payload: Record<string, unknown>): Promise<{ success: boolean; errors: string[] }> {
    try {
      await this.request<{ success: boolean; errors: string[] }>(
        `/sobjects/${objectName}/${recordId}`,
        {
          method: "PATCH",
          body: JSON.stringify(payload)
        }
      );
      return { success: true, errors: [] };
    } catch (e: any) {
      return { success: false, errors: [e.message] };
    }
  }

  async createApexClass(className: string, body: string): Promise<{ success: boolean; id?: string; errors?: string[] }> {
    const payload = {
      Name: className,
      Body: body
    };
    
    try {
      const res = await this.request<{ id: string; success: boolean; errors: string[] }>(
        `/tooling/sobjects/ApexClass`,
        {
          method: "POST",
          body: JSON.stringify(payload)
        }
      );
      return { success: true, id: res.id, errors: [] };
    } catch (e: any) {
      return { success: false, errors: [e.message] };
    }
  }

  async createLWCBundle(bundleName: string, html: string, js: string, metaXml: string): Promise<{ success: boolean; errors?: string[] }> {
    try {
      // 1. Create Bundle
      // We parse the api structure from standard metadata or just upload loosely
      // Often Tooling API needs purely the object
      const bundleResponse = await this.request<{ id: string; success: boolean; errors: string[] }>(
        `/tooling/sobjects/LightningComponentBundle`,
        {
          method: "POST",
          body: JSON.stringify({
            FullName: bundleName,
            Metadata: {
              apiVersion: parseFloat(this.apiVersion.replace('v', '')),
              isExposed: true
            }
          })
        }
      );

      const bundleId = bundleResponse.id;

      // 2. Upload JS
      await this.request(`/tooling/sobjects/LightningComponentResource`, {
        method: "POST",
        body: JSON.stringify({
          LightningComponentBundleId: bundleId,
          Format: "js",
          Source: js,
          FilePath: `lwc/${bundleName}/${bundleName}.js`
        })
      });

      // 3. Upload HTML
      if (html) {
        await this.request(`/tooling/sobjects/LightningComponentResource`, {
          method: "POST",
          body: JSON.stringify({
            LightningComponentBundleId: bundleId,
            Format: "html",
            Source: html,
            FilePath: `lwc/${bundleName}/${bundleName}.html`
          })
        });
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, errors: [e.message] };
    }
  }

  async createCustomField(objectName: string, field: any): Promise<{ success: boolean; errors?: string[] }> {
    const metadataXml = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:met="http://soap.sforce.com/2006/04/metadata">
  <soapenv:Header>
    <met:SessionHeader>
      <met:sessionId>${this.token}</met:sessionId>
    </met:SessionHeader>
  </soapenv:Header>
  <soapenv:Body>
    <met:createMetadata>
      <met:metadata xsi:type="met:CustomField" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
        <met:fullName>${this.escapeXml(objectName)}__c.${this.escapeXml(field.fullName)}__c</met:fullName>
        <met:label>${this.escapeXml(field.label)}</met:label>
        <met:type>${field.type}</met:type>
        ${field.length ? `<met:length>${field.length}</met:length>` : ''}
        ${field.type === 'LongTextArea' ? '<met:visibleLines>3</met:visibleLines>' : ''}
        <met:required>${field.required || false}</met:required>
      </met:metadata>
    </met:createMetadata>
  </soapenv:Body>
</soapenv:Envelope>`;
    return this.deployRawMetadata(metadataXml);
  }

  async deployRawMetadata(rawXml: string): Promise<{ success: boolean; errors?: string[] }> {
    const apiVersionNumber = this.apiVersion.startsWith('v') ? this.apiVersion.substring(1) : this.apiVersion;
    const soapUrl = `${this.baseUrl}/services/Soap/m/${apiVersionNumber}`;

    const response = await fetch(soapUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml",
        "SOAPAction": '""'
      },
      body: rawXml
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, errors: [`Salesforce SOAP API error ${response.status}: ${text}`] };
    }

    const responseText = await response.text();
    if (responseText.includes("faultstring")) {
      const match = responseText.match(/<faultstring>(.*?)<\/faultstring>/);
      const errorStr = match ? match[1] : "Unknown SOAP error";
      return { success: false, errors: [errorStr] };
    }
    return { success: true };
  }
}
