import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { createLogger } from '../../../../service-lib/src/lib/logger';
import { TraceIdService } from '../../../../service-lib/src/lib/trace-id.service';
import { serviceNames } from '../../../../service-lib/src/lib/constants';
import { buildLogMessage } from '../../../../service-lib/src/lib/utils/logger.util';

@Injectable()
export class PerplexityService {
  private readonly logger: ReturnType<typeof createLogger>;
  private readonly apiUrl: string;
  private readonly apiKey: string;
  constructor(
    private readonly configService: ConfigService,
    private readonly traceIdService: TraceIdService,
  ) {
    this.apiUrl = this.configService.get<string>('perplexity.endpoint', '');
    this.apiKey = this.configService.get<string>('perplexity.apiKey', '');

    if (!this.apiUrl || !this.apiKey) {
      throw new Error('Perplexity API configuration is missing in environment variables');
    }

    this.logger = createLogger(this.traceIdService, serviceNames.AI_SERVICE);
  }

  async interactWithPerplexity(
    query: string,
    subPrompt: string,
    subject: string,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<{ subject: string; data: any[] }> {

    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'PerplexityService',
        method: 'interactWithPerplexity',
        payload: { query, subPrompt, subject },
        messageData: 'method invoked',
      }),
    });
    
    if (!query?.trim()) {
      throw new Error("Query is required");
    }
    if (!subPrompt?.trim()) {
      throw new Error('Sub-prompt is required');
    }
    if (!subject?.trim()) {
      throw new Error('Subject is required');
    }

    const payload = {
      model: "sonar",
      messages: [
        {
          role: "system",
          content:
            `You are an advanced AI assistant that provides comprehensive company information by searching the internet. 
              - Your response should be in Strictly JSON format. 
              - Do not include any additional text or explanations or markdown formatting or extraneous characters such as` + "```"+`"json or {}.
              - Make sure your response is starting and ending with the curly braces { } and also accessible when parsed as JSON.parse()`
        },
        {
          role: "user",
          content: `User is searching for details about ${query} and looking for this info ${subPrompt}. Strictly follow the response format instructions above. with keys: ${subject}`,
        },
      ],
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens ?? 5000,
    };

    try {
      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      const contentStr = response.data.choices[0].message.content;

      // Clean markdown, Json code block markers and whitespace noise
      let cleaned = contentStr
        .replace(/```json|```/gi, "")
        .replace(/[\r\n\t]/g, "")
        .replace(/,\s*]/g, "]")
        .replace(/,\s*}/g, "}");

      // Clean JS-style comments (inline `//`)
      const pattern = /("(?:[^"\\]|\\.)*")|\/\/.*(?=[\n\r])/g;
      cleaned = cleaned.replace(pattern, (match: any, quoted: any) => (quoted ? quoted : ''));

      // Clean trailing commas before closing braces/brackets (extra safety)
      cleaned = cleaned.replace(/,(\s*[}\]])/g, "$1");

      // Clean any leading/trailing whitespace
      cleaned = cleaned.trim();

      // Try parsing as a full object
      try {
        const parsed = JSON.parse(cleaned);
        if (parsed && parsed[subject]) {
          if (Array.isArray(parsed[subject])) {
            return { subject, data: parsed[subject] };
          }
          if (typeof parsed[subject] === 'object') {
            return { subject, data: [parsed[subject]] };
          }
        }
        if (Array.isArray(parsed)) {
          return { subject, data: parsed };
        }
        if (typeof parsed === 'object') {
          return { subject, data: [parsed] };
        }
      } catch (e) {
        // ignore JSON parse error
        this.logger.error(
          `Error parsing JSON response from Perplexity for "${subPrompt}"   "contentStr : ${contentStr}"`,
          e
        );
      }
      const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const parsedData = JSON.parse(jsonMatch[0]);
          return {
            subject,
            data: parsedData,
          };
        } catch (parseError) {
          this.logger.error(
            `Error parsing JSON from Perplexity for "${subPrompt}"   "contentStr : ${contentStr}"`,
            parseError
          );
          return { subject, data: [] };
        }
      }
      return { subject, data: [] };
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'PerplexityService',
          method: 'interactWithPerplexity',
          messageData: error,
        }),
      });
      return { subject, data: [] };
    }
  }
}
