import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { statusCode } from "../enum";
import type { Response } from "express";

export interface ApiResponse<T> {
  status: number;
  message: string;
  data?: T;
}

export function createResponse<T>(
  status: number,
  message: string,
  data?: T
): ApiResponse<T> {
  return { status, message, data };
}

export function createErrorResponse<T = object>(
  status: number,
  message: string,
  data?: T
): ApiResponse<T> {
  return { status, message, data };
}

export function removeMetadataFields(data: any) {
  if (Array.isArray(data)) {
    // If data is an array, apply function recursively to each element
    data.forEach((item) => removeMetadataFields(item));
  } else if (data && typeof data === "object") {
    // Delete metadata fields
    const metadataFields = [
      "createdAt",
      "updatedAt",
      "deletedAt",
      "createdBy",
      "updatedBy",
    ];
    metadataFields.forEach((field) => delete data[field]);

    // Recursively process each object property
    Object.keys(data).forEach((key) => {
      if (typeof data[key] === "object" && data[key] !== null) {
        removeMetadataFields(data[key]);
      }
    });
  }
}

export function addMetadataFields(data: any, metadata: Record<string, any>) {
  if (Array.isArray(data)) {
    // If data is an array, apply function recursively to each element
    data.forEach((item) => addMetadataFields(item, metadata));
  } else if (data && typeof data === "object") {
    // Add metadata fields
    Object.assign(data, metadata);

    // Recursively process each object property
    Object.keys(data).forEach((key) => {
      if (typeof data[key] === "object" && data[key] !== null) {
        addMetadataFields(data[key], metadata);
      }
    });
  }
}

/**
 * Removes HTML tags from a given string.
 * @param html - The HTML string to process.
 */
export function removeHtmlTags(html: string): string {
  if (!html) return "";
  return html.replace(/<\/?[^>]+(>|$)/g, "").trim();
}

export function handleErrorResponse(
  error: Error,
  res: Response,
  notFoundMessage: string = "Resource not found",
  forbiddenMessage: string = "Forbidden",
  badRequestMessage: string = "Bad request"
) {
  if (error instanceof NotFoundException) {
    return res
      .status(statusCode.notFound)
      .json(
        createErrorResponse(
          statusCode.notFound,
          error.message ? error.message : notFoundMessage
        )
      );
  } else if (error instanceof ForbiddenException) {
    return res
      .status(statusCode.forbidden)
      .json(
        createErrorResponse(
          statusCode.forbidden,
          error.message ? error.message : forbiddenMessage
        )
      );
  } else {
    return res
      .status(statusCode.badRequest)
      .json(
        createErrorResponse(
          statusCode.badRequest,
          error.message ? error.message : badRequestMessage
        )
      );
  }
}

export function removeLookUpDataFields(data: any) {
  if (Array.isArray(data)) {
    // If data is an array, apply function recursively to each element
    data.forEach((item) => removeLookUpDataFields(item));
  } else if (data && typeof data === "object") {
    // Delete lookup metadata fields
    const metadataFields = [
      "lookUpKey",
      "lookUpName",
      "lookUpValueKey",
      "createdBy",
      "description",
      "lookUpOrder",
    ];
    metadataFields.forEach((field) => delete data[field]);

    // Recursively process each object property
    Object.keys(data).forEach((key) => {
      if (typeof data[key] === "object" && data[key] !== null) {
        removeLookUpDataFields(data[key]);
      }
    });
  }
}
