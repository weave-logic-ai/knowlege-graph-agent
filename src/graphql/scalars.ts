/**
 * GraphQL Custom Scalars
 *
 * Provides custom scalar type definitions for DateTime, JSON, and UUID types.
 * These scalars enable proper serialization/deserialization of complex data types
 * in the GraphQL schema.
 *
 * @module graphql/scalars
 */

import { GraphQLScalarType, Kind, ValueNode } from 'graphql';

/**
 * DateTime scalar for ISO 8601 date-time values
 *
 * Serializes Date objects to ISO strings and parses ISO strings to Date objects.
 *
 * @example
 * ```graphql
 * scalar DateTime
 *
 * type Node {
 *   createdAt: DateTime!
 *   updatedAt: DateTime
 * }
 * ```
 */
export const DateTimeScalar = new GraphQLScalarType<Date | null, string | null>({
  name: 'DateTime',
  description: 'ISO 8601 date-time string (e.g., 2024-01-15T10:30:00.000Z)',

  serialize(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) {
        throw new TypeError('DateTime cannot serialize an invalid Date');
      }
      return value.toISOString();
    }

    if (typeof value === 'string') {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        throw new TypeError(`DateTime cannot serialize invalid date string: ${value}`);
      }
      return date.toISOString();
    }

    if (typeof value === 'number') {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        throw new TypeError(`DateTime cannot serialize invalid timestamp: ${value}`);
      }
      return date.toISOString();
    }

    throw new TypeError(
      `DateTime cannot serialize non-date value: ${typeof value}`
    );
  },

  parseValue(value: unknown): Date | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (value instanceof Date) {
      return value;
    }

    if (typeof value === 'string') {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        throw new TypeError(`DateTime cannot parse invalid date string: ${value}`);
      }
      return date;
    }

    if (typeof value === 'number') {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        throw new TypeError(`DateTime cannot parse invalid timestamp: ${value}`);
      }
      return date;
    }

    throw new TypeError(
      `DateTime cannot parse non-string/non-number value: ${typeof value}`
    );
  },

  parseLiteral(ast: ValueNode): Date | null {
    if (ast.kind === Kind.NULL) {
      return null;
    }

    if (ast.kind === Kind.STRING) {
      const date = new Date(ast.value);
      if (Number.isNaN(date.getTime())) {
        throw new TypeError(`DateTime cannot parse invalid date literal: ${ast.value}`);
      }
      return date;
    }

    if (ast.kind === Kind.INT) {
      const date = new Date(parseInt(ast.value, 10));
      if (Number.isNaN(date.getTime())) {
        throw new TypeError(`DateTime cannot parse invalid timestamp literal: ${ast.value}`);
      }
      return date;
    }

    throw new TypeError(`DateTime cannot parse literal of kind: ${ast.kind}`);
  },
});

/**
 * JSON scalar for arbitrary JSON data
 *
 * Serializes and parses arbitrary JSON values including objects, arrays,
 * strings, numbers, booleans, and null.
 *
 * @example
 * ```graphql
 * scalar JSON
 *
 * type Node {
 *   metadata: JSON
 *   config: JSON
 * }
 * ```
 */
export const JSONScalar = new GraphQLScalarType<unknown, unknown>({
  name: 'JSON',
  description: 'Arbitrary JSON value (object, array, string, number, boolean, or null)',

  serialize(value: unknown): unknown {
    return value;
  },

  parseValue(value: unknown): unknown {
    return value;
  },

  parseLiteral(ast: ValueNode, variables?: Record<string, unknown> | null): unknown {
    return parseLiteralToJSON(ast, variables ?? undefined);
  },
});

/**
 * Parse a GraphQL literal AST node to a JSON value
 */
function parseLiteralToJSON(
  ast: ValueNode,
  variables?: Record<string, unknown>
): unknown {
  switch (ast.kind) {
    case Kind.NULL:
      return null;

    case Kind.STRING:
      return ast.value;

    case Kind.INT:
      return parseInt(ast.value, 10);

    case Kind.FLOAT:
      return parseFloat(ast.value);

    case Kind.BOOLEAN:
      return ast.value;

    case Kind.LIST:
      return ast.values.map((value) => parseLiteralToJSON(value, variables));

    case Kind.OBJECT: {
      const obj: Record<string, unknown> = {};
      for (const field of ast.fields) {
        obj[field.name.value] = parseLiteralToJSON(field.value, variables);
      }
      return obj;
    }

    case Kind.VARIABLE: {
      const name = ast.name.value;
      return variables ? variables[name] : undefined;
    }

    default:
      throw new TypeError(`JSON cannot parse literal of kind: ${(ast as ValueNode).kind}`);
  }
}

/**
 * UUID v4 regex pattern for validation
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * UUID scalar for unique identifiers
 *
 * Validates and serializes UUID v4 strings.
 *
 * @example
 * ```graphql
 * scalar UUID
 *
 * type Node {
 *   id: UUID!
 *   parentId: UUID
 * }
 * ```
 */
export const UUIDScalar = new GraphQLScalarType<string | null, string | null>({
  name: 'UUID',
  description: 'UUID v4 string (e.g., 550e8400-e29b-41d4-a716-446655440000)',

  serialize(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value !== 'string') {
      throw new TypeError(`UUID cannot serialize non-string value: ${typeof value}`);
    }

    if (!UUID_REGEX.test(value)) {
      throw new TypeError(`UUID cannot serialize invalid UUID: ${value}`);
    }

    return value.toLowerCase();
  },

  parseValue(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value !== 'string') {
      throw new TypeError(`UUID cannot parse non-string value: ${typeof value}`);
    }

    if (!UUID_REGEX.test(value)) {
      throw new TypeError(`UUID cannot parse invalid UUID: ${value}`);
    }

    return value.toLowerCase();
  },

  parseLiteral(ast: ValueNode): string | null {
    if (ast.kind === Kind.NULL) {
      return null;
    }

    if (ast.kind !== Kind.STRING) {
      throw new TypeError(`UUID cannot parse literal of kind: ${ast.kind}`);
    }

    if (!UUID_REGEX.test(ast.value)) {
      throw new TypeError(`UUID cannot parse invalid UUID literal: ${ast.value}`);
    }

    return ast.value.toLowerCase();
  },
});

/**
 * FilePath scalar for file system paths
 *
 * Validates and normalizes file paths, preventing path traversal attacks.
 *
 * @example
 * ```graphql
 * scalar FilePath
 *
 * type Node {
 *   path: FilePath!
 * }
 * ```
 */
export const FilePathScalar = new GraphQLScalarType<string | null, string | null>({
  name: 'FilePath',
  description: 'File system path (relative to docs root)',

  serialize(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value !== 'string') {
      throw new TypeError(`FilePath cannot serialize non-string value: ${typeof value}`);
    }

    return normalizePath(value);
  },

  parseValue(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value !== 'string') {
      throw new TypeError(`FilePath cannot parse non-string value: ${typeof value}`);
    }

    return validateAndNormalizePath(value);
  },

  parseLiteral(ast: ValueNode): string | null {
    if (ast.kind === Kind.NULL) {
      return null;
    }

    if (ast.kind !== Kind.STRING) {
      throw new TypeError(`FilePath cannot parse literal of kind: ${ast.kind}`);
    }

    return validateAndNormalizePath(ast.value);
  },
});

/**
 * Normalize a file path (forward slashes, no double slashes)
 */
function normalizePath(path: string): string {
  return path
    .replace(/\\/g, '/') // Convert backslashes to forward slashes
    .replace(/\/+/g, '/') // Remove duplicate slashes
    .replace(/^\//, '') // Remove leading slash
    .replace(/\/$/, ''); // Remove trailing slash
}

/**
 * Validate and normalize a file path, rejecting path traversal attempts
 */
function validateAndNormalizePath(path: string): string {
  const normalized = normalizePath(path);

  // Reject path traversal attempts
  if (normalized.includes('..') || normalized.startsWith('/')) {
    throw new TypeError(`FilePath cannot contain path traversal: ${path}`);
  }

  // Reject null bytes and other potentially dangerous characters
  if (/[\x00-\x1f]/.test(normalized)) {
    throw new TypeError(`FilePath contains invalid characters: ${path}`);
  }

  return normalized;
}

/**
 * All custom scalars bundled for resolver integration
 */
export const customScalars = {
  DateTime: DateTimeScalar,
  JSON: JSONScalar,
  UUID: UUIDScalar,
  FilePath: FilePathScalar,
};

/**
 * Type definitions string for custom scalars
 * (Useful if not loading from .graphql file)
 */
export const scalarTypeDefs = `
  """
  ISO 8601 date-time string (e.g., 2024-01-15T10:30:00.000Z)
  """
  scalar DateTime

  """
  Arbitrary JSON value (object, array, string, number, boolean, or null)
  """
  scalar JSON

  """
  UUID v4 string (e.g., 550e8400-e29b-41d4-a716-446655440000)
  """
  scalar UUID

  """
  File system path (relative to docs root)
  """
  scalar FilePath
`;
