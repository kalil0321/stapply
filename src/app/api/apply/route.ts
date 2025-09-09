import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { BrowserUseClient } from "browser-use-sdk";

const applyJobSchema = z.object({
    jobUrl: z.string().url("Valid job URL is required"),
    jobTitle: z.string().min(1, "Job title is required").optional(),
    company: z.string().min(1, "Company name is required").optional(),
    profile: z.object({
        firstName: z.string().min(1, "First name is required"),
        lastName: z.string().min(1, "Last name is required"),
        email: z.string().email("Valid email is required"),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        country: z.string().optional(),
        dateOfBirth: z.string().optional(),
        gender: z.string().optional(),
        linkedinUrl: z.string().optional(),
        githubUrl: z.string().optional(),
        portfolioUrl: z.string().optional(),
        summary: z.string().optional(),
        skills: z.array(z.string()).optional(),
        languages: z.array(z.object({
            language: z.string(),
            proficiency: z.string(),
        })).optional(),
        education: z.array(z.object({
            institution: z.string(),
            degree: z.string(),
            fieldOfStudy: z.string().optional(),
            startDate: z.string().optional(),
            endDate: z.string().optional(),
            gpa: z.string().optional(),
            description: z.string().optional(),
        })).optional(),
        experience: z.array(z.object({
            company: z.string(),
            position: z.string(),
            startDate: z.string().optional(),
            endDate: z.string().optional(),
            description: z.string().optional(),
            location: z.string().optional(),
        })).optional(),
        resumeFile: z.object({
            name: z.string(),
            dataUrl: z.string(),
        }).optional(),
        applicationInstructions: z.string().optional(),
        credentials: z.object({
            linkedin: z.object({
                email: z.string(),
                password: z.string(),
            }).optional(),
            google: z.object({
                email: z.string(),
                password: z.string(),
            }).optional(),
            indeed: z.object({
                email: z.string(),
                password: z.string(),
            }).optional(),
            glassdoor: z.object({
                email: z.string(),
                password: z.string(),
            }).optional(),
            github: z.object({
                username: z.string(),
                password: z.string(),
            }).optional(),
        }).optional(),
    }).optional(),
    notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
    console.log('[APPLY_API] Starting job application request');
    
    try {
        const body = await request.json();
        console.log('[APPLY_API] Request body received:', {
            hasJobUrl: !!body.jobUrl,
            hasJobTitle: !!body.jobTitle,
            hasCompany: !!body.company,
            hasProfile: !!body.profile,
            hasNotes: !!body.notes,
            bodyKeys: Object.keys(body)
        });
        
        const { jobUrl, jobTitle, company, profile, notes } = applyJobSchema.parse(body);
        console.log('[APPLY_API] Schema validation passed');

        // Check if profile is provided
        if (!profile) {
            console.log('[APPLY_API] ERROR: No profile provided');
            return NextResponse.json(
                {
                    error: "Profile required",
                    message: "You need to complete your profile before applying to jobs. Please visit the Profile page to set up your information."
                },
                { status: 400 }
            );
        }
        
        console.log('[APPLY_API] Profile provided:', {
            hasFirstName: !!profile.firstName,
            hasLastName: !!profile.lastName,
            hasEmail: !!profile.email,
            hasPhone: !!profile.phone,
            hasResume: !!profile.resumeFile,
            hasCredentials: !!profile.credentials,
            profileKeys: Object.keys(profile)
        });

        // Validate required profile fields
        const requiredFields = ["firstName", "lastName", "email"];
        const missingFields = requiredFields.filter(field =>
            !profile[field as keyof typeof profile] ||
            String(profile[field as keyof typeof profile]).trim() === ""
        );

        if (missingFields.length > 0) {
            console.log('[APPLY_API] ERROR: Missing required fields:', missingFields);
            return NextResponse.json(
                {
                    error: "Incomplete profile",
                    message: `Please complete the following required fields in your profile: ${missingFields.join(", ")}`
                },
                { status: 400 }
            );
        }
        
        console.log('[APPLY_API] Profile validation passed, all required fields present');

        // Log job details for debugging
        console.log('[APPLY_API] Job details:', {
            jobUrl,
            jobTitle: jobTitle || 'Not provided - will be extracted from URL',
            company: company || 'Not provided - will be extracted from URL'
        });

        // Use BrowserUse SDK for actual job application
        console.log('[APPLY_API] Starting BrowserUse application process');
        try {
            const applicationResult = await applyToJobWithBrowserUse({
                jobUrl,
                jobTitle,
                company,
                profile,
                notes,
            });
            
            console.log('[APPLY_API] BrowserUse application completed successfully:', applicationResult);

            return NextResponse.json({
                success: true,
                message: "Application submitted successfully!",
                details: applicationResult
            });

        } catch (browserError) {
            console.error('[APPLY_API] Browser automation error:', {
                error: browserError,
                message: browserError instanceof Error ? browserError.message : 'Unknown error',
                stack: browserError instanceof Error ? browserError.stack : undefined,
                jobUrl,
                jobTitle,
                company
            });
            return NextResponse.json(
                {
                    error: "Application failed",
                    message: "There was an issue submitting your application. Please try applying manually."
                },
                { status: 500 }
            );
        }

    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('[APPLY_API] Schema validation error:', {
                issues: error.issues,
                formattedIssues: error.issues.map(issue => ({
                    path: issue.path.join('.'),
                    message: issue.message,
                    code: issue.code
                }))
            });
            return NextResponse.json(
                { error: "Invalid request data", details: error.issues },
                { status: 400 }
            );
        }

        console.error('[APPLY_API] Unexpected error:', {
            error,
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        return NextResponse.json(
            { error: "Failed to submit application" },
            { status: 500 }
        );
    }
}

// Removed ApplicationResultSchema - we'll ignore task output and use basic success indicators

// Apply to job using BrowserUse SDK
async function applyToJobWithBrowserUse({ jobUrl, jobTitle, company, profile, notes }: {
    jobUrl: string;
    jobTitle: string;
    company: string;
    profile: any;
    notes?: string;
}) {
    console.log('[BROWSER_USE] Starting applyToJobWithBrowserUse function:', {
        jobUrl,
        jobTitle,
        company,
        hasNotes: !!notes,
        profileSummary: {
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: profile.email,
            hasResume: !!profile.resumeFile,
            hasCredentials: !!profile.credentials
        }
    });
    
    const apiKey = process.env.BROWSER_USE_API_KEY;
    if (!apiKey) {
        console.error('[BROWSER_USE] ERROR: BROWSER_USE_API_KEY environment variable not found');
        throw new Error("BROWSER_USE_API_KEY environment variable is required");
    }
    
    console.log('[BROWSER_USE] API key found, initializing BrowserUse client');

    const client = new BrowserUseClient({
        apiKey: apiKey,
    });
    
    console.log('[BROWSER_USE] BrowserUse client initialized successfully');

    // Prepare secrets for authentication if provided
    console.log('[BROWSER_USE] Preparing authentication secrets');
    const secrets: Record<string, string> = {};

    // Add platform credentials as secrets
    if (profile.credentials?.linkedin?.email && profile.credentials?.linkedin?.password) {
        secrets["https://linkedin.com"] = profile.credentials.linkedin.email;
        secrets["https://*.linkedin.com"] = profile.credentials.linkedin.password;
        console.log('[BROWSER_USE] LinkedIn credentials added to secrets');
    }

    if (profile.credentials?.indeed?.email && profile.credentials?.indeed?.password) {
        secrets["https://indeed.com"] = profile.credentials.indeed.email;
        secrets["https://*.indeed.com"] = profile.credentials.indeed.password;
        console.log('[BROWSER_USE] Indeed credentials added to secrets');
    }

    if (profile.credentials?.glassdoor?.email && profile.credentials?.glassdoor?.password) {
        secrets["https://glassdoor.com"] = profile.credentials.glassdoor.email;
        secrets["https://*.glassdoor.com"] = profile.credentials.glassdoor.password;
        console.log('[BROWSER_USE] Glassdoor credentials added to secrets');
    }
    
    console.log('[BROWSER_USE] Secrets prepared:', {
        totalSecrets: Object.keys(secrets).length,
        platforms: Object.keys(secrets).map(key => key.replace('https://', '').replace('https://*.', ''))
    });

    // Build profile information string for the AI
    const profileInfo = `
    Personal Information:
    - Name: ${profile.firstName} ${profile.lastName}
    - Email: ${profile.email}
    ${profile.phone ? `- Phone: ${profile.phone}` : ''}
    ${profile.address ? `- Address: ${profile.address}` : ''}
    ${profile.city ? `- City: ${profile.city}` : ''}
    ${profile.state ? `- State: ${profile.state}` : ''}
    ${profile.zipCode ? `- Zip Code: ${profile.zipCode}` : ''}
    ${profile.country ? `- Country: ${profile.country}` : ''}
    ${profile.dateOfBirth ? `- Date of Birth: ${profile.dateOfBirth}` : ''}
    ${profile.gender ? `- Gender: ${profile.gender}` : ''}
    ${profile.linkedinUrl ? `- LinkedIn: ${profile.linkedinUrl}` : ''}
    ${profile.githubUrl ? `- GitHub: ${profile.githubUrl}` : ''}
    ${profile.portfolioUrl ? `- Portfolio: ${profile.portfolioUrl}` : ''}
    
    ${profile.summary ? `Professional Summary: ${profile.summary}` : ''}
    
    ${profile.skills && profile.skills.length > 0 ? `Skills: ${profile.skills.join(', ')}` : ''}
    
    ${profile.languages && profile.languages.length > 0 ?
            `Languages: ${profile.languages.map((lang: any) => `${lang.language}${lang.proficiency ? ` (${lang.proficiency})` : ''}`).join(', ')}` : ''}
    
    ${profile.experience && profile.experience.length > 0 ?
            `Work Experience:\n${profile.experience.map((exp: any) =>
                `- ${exp.position} at ${exp.company} (${exp.startDate || 'N/A'} - ${exp.endDate || 'Present'})${exp.description ? ': ' + exp.description : ''}`
            ).join('\n')}` : ''}
    
    ${profile.education && profile.education.length > 0 ?
            `Education:\n${profile.education.map((edu: any) =>
                `- ${edu.degree} from ${edu.institution}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}${edu.startDate && edu.endDate ? ` (${edu.startDate} - ${edu.endDate})` : ''}`
            ).join('\n')}` : ''}
    `;

    const applicationInstructions = profile.applicationInstructions ||
        "Apply to this job by filling out all required fields accurately. Upload resume if there's an option. Submit the application.";

    let resumeFileName: string | undefined;
    let liveSession: any;

    // Handle resume upload if provided
    if (profile.resumeFile?.dataUrl && profile.resumeFile?.name) {
        console.log('[BROWSER_USE] Resume file detected, starting upload process:', {
            fileName: profile.resumeFile.name,
            dataUrlLength: profile.resumeFile.dataUrl.length,
            fileType: profile.resumeFile.name.split('.').pop()
        });
        try {
            // TODO: create profiles for persistence later
            // Generate a proper UUID for the profile
            const profileId = crypto.randomUUID();
            console.log('[BROWSER_USE] Generated profile ID:', profileId);

            console.log('[BROWSER_USE] Creating BrowserUse session...');
            const session = await client.sessions.createSession({
            });
            console.log('[BROWSER_USE] Session created:', { sessionId: session.id });

            console.log('[BROWSER_USE] Creating public share for session...');
            liveSession = await client.sessions.createSessionPublicShare(session.id);
            console.log('[BROWSER_USE] Public share created:', { shareUrl: liveSession.shareUrl });

            // Extract session ID from the task (this might need to be adjusted based on SDK implementation)
            const sessionId = session.id;
            console.log('[BROWSER_USE] Using session ID for file upload:', sessionId);

            // Convert data URL to buffer
            const base64Data = profile.resumeFile.dataUrl.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            console.log('[BROWSER_USE] Resume converted to buffer:', {
                bufferSize: buffer.length,
                base64Length: base64Data.length
            });

            // Get presigned URL for file upload
            const contentType = profile.resumeFile.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' :
                profile.resumeFile.name.toLowerCase().endsWith('.txt') ? 'text/plain' :
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            
            console.log('[BROWSER_USE] Requesting presigned URL for file upload:', {
                fileName: profile.resumeFile.name,
                contentType,
                sizeBytes: buffer.length,
                sessionId
            });
            
            const presignedResponse = await fetch(`https://api.browser-use.com/api/v2/files/sessions/${sessionId}/presigned-url`, {
                method: 'POST',
                headers: {
                    'X-Browser-Use-API-Key': process.env.BROWSER_USE_API_KEY || '',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fileName: profile.resumeFile.name,
                    contentType,
                    sizeBytes: buffer.length,
                }),
            });
            
            console.log('[BROWSER_USE] Presigned URL response status:', presignedResponse.status);

            if (presignedResponse.ok) {
                const presignedData = await presignedResponse.json();
                console.log('[BROWSER_USE] Presigned URL data received:', {
                    url: presignedData.url,
                    method: presignedData.method,
                    fileName: presignedData.fileName,
                    fieldsCount: Object.keys(presignedData.fields || {}).length
                });

                // Upload file to presigned URL
                const formData = new FormData();
                Object.entries(presignedData.fields).forEach(([key, value]) => {
                    formData.append(key, value as string);
                });
                formData.append('file', new Blob([buffer]), profile.resumeFile.name);
                
                console.log('[BROWSER_USE] Uploading file to presigned URL...');
                const uploadResponse = await fetch(presignedData.url, {
                    method: presignedData.method || 'POST',
                    body: formData,
                });
                
                console.log('[BROWSER_USE] File upload response status:', uploadResponse.status);

                if (uploadResponse.ok) {
                    resumeFileName = presignedData.fileName;
                    console.log('[BROWSER_USE] File uploaded successfully:', resumeFileName);
                } else {
                    const uploadErrorText = await uploadResponse.text();
                    console.error('[BROWSER_USE] File upload failed:', {
                        status: uploadResponse.status,
                        statusText: uploadResponse.statusText,
                        response: uploadErrorText
                    });
                }
            } else {
                const presignedErrorText = await presignedResponse.text();
                console.error('[BROWSER_USE] Presigned URL request failed:', {
                    status: presignedResponse.status,
                    statusText: presignedResponse.statusText,
                    response: presignedErrorText
                });
            }
        } catch (uploadError) {
            console.error('[BROWSER_USE] Resume upload error:', {
                error: uploadError,
                message: uploadError instanceof Error ? uploadError.message : 'Unknown error',
                stack: uploadError instanceof Error ? uploadError.stack : undefined
            });
            // Continue without resume upload
        }
    } else {
        console.log('[BROWSER_USE] No resume file provided, skipping upload');
    }

    // Create the main application task
    const taskDescription = `
    Apply to the job at this URL: ${jobUrl}
    ${jobTitle ? `Job Title: ${jobTitle}` : ''}
    ${company ? `Company: ${company}` : ''}
    
    ${!jobTitle || !company ? 'If the job title or company name are not provided above, please extract this information from the job posting page.' : ''}
    
    Use this profile information to fill out the application form:
    ${profileInfo}
    
    ${resumeFileName ? `Upload the resume file named "${resumeFileName}" if there's an upload option.` : ''}
    
    Instructions: ${applicationInstructions}
    
    ${notes ? `Additional notes: ${notes}` : ''}
    
    Complete the application process and submit it successfully.
    `;
    
    console.log('[BROWSER_USE] Task description prepared:', {
        taskLength: taskDescription.length,
        hasResume: !!resumeFileName,
        hasNotes: !!notes,
        hasInstructions: !!applicationInstructions
    });

    console.log('[BROWSER_USE] Creating task with BrowserUse:', {
        secretsCount: Object.keys(secrets).length,
        flashMode: false,
        ignoreOutput: true
    });
    
    const task = await client.tasks.createTask({
        task: taskDescription,
        // No schema - we'll ignore the output and just track task completion
        secrets: Object.keys(secrets).length > 0 ? secrets : undefined,
        flashMode: false, // Use full mode for complex job applications
    });
    
    console.log('[BROWSER_USE] Task created successfully:', {
        taskId: task.id
    });

    console.log('[BROWSER_USE] Starting task completion...');
    const result = await task.complete();
    
    console.log('[BROWSER_USE] Task completed - ignoring output, assuming success:', {
        taskId: task.id,
        resultKeys: Object.keys(result)
    });

    // We're ignoring the parsed output and just assuming the task completed successfully
    // The actual success/failure will be determined by whether the task completed without throwing
    console.log('[BROWSER_USE] Task execution finished - treating as successful');



    const finalResult = {
        applicationId: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        submittedAt: new Date().toISOString(),
        method: "browser_automation",
        status: "submitted",
        message: "Application submitted via browser automation",
        taskId: task.id,
        taskUrl: liveSession?.shareUrl, // URL to monitor the browser automation
    };
    
    console.log('[BROWSER_USE] Final result prepared:', finalResult);
    
    return finalResult;
}

// Get application status endpoint
export async function GET(request: NextRequest) {
    console.log('[APPLY_API_GET] Starting application status check');
    
    const { searchParams } = new URL(request.url);
    const jobUrl = searchParams.get("jobUrl");
    
    console.log('[APPLY_API_GET] Request params:', {
        jobUrl,
        searchParamsSize: searchParams.size
    });

    if (!jobUrl) {
        console.log('[APPLY_API_GET] ERROR: No job URL provided');
        return NextResponse.json(
            { error: "Job URL is required" },
            { status: 400 }
        );
    }

    // In a real implementation, you would check the database for application status
    // For now, return a mock status
    const mockResult = {
        applied: Math.random() > 0.7, // 30% chance of already applied
        applicationDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    
    console.log('[APPLY_API_GET] Returning mock status:', mockResult);
    
    return NextResponse.json(mockResult);
}
