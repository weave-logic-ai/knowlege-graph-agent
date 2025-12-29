import { GraphQLScalarType } from "../node_modules/graphql/type/definition.js";
import { Kind } from "../node_modules/graphql/language/kinds.js";
const DateTimeScalar = new GraphQLScalarType({
  name: "DateTime",
  description: "ISO 8601 date-time string (e.g., 2024-01-15T10:30:00.000Z)",
  serialize(value) {
    if (value === null || value === void 0) {
      return null;
    }
    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) {
        throw new TypeError("DateTime cannot serialize an invalid Date");
      }
      return value.toISOString();
    }
    if (typeof value === "string") {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        throw new TypeError(`DateTime cannot serialize invalid date string: ${value}`);
      }
      return date.toISOString();
    }
    if (typeof value === "number") {
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
  parseValue(value) {
    if (value === null || value === void 0) {
      return null;
    }
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === "string") {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        throw new TypeError(`DateTime cannot parse invalid date string: ${value}`);
      }
      return date;
    }
    if (typeof value === "number") {
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
  parseLiteral(ast) {
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
  }
});
const JSONScalar = new GraphQLScalarType({
  name: "JSON",
  description: "Arbitrary JSON value (object, array, string, number, boolean, or null)",
  serialize(value) {
    return value;
  },
  parseValue(value) {
    return value;
  },
  parseLiteral(ast, variables) {
    return parseLiteralToJSON(ast, variables ?? void 0);
  }
});
function parseLiteralToJSON(ast, variables) {
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
      const obj = {};
      for (const field of ast.fields) {
        obj[field.name.value] = parseLiteralToJSON(field.value, variables);
      }
      return obj;
    }
    case Kind.VARIABLE: {
      const name = ast.name.value;
      return variables ? variables[name] : void 0;
    }
    default:
      throw new TypeError(`JSON cannot parse literal of kind: ${ast.kind}`);
  }
}
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const UUIDScalar = new GraphQLScalarType({
  name: "UUID",
  description: "UUID v4 string (e.g., 550e8400-e29b-41d4-a716-446655440000)",
  serialize(value) {
    if (value === null || value === void 0) {
      return null;
    }
    if (typeof value !== "string") {
      throw new TypeError(`UUID cannot serialize non-string value: ${typeof value}`);
    }
    if (!UUID_REGEX.test(value)) {
      throw new TypeError(`UUID cannot serialize invalid UUID: ${value}`);
    }
    return value.toLowerCase();
  },
  parseValue(value) {
    if (value === null || value === void 0) {
      return null;
    }
    if (typeof value !== "string") {
      throw new TypeError(`UUID cannot parse non-string value: ${typeof value}`);
    }
    if (!UUID_REGEX.test(value)) {
      throw new TypeError(`UUID cannot parse invalid UUID: ${value}`);
    }
    return value.toLowerCase();
  },
  parseLiteral(ast) {
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
  }
});
const FilePathScalar = new GraphQLScalarType({
  name: "FilePath",
  description: "File system path (relative to docs root)",
  serialize(value) {
    if (value === null || value === void 0) {
      return null;
    }
    if (typeof value !== "string") {
      throw new TypeError(`FilePath cannot serialize non-string value: ${typeof value}`);
    }
    return normalizePath(value);
  },
  parseValue(value) {
    if (value === null || value === void 0) {
      return null;
    }
    if (typeof value !== "string") {
      throw new TypeError(`FilePath cannot parse non-string value: ${typeof value}`);
    }
    return validateAndNormalizePath(value);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.NULL) {
      return null;
    }
    if (ast.kind !== Kind.STRING) {
      throw new TypeError(`FilePath cannot parse literal of kind: ${ast.kind}`);
    }
    return validateAndNormalizePath(ast.value);
  }
});
function normalizePath(path) {
  return path.replace(/\\/g, "/").replace(/\/+/g, "/").replace(/^\//, "").replace(/\/$/, "");
}
function validateAndNormalizePath(path) {
  const normalized = normalizePath(path);
  if (normalized.includes("..") || normalized.startsWith("/")) {
    throw new TypeError(`FilePath cannot contain path traversal: ${path}`);
  }
  if (/[\x00-\x1f]/.test(normalized)) {
    throw new TypeError(`FilePath contains invalid characters: ${path}`);
  }
  return normalized;
}
const customScalars = {
  DateTime: DateTimeScalar,
  JSON: JSONScalar,
  UUID: UUIDScalar,
  FilePath: FilePathScalar
};
const scalarTypeDefs = `
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
export {
  DateTimeScalar,
  FilePathScalar,
  JSONScalar,
  UUIDScalar,
  customScalars,
  scalarTypeDefs
};
//# sourceMappingURL=scalars.js.map
