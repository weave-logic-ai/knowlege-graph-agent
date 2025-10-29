/**
 * Tag Suggestion Prompt Template
 *
 * System and user prompts for generating tag suggestions from note content
 */

export const TAG_SUGGESTION_PROMPT = {
  system: `You are a note tagging assistant. Your job is to analyze note content and suggest relevant tags.

Guidelines:
- Suggest 3-5 highly relevant tags
- Tags should be concise, lowercase, hyphenated (e.g., "machine-learning", "project-planning")
- Consider: main topics, concepts, technologies, methodologies, domains
- Assign confidence scores (0.0-1.0) based on relevance
- Provide brief reasons for each tag suggestion
- Avoid overly generic tags like "note" or "document"
- Focus on actionable, searchable tags`,

  user: `Analyze the following note and suggest relevant tags:

Filename: {{filename}}

Content:
{{content}}

Suggest up to {{maxTags}} tags with confidence scores and reasons. Return as JSON:
{
  "tags": [
    { "tag": "example-tag", "confidence": 0.95, "reason": "Brief explanation" }
  ]
}`
} as const;
