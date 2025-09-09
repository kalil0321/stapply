import { BrowserUseClient } from "browser-use-sdk";

export interface JobResult {
    title: string;
    company: string;
    location?: string;
    description?: string;
    link: string;
    postedAt?: string;
    source?: string;
    similarityScore?: number;
    relevanceScore?: number;
}

export async function searchJobs(query: string): Promise<JobResult[]> {
    try {
        // For now, return mock data since Browser Use SDK API needs to be configured
        // TODO: Implement actual Browser Use SDK integration when API is properly set up
        console.log("Searching for jobs with query:", query);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return getMockJobResults(query);
    } catch (error) {
        console.error("Error searching for jobs:", error);
        
        // Return mock data as fallback for development
        return getMockJobResults(query);
    }
}

function parseJobResults(content: string): JobResult[] {
    const jobs: JobResult[] = [];
    
    try {
        // Try to extract structured data from the response
        // This is a simplified parser - in production, you might want more sophisticated parsing
        
        const lines = content.split('\n');
        let currentJob: Partial<JobResult> = {};
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            if (trimmedLine.match(/^title:|^job title:/i)) {
                if (currentJob.title) {
                    jobs.push(currentJob as JobResult);
                }
                currentJob = { title: trimmedLine.replace(/^title:|^job title:/i, '').trim() };
            } else if (trimmedLine.match(/^company:/i)) {
                currentJob.company = trimmedLine.replace(/^company:/i, '').trim();
            } else if (trimmedLine.match(/^location:/i)) {
                currentJob.location = trimmedLine.replace(/^location:/i, '').trim();
            } else if (trimmedLine.match(/^description:/i)) {
                currentJob.description = trimmedLine.replace(/^description:/i, '').trim();
            } else if (trimmedLine.match(/^link:|^url:/i)) {
                currentJob.link = trimmedLine.replace(/^link:|^url:/i, '').trim();
            } else if (trimmedLine.match(/^posted:|^date:/i)) {
                currentJob.postedAt = trimmedLine.replace(/^posted:|^date:/i, '').trim();
            } else if (trimmedLine.match(/^source:/i)) {
                currentJob.source = trimmedLine.replace(/^source:/i, '').trim();
            }
        }
        
        // Add the last job if it exists
        if (currentJob.title) {
            jobs.push(currentJob as JobResult);
        }
        
        // Ensure all jobs have required fields
        return jobs.filter(job => job.title && job.company && job.link);
        
    } catch (error) {
        console.error("Error parsing job results:", error);
        return [];
    }
}

function getMockJobResults(query: string): JobResult[] {
    // Mock data for development/testing
    const mockJobs: JobResult[] = [
        {
            title: "Software Engineering Internship",
            company: "Google",
            location: "Mountain View, CA",
            description: "Join our tech internship program in Silicon Valley. Work on real projects with cutting-edge technology and learn from industry experts.",
            link: "https://example.com/job/1",
            postedAt: new Date().toISOString(),
            source: "LinkedIn",
            relevanceScore: 95
        },
        {
            title: "Tech Internship - Frontend Development",
            company: "Meta",
            location: "Menlo Park, CA",
            description: "Summer tech internship opportunity in Silicon Valley. Build user interfaces for billions of users using React and modern web technologies.",
            link: "https://example.com/job/2",
            postedAt: new Date(Date.now() - 86400000).toISOString(),
            source: "Indeed",
            relevanceScore: 92
        },
        {
            title: "Senior Software Engineer",
            company: "TechCorp Inc.",
            location: "San Francisco, CA",
            description: "We're looking for a senior software engineer to join our growing team. You'll work on cutting-edge projects and collaborate with talented engineers.",
            link: "https://example.com/job/3",
            postedAt: new Date(Date.now() - 172800000).toISOString(),
            source: "LinkedIn",
            relevanceScore: 88
        },
        {
            title: "Full Stack Developer",
            company: "StartupXYZ",
            location: "Remote",
            description: "Join our fast-growing startup as a full stack developer. Work with modern technologies and help build the next generation of web applications.",
            link: "https://example.com/job/4",
            postedAt: new Date(Date.now() - 259200000).toISOString(),
            source: "Indeed",
            relevanceScore: 85
        },
        {
            title: "Data Science Internship",
            company: "Apple",
            location: "Cupertino, CA",
            description: "Summer internship in Silicon Valley working on machine learning and data analytics projects. Perfect for students interested in AI and tech.",
            link: "https://example.com/job/5",
            postedAt: new Date(Date.now() - 345600000).toISOString(),
            source: "Glassdoor",
            relevanceScore: 90
        },
        {
            title: "Backend Engineer",
            company: "DataFlow Systems",
            location: "Austin, TX",
            description: "Looking for a backend engineer to work on our scalable data processing systems. Experience with Python, Go, or Java required.",
            link: "https://example.com/job/6",
            postedAt: new Date(Date.now() - 432000000).toISOString(),
            source: "AngelList",
            relevanceScore: 82
        }
    ];

    // Filter mock jobs based on query relevance (keyword matching)
    const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    const jobKeywords = ['job', 'jobs', 'engineer', 'developer', 'tech', 'software', 'frontend', 'backend', 'devops', 'internship', 'intern'];
    
    // If query contains job-related keywords, return relevant jobs
    const hasJobKeywords = queryWords.some(word => jobKeywords.includes(word));
    
    if (hasJobKeywords || queryWords.length === 0) {
        // Return jobs that match any of the query words
        const relevantJobs = mockJobs.filter(job => {
            const jobText = `${job.title} ${job.company} ${job.description} ${job.location}`.toLowerCase();
            return queryWords.length === 0 || queryWords.some(word => jobText.includes(word));
        });
        
        return relevantJobs.slice(0, 5);
    }
    
    // If no job keywords found, return all jobs (since this is mock data)
    return mockJobs.slice(0, 3);
}
