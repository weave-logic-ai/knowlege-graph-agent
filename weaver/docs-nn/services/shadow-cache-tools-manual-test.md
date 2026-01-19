---
title: "Shadow Cache Tools Manual Test"
type: service
status: active
category: services
description: "This document provides manual testing instructions for the three shadow cache MCP tools implemented in Phase 5, Tasks 5-7."
created: 2025-12-29
updated: 2025-12-29
original: "docs/shadow-cache-tools-manual-test.md"
---

# Shadow Cache Tools Manual Test

## Overview

This document provides manual testing instructions for the three shadow cache MCP tools implemented in Phase 5, Tasks 5-7.

> [!info] Original Documentation
> See [[docs/shadow-cache-tools-manual-test.md|original document]] for full details.

## Key Concepts

- **Overview**
- **Prerequisites**
- **Tools Implemented**
- **Expected Response Format**
- **Testing via Claude Desktop**
- **Purpose**
- **Schema**
- **Test Cases**

## Research Needed

> [!warning] Areas Requiring Further Research
> - Verify tools are loaded:
```
Ask: "What MCP tools are available?
> - Has empty sections that need content

## TODOs

- [ ] All three tools compile without TypeScript errors
- [ ] Tools are registered in the tool registry
- [ ] Tools appear in Claude Desktop MCP tools list
- [ ] query_files returns filtered results correctly
- [ ] query_files pagination works (limit/offset)
- [ ] get_file returns metadata with tags and links
- [ ] get_file includeContent option works
- [ ] get_file_content reads files correctly
- [ ] get_file_content handles binary files (base64)
- [ ] Error handling works for invalid paths

## Tags


