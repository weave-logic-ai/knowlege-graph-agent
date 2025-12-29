/**
 * GraphQL Custom Scalars
 *
 * Provides custom scalar type definitions for DateTime, JSON, and UUID types.
 * These scalars enable proper serialization/deserialization of complex data types
 * in the GraphQL schema.
 *
 * @module graphql/scalars
 */
import { GraphQLScalarType } from 'graphql';
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
export declare const DateTimeScalar: GraphQLScalarType<Date | null, string | null>;
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
export declare const JSONScalar: GraphQLScalarType<unknown, unknown>;
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
export declare const UUIDScalar: GraphQLScalarType<string | null, string | null>;
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
export declare const FilePathScalar: GraphQLScalarType<string | null, string | null>;
/**
 * All custom scalars bundled for resolver integration
 */
export declare const customScalars: {
    DateTime: GraphQLScalarType<Date | null, string | null>;
    JSON: GraphQLScalarType<unknown, unknown>;
    UUID: GraphQLScalarType<string | null, string | null>;
    FilePath: GraphQLScalarType<string | null, string | null>;
};
/**
 * Type definitions string for custom scalars
 * (Useful if not loading from .graphql file)
 */
export declare const scalarTypeDefs = "\n  \"\"\"\n  ISO 8601 date-time string (e.g., 2024-01-15T10:30:00.000Z)\n  \"\"\"\n  scalar DateTime\n\n  \"\"\"\n  Arbitrary JSON value (object, array, string, number, boolean, or null)\n  \"\"\"\n  scalar JSON\n\n  \"\"\"\n  UUID v4 string (e.g., 550e8400-e29b-41d4-a716-446655440000)\n  \"\"\"\n  scalar UUID\n\n  \"\"\"\n  File system path (relative to docs root)\n  \"\"\"\n  scalar FilePath\n";
//# sourceMappingURL=scalars.d.ts.map