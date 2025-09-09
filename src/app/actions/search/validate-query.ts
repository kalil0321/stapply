import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";

export interface ValidationResult {
    isValid: boolean;
    reason?: string;
    confidence?: number;
}

export async function validateQuery(query: string): Promise<ValidationResult> {
    try {
        const { text } = await generateText({
            model: groq("openai/gpt-oss-120b"),
            prompt: `You are a job search query validator. Analyze the following search query and determine if it's appropriate for job searching.

Query: "${query}"

Evaluate the query based on these criteria:
1. Is it job-related? (looking for employment, internships, careers, etc.)
2. Is it specific enough? (not too vague like "jobs" or "work")
3. Is it not too specific? (not looking for a single specific job posting)
4. Is it a reasonable search term? (not gibberish, offensive, or completely unrelated)

Respond with a JSON object containing:
- "isValid": boolean (true if the query is good for job searching)
- "reason": string (explanation of why it's valid/invalid)
- "confidence": number (0-1, how confident you are in this assessment)

Examples:
- "software engineer jobs in San Francisco" -> valid
- "jobs" -> invalid (too vague)
- "Senior Software Engineer at Google in Mountain View, CA, Job ID 12345" -> invalid (too specific)
- "pizza recipe" -> invalid (not job-related)
- "remote marketing internships" -> valid`,
            temperature: 0.1,
        });

        // Parse the JSON response
        const result = JSON.parse(text) as ValidationResult;
        
        // Validate the response structure
        if (typeof result.isValid !== 'boolean' || 
            typeof result.reason !== 'string') {
            throw new Error("Invalid validation response format");
        }

        return result;
    } catch (error) {
        console.error("Error validating query:", error);
        
        // Fallback validation - basic checks
        const trimmedQuery = query.trim().toLowerCase();
        
        // Check if query is too short
        if (trimmedQuery.length < 3) {
            return {
                isValid: false,
                reason: "Query is too short. Please provide more specific search terms.",
            };
        }
        
        // Check if query is too long
        if (trimmedQuery.length > 200) {
            return {
                isValid: false,
                reason: "Query is too long. Please provide a more concise search term.",
            };
        }
        
        // Basic job-related keywords check
        const jobKeywords = [
            'job', 'jobs', 'career', 'careers', 'position', 'positions',
            'role', 'roles', 'employment', 'work', 'hiring', 'internship',
            'internships', 'engineer', 'developer', 'manager', 'analyst',
            'designer', 'marketing', 'sales', 'finance', 'hr', 'remote',
            'full-time', 'part-time', 'contract', 'freelance'
        ];
        
        const hasJobKeywords = jobKeywords.some(keyword => 
            trimmedQuery.includes(keyword)
        );
        
        if (!hasJobKeywords) {
            return {
                isValid: false,
                reason: "Query doesn't appear to be job-related. Please search for employment opportunities, careers, or specific job roles.",
                confidence: 0.8
            };
        }
        
        // Default to valid if basic checks pass
        return {
            isValid: true,
            reason: "Query appears to be job-related and appropriate for searching.",
            confidence: 0.6
        };
    }
}
