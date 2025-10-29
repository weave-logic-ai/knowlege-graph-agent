/**
 * Markdown parser for extracting structured data from filled templates
 */

import fs from 'fs/promises';
import matter from 'gray-matter';
import type {
  ParsedMarkdown,
  MarkdownFrontmatter,
  MarkdownSection,
  CheckboxItem,
  ExtractedUserInput,
} from './types.js';

export class MarkdownParser {
  /**
   * Parse a markdown file into structured data
   */
  async parse(filePath: string): Promise<ParsedMarkdown> {
    const rawContent = await fs.readFile(filePath, 'utf-8');
    const { data: frontmatter, content } = matter(rawContent);

    const sections = this.parseSections(content);
    const isComplete = this.validateComplete(frontmatter as MarkdownFrontmatter, sections);

    return {
      frontmatter: frontmatter as MarkdownFrontmatter,
      sections,
      rawContent,
      filePath,
      isComplete,
    };
  }

  /**
   * Parse markdown content into sections
   */
  private parseSections(content: string): Map<string, MarkdownSection> {
    const sections = new Map<string, MarkdownSection>();

    // Split by headings (## or ###)
    const headingRegex = /^(#{2,3})\s+(.+)$/gm;
    const matches = [...content.matchAll(headingRegex)];

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const level = match[1].length;
      const heading = match[2].trim();
      const startIndex = match.index! + match[0].length;
      const endIndex = i < matches.length - 1 ? matches[i + 1].index! : content.length;
      const sectionContent = content.slice(startIndex, endIndex).trim();

      const section: MarkdownSection = {
        heading,
        level,
        content: sectionContent,
        checkboxes: this.extractCheckboxes(sectionContent),
        userInput: this.extractUserInput(sectionContent),
        rating: this.extractRating(sectionContent),
        choice: this.extractChoice(sectionContent),
      };

      sections.set(heading, section);
    }

    return sections;
  }

  /**
   * Extract checkboxes from section content
   */
  extractCheckboxes(content: string): CheckboxItem[] {
    const checkboxRegex = /^[\s]*-\s+\[(x| )\]\s+(.+)$/gim;
    const matches = [...content.matchAll(checkboxRegex)];

    return matches.map(match => ({
      checked: match[1].toLowerCase() === 'x',
      text: match[2].trim(),
    }));
  }

  /**
   * Extract user input from section (content between USER_INPUT_START/END markers)
   */
  extractUserInput(content: string): string | undefined {
    const startMarker = '<!-- USER_INPUT_START -->';
    const endMarker = '<!-- USER_INPUT_END -->';

    const startIndex = content.indexOf(startMarker);
    const endIndex = content.indexOf(endMarker);

    if (startIndex === -1 || endIndex === -1) {
      return undefined;
    }

    const userInput = content.slice(startIndex + startMarker.length, endIndex).trim();

    // Remove empty markdown code blocks
    const cleanedInput = userInput
      .replace(/```\s*\n\s*```/g, '')
      .replace(/^\s*\[.*?\]\s*$/gm, '') // Remove placeholder text like [Describe...]
      .trim();

    return cleanedInput.length > 0 ? cleanedInput : undefined;
  }

  /**
   * Extract rating from <!-- RATING:X --> marker
   */
  extractRating(content: string): number | undefined {
    const ratingRegex = /<!--\s*RATING:(\d)\s*-->/i;
    const match = content.match(ratingRegex);

    if (match) {
      const rating = parseInt(match[1], 10);
      return rating >= 1 && rating <= 5 ? rating : undefined;
    }

    return undefined;
  }

  /**
   * Extract choice from <!-- A/B_CHOICE:X --> marker
   */
  extractChoice(content: string): string | undefined {
    const choiceRegex = /<!--\s*A\/B_CHOICE:(\w+)\s*-->/i;
    const match = content.match(choiceRegex);
    return match ? match[1].trim() : undefined;
  }

  /**
   * Validate if markdown is complete and ready for processing
   */
  validateComplete(frontmatter: MarkdownFrontmatter, sections: Map<string, MarkdownSection>): boolean {
    // Check if status is completed
    if (frontmatter.status !== 'completed') {
      return false;
    }

    // Check if required sections have content
    const hasUserInputSections = [...sections.values()].some(
      section => section.userInput && section.userInput.length > 0
    );

    // Check if validation checkboxes are checked
    const validationSection = this.findSectionByHeading(sections, 'Validation Checklist');
    if (validationSection) {
      const allChecked = validationSection.checkboxes?.every(cb => cb.checked) ?? false;
      if (!allChecked) {
        return false;
      }
    }

    return true;
  }

  /**
   * Find section by heading (case-insensitive, partial match)
   */
  private findSectionByHeading(sections: Map<string, MarkdownSection>, heading: string): MarkdownSection | undefined {
    const lowerHeading = heading.toLowerCase();
    for (const [key, section] of sections) {
      if (key.toLowerCase().includes(lowerHeading)) {
        return section;
      }
    }
    return undefined;
  }

  /**
   * Extract structured user input based on stage
   */
  extractStructuredInput(parsed: ParsedMarkdown): ExtractedUserInput {
    const stage = parsed.frontmatter.stage;

    switch (stage) {
      case 'perception':
        return this.extractPerceptionInput(parsed);
      case 'reasoning':
        return this.extractReasoningInput(parsed);
      case 'execution':
        return this.extractExecutionInput(parsed);
      case 'reflection':
        return this.extractReflectionInput(parsed);
      case 'feedback':
        return this.extractFeedbackInput(parsed);
      default:
        return {};
    }
  }

  /**
   * Extract perception stage input
   */
  private extractPerceptionInput(parsed: ParsedMarkdown): ExtractedUserInput {
    const validationSection = this.findSectionByHeading(parsed.sections, 'Context Validation');

    if (!validationSection?.userInput) {
      return {};
    }

    // Parse user input for missing context, additional sources, etc.
    const input = validationSection.userInput;

    return {
      contextValidation: {
        missingContext: this.extractSubSection(input, 'Missing Context'),
        additionalSources: this.extractListItems(this.extractSubSection(input, 'Additional Sources')),
        priorities: this.extractListItems(this.extractSubSection(input, 'Context Priorities')),
      },
    };
  }

  /**
   * Extract reasoning stage input
   */
  private extractReasoningInput(parsed: ParsedMarkdown): ExtractedUserInput {
    const selectionSection = this.findSectionByHeading(parsed.sections, 'A/B Testing');

    if (!selectionSection) {
      return {};
    }

    const selectedPlan = selectionSection.choice || 'Plan_A';
    const userInput = selectionSection.userInput || '';

    return {
      planSelection: {
        selectedPlan,
        reasoning: this.extractSubSection(userInput, 'Why This Plan'),
        modifications: this.extractSubSection(userInput, 'Plan Modifications'),
        concerns: this.extractSubSection(userInput, 'Concerns or Risks'),
        successCriteria: this.extractSubSection(userInput, 'Success Criteria'),
      },
    };
  }

  /**
   * Extract execution stage input
   */
  private extractExecutionInput(parsed: ParsedMarkdown): ExtractedUserInput {
    const issuesSection = this.findSectionByHeading(parsed.sections, 'Issues & Blockers');
    const progressSection = this.findSectionByHeading(parsed.sections, 'Progress Tracking');

    const completedTasks = progressSection?.checkboxes
      ?.filter(cb => cb.checked)
      .map(cb => cb.text) || [];

    return {
      executionProgress: {
        completedTasks,
        activeBlockers: this.parseBlockersList(issuesSection?.userInput || ''),
        discoveries: this.parseDiscoveriesList(issuesSection?.userInput || ''),
      },
    };
  }

  /**
   * Extract reflection stage input
   */
  private extractReflectionInput(parsed: ParsedMarkdown): ExtractedUserInput {
    const reflectionSection = this.findSectionByHeading(parsed.sections, 'Reflection Questions');
    const preferenceSection = this.findSectionByHeading(parsed.sections, 'Preference Signals');
    const ratingSection = this.findSectionByHeading(parsed.sections, 'Satisfaction Rating');

    const userInput = reflectionSection?.userInput || '';
    const rating = ratingSection?.rating || parsed.frontmatter.status === 'completed' ? 3 : 0;

    return {
      reflection: {
        satisfactionRating: rating,
        whatWorkedWell: this.extractSubSection(userInput, 'What Worked Well'),
        whatDidntWork: this.extractSubSection(userInput, "What Didn't Work"),
        improvements: this.extractSubSection(userInput, 'Improvements for Next Time'),
        unexpectedLearnings: this.extractSubSection(userInput, 'Unexpected Learnings'),
        preferences: {
          planningStyle: preferenceSection?.checkboxes
            ?.filter(cb => cb.checked && cb.text.includes('planning'))
            .map(cb => cb.text) || [],
          riskTolerance: preferenceSection?.checkboxes
            ?.filter(cb => cb.checked && cb.text.includes('risk'))
            .map(cb => cb.text) || [],
          learningVsSpeed: preferenceSection?.checkboxes
            ?.filter(cb => cb.checked && cb.text.includes('learning') || cb.text.includes('speed'))
            .map(cb => cb.text) || [],
          toolPreferences: preferenceSection?.checkboxes
            ?.filter(cb => cb.checked && cb.text.includes('tool'))
            .map(cb => cb.text) || [],
        },
        wouldUseAgain: preferenceSection?.checkboxes
          ?.find(cb => cb.checked && cb.text.includes('use') && cb.text.includes('again'))
          ?.text,
        explanation: this.extractSubSection(userInput, 'Explanation'),
      },
    };
  }

  /**
   * Extract feedback stage input
   */
  private extractFeedbackInput(parsed: ParsedMarkdown): ExtractedUserInput {
    const feedbackSection = this.findSectionByHeading(parsed.sections, 'Quick Feedback');
    const ratingSection = this.findSectionByHeading(parsed.sections, 'Overall Satisfaction');

    const userInput = feedbackSection?.userInput || '';
    const rating = ratingSection?.rating || 3;

    return {
      feedback: {
        satisfactionRating: rating,
        whatWentWell: this.extractSubSection(userInput, 'What went well'),
        improvements: this.extractSubSection(userInput, 'What could be improved'),
        suggestions: this.extractSubSection(userInput, 'Any specific suggestions'),
      },
    };
  }

  /**
   * Extract subsection from user input
   */
  private extractSubSection(input: string, sectionName: string): string {
    const regex = new RegExp(`###\\s*${sectionName}[\\s\\S]*?(?:\`\`\`)?([\\s\\S]*?)(?:\`\`\`)?(?=###|$)`, 'i');
    const match = input.match(regex);

    if (match && match[1]) {
      return match[1].trim().replace(/^\[.*?\]\s*$/gm, '').trim();
    }

    return '';
  }

  /**
   * Extract list items from text
   */
  private extractListItems(text: string): string[] {
    if (!text) return [];

    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('['));
  }

  /**
   * Parse blockers list from text
   */
  private parseBlockersList(text: string): Array<{ description: string; status: string; impact: string; notes?: string }> {
    // Simple parsing - in practice, could be more sophisticated
    const blockers: Array<{ description: string; status: string; impact: string; notes?: string }> = [];
    const issueRegex = /\[Issue \d+\]\s*(.*?)\n\s*Status:\s*\[(.*?)\]\s*\n\s*Impact:\s*\[(.*?)\]/gi;
    const matches = [...text.matchAll(issueRegex)];

    for (const match of matches) {
      blockers.push({
        description: match[1].trim(),
        status: match[2].trim(),
        impact: match[3].trim(),
      });
    }

    return blockers;
  }

  /**
   * Parse discoveries list from text
   */
  private parseDiscoveriesList(text: string): Array<{ description: string; impact: string; notes?: string }> {
    const discoveries: Array<{ description: string; impact: string; notes?: string }> = [];
    const discoveryRegex = /\[Discovery \d+\]\s*(.*?)\n\s*Impact:\s*\[(.*?)\]/gi;
    const matches = [...text.matchAll(discoveryRegex)];

    for (const match of matches) {
      discoveries.push({
        description: match[1].trim(),
        impact: match[2].trim(),
      });
    }

    return discoveries;
  }

  /**
   * Synchronous parse for testing
   */
  parseSync(content: string): Omit<ParsedMarkdown, 'filePath'> {
    const { data: frontmatter, content: markdownContent } = matter(content);
    const sections = this.parseSections(markdownContent);
    const isComplete = this.validateComplete(frontmatter as MarkdownFrontmatter, sections);

    return {
      frontmatter: frontmatter as MarkdownFrontmatter,
      sections,
      rawContent: content,
      isComplete,
    };
  }
}

/**
 * Singleton instance
 */
export const markdownParser = new MarkdownParser();
