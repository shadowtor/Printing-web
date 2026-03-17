import { env } from "../config/index.js";
import {
  getLatestPrinterAssignmentByOrderLineId,
  updatePrinterAssignmentStatusById
} from "./printer-assignment-service.js";

export class ConnectorClientError extends Error {
  constructor(
    message: string,
    public code:
      | "CONNECTOR_NOT_CONFIGURED"
      | "ASSIGNMENT_NOT_FOUND"
      | "CONNECTOR_REQUEST_FAILED"
      | "CONNECTOR_RESPONSE_INVALID"
  ) {
    super(message);
    this.name = "ConnectorClientError";
  }
}

interface ConnectorDispatchResponse {
  connectorJobId?: string;
  status?: string;
  [key: string]: unknown;
}

export async function dispatchPreparedAssignment(orderLineId: string) {
  if (!env.CONNECTOR_API_URL) {
    throw new ConnectorClientError(
      "Connector API URL is not configured. Set CONNECTOR_API_URL to enable dispatch.",
      "CONNECTOR_NOT_CONFIGURED"
    );
  }

  const assignment = await getLatestPrinterAssignmentByOrderLineId(orderLineId);
  if (!assignment) {
    throw new ConnectorClientError(
      "No prepared printer assignment found for this order line.",
      "ASSIGNMENT_NOT_FOUND"
    );
  }

  const requestUrl = `${env.CONNECTOR_API_URL.replace(/\/+$/, "")}/api/v1/jobs`;
  let response: Response;
  try {
    response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(env.CONNECTOR_API_KEY ? { authorization: `Bearer ${env.CONNECTOR_API_KEY}` } : {})
      },
      body: JSON.stringify({ assignmentId: assignment.id, payload: assignment.payload })
    });
  } catch (error) {
    throw new ConnectorClientError(
      `Failed to reach connector service: ${error instanceof Error ? error.message : "unknown error"}`,
      "CONNECTOR_REQUEST_FAILED"
    );
  }

  if (!response.ok) {
    const text = await response.text();
    throw new ConnectorClientError(
      `Connector request failed with ${response.status}: ${text.slice(0, 300)}`,
      "CONNECTOR_REQUEST_FAILED"
    );
  }

  let responseBody: ConnectorDispatchResponse | undefined;
  try {
    responseBody = (await response.json()) as ConnectorDispatchResponse;
  } catch {
    throw new ConnectorClientError(
      "Connector returned a non-JSON response for dispatch.",
      "CONNECTOR_RESPONSE_INVALID"
    );
  }

  await updatePrinterAssignmentStatusById(assignment.id, "dispatched");

  return {
    assignmentId: assignment.id,
    orderLineId: assignment.orderLineId,
    status: "dispatched",
    connector: responseBody
  };
}
