export interface ParsedLinkedInData {
  headline?: string;
  location?: string;
  follower_count?: number;
  connection_count?: number;
  profile_image_url?: string;
  current_employer?: string;
  current_position_title?: string;
  current_position_start_date?: string;
  years_in_current_role?: number;
  about?: string;
  skills?: string[];
  languages?: string[];
  total_years_experience?: number;
  industry_focus?: string;
  previous_employers?: string[];
  education_summary?: string;
  highest_degree?: string;
  profile_completeness_score?: number;
  last_activity_date?: string;
  work_history?: WorkExperience[];
}

export interface WorkExperience {
  company: string;
  title: string;
  dates: string;
  duration?: string;
  description?: string;
  location?: string;
  is_current?: boolean;
}

export function parseLinkedInProfile(rawData: any): ParsedLinkedInData {
  if (!rawData) return {};

  const text = typeof rawData === 'string' ? rawData : JSON.stringify(rawData);

  return {
    headline: extractHeadline(text),
    location: extractLocation(text),
    follower_count: extractFollowerCount(text),
    connection_count: extractConnectionCount(text),
    profile_image_url: extractProfileImage(text),
    current_employer: extractCurrentEmployer(text),
    current_position_title: extractCurrentPosition(text),
    current_position_start_date: extractCurrentPositionStartDate(text),
    years_in_current_role: calculateYearsInCurrentRole(text),
    about: extractAbout(text),
    skills: extractSkills(text),
    languages: extractLanguages(text),
    total_years_experience: calculateTotalExperience(text),
    industry_focus: extractIndustryFocus(text),
    previous_employers: extractPreviousEmployers(text),
    education_summary: extractEducationSummary(text),
    highest_degree: extractHighestDegree(text),
    profile_completeness_score: calculateProfileCompleteness(text),
    last_activity_date: extractLastActivityDate(text),
    work_history: extractWorkHistory(text),
  };
}

function extractHeadline(text: string): string | undefined {
  const match = text.match(/(?:Headline|Title):\s*([^\n]+)/i) ||
                text.match(/^([^\n]+?)(?:\s*at\s+|\s*\||$)/m);
  return match?.[1]?.trim();
}

function extractLocation(text: string): string | undefined {
  const match = text.match(/(?:Location|Based in):\s*([^\n]+)/i);
  return match?.[1]?.trim();
}

function extractFollowerCount(text: string): number | undefined {
  const match = text.match(/(\d+(?:,\d+)*)\s*followers/i);
  return match ? parseInt(match[1].replace(/,/g, '')) : undefined;
}

function extractConnectionCount(text: string): number | undefined {
  const match = text.match(/(\d+(?:,\d+)*)\s*connections/i);
  return match ? parseInt(match[1].replace(/,/g, '')) : undefined;
}

function extractProfileImage(text: string): string | undefined {
  const match = text.match(/(?:Profile Image|Photo):\s*(https?:\/\/[^\s]+)/i);
  return match?.[1]?.trim();
}

function extractCurrentEmployer(text: string): string | undefined {
  const expSection = text.match(/Experience:?\s*([\s\S]*?)(?=Education:|Skills:|$)/i);
  if (!expSection) return undefined;
  
  const firstJob = expSection[1].match(/(?:at\s+)?([A-Z][^\n•·-]+?)(?:\n|•|·|-|$)/);
  return firstJob?.[1]?.trim();
}

function extractCurrentPosition(text: string): string | undefined {
  const expSection = text.match(/Experience:?\s*([\s\S]*?)(?=Education:|Skills:|$)/i);
  if (!expSection) return undefined;
  
  const firstTitle = expSection[1].match(/^([^\n]+?)(?:\s*at\s+|\n)/);
  return firstTitle?.[1]?.trim();
}

function extractCurrentPositionStartDate(text: string): string | undefined {
  const expSection = text.match(/Experience:?\s*([\s\S]*?)(?=Education:|Skills:|$)/i);
  if (!expSection) return undefined;
  
  const dateMatch = expSection[1].match(/(\w+\s+\d{4})\s*-\s*Present/i);
  if (dateMatch) {
    return convertToISODate(dateMatch[1]);
  }
  return undefined;
}

function calculateYearsInCurrentRole(text: string): number | undefined {
  const expSection = text.match(/Experience:?\s*([\s\S]*?)(?=Education:|Skills:|$)/i);
  if (!expSection) return undefined;
  
  const dateMatch = expSection[1].match(/(\w+\s+\d{4})\s*-\s*Present/i);
  if (dateMatch) {
    const startDate = new Date(dateMatch[1]);
    const now = new Date();
    return Math.floor((now.getTime() - startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  }
  return undefined;
}

function extractAbout(text: string): string | undefined {
  const match = text.match(/(?:About|Summary):\s*([\s\S]*?)(?=\n(?:Experience|Education|Skills):|$)/i);
  return match?.[1]?.trim();
}

function extractSkills(text: string): string[] | undefined {
  const match = text.match(/Skills?:\s*([\s\S]*?)(?=\n[A-Z][a-z]+:|$)/i);
  if (!match) return undefined;
  
  const skills = match[1]
    .split(/[,•·\n-]/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && s.length < 50);
  
  return skills.length > 0 ? skills : undefined;
}

function extractLanguages(text: string): string[] | undefined {
  const match = text.match(/Languages?:\s*([\s\S]*?)(?=\n[A-Z][a-z]+:|$)/i);
  if (!match) return undefined;
  
  const languages = match[1]
    .split(/[,•·\n-]/)
    .map(l => l.trim())
    .filter(l => l.length > 0);
  
  return languages.length > 0 ? languages : undefined;
}

function calculateTotalExperience(text: string): number | undefined {
  const workHistory = extractWorkHistory(text);
  if (!workHistory || workHistory.length === 0) return undefined;
  
  let totalMonths = 0;
  
  for (const job of workHistory) {
    if (job.duration) {
      const yearMatch = job.duration.match(/(\d+)\s*yr/);
      const monthMatch = job.duration.match(/(\d+)\s*mo/);
      
      if (yearMatch) totalMonths += parseInt(yearMatch[1]) * 12;
      if (monthMatch) totalMonths += parseInt(monthMatch[1]);
    }
  }
  
  return totalMonths > 0 ? Math.floor(totalMonths / 12) : undefined;
}

function extractIndustryFocus(text: string): string | undefined {
  const industries = ['Banking', 'Finance', 'Mortgage', 'Real Estate', 'Technology', 'Healthcare', 'Education'];
  
  for (const industry of industries) {
    if (text.toLowerCase().includes(industry.toLowerCase())) {
      return industry;
    }
  }
  
  return undefined;
}

function extractPreviousEmployers(text: string): string[] | undefined {
  const workHistory = extractWorkHistory(text);
  if (!workHistory || workHistory.length <= 1) return undefined;
  
  const employers = workHistory
    .filter(job => !job.is_current)
    .map(job => job.company)
    .slice(0, 5);
  
  return employers.length > 0 ? employers : undefined;
}

function extractEducationSummary(text: string): string | undefined {
  const match = text.match(/Education:\s*([\s\S]*?)(?=\n(?:Experience|Skills|Licenses):|$)/i);
  return match?.[1]?.trim();
}

function extractHighestDegree(text: string): string | undefined {
  const degrees = ['PhD', 'Doctorate', "Master's", 'MBA', "Bachelor's", 'Associates'];
  const eduSection = extractEducationSummary(text);
  
  if (!eduSection) return undefined;
  
  for (const degree of degrees) {
    if (eduSection.includes(degree)) {
      return degree;
    }
  }
  
  return undefined;
}

function calculateProfileCompleteness(text: string): number | undefined {
  let score = 0;
  
  if (extractHeadline(text)) score += 15;
  if (extractLocation(text)) score += 10;
  if (extractAbout(text)) score += 20;
  if (extractWorkHistory(text)?.length) score += 25;
  if (extractEducationSummary(text)) score += 15;
  if (extractSkills(text)?.length) score += 10;
  if (extractProfileImage(text)) score += 5;
  
  return score;
}

function extractLastActivityDate(text: string): string | undefined {
  const match = text.match(/Last activity:\s*(\d{4}-\d{2}-\d{2})/i);
  return match?.[1];
}

function extractWorkHistory(text: string): WorkExperience[] | undefined {
  const expSection = text.match(/Experience:?\s*([\s\S]*?)(?=Education:|Skills:|Licenses:|$)/i);
  if (!expSection) return undefined;
  
  const jobs: WorkExperience[] = [];
  const jobBlocks = expSection[1].split(/(?=^[A-Z]|\n[A-Z])/m);
  
  for (const block of jobBlocks) {
    if (block.trim().length < 10) continue;
    
    const titleMatch = block.match(/^([^\n]+?)(?:\s*at\s+|\n)/);
    const companyMatch = block.match(/at\s+([^\n•·-]+)/);
    const datesMatch = block.match(/(\w+\s+\d{4}\s*-\s*(?:Present|\w+\s+\d{4}))/);
    const durationMatch = block.match(/\(([^)]+)\)/);
    
    if (titleMatch && companyMatch) {
      jobs.push({
        title: titleMatch[1].trim(),
        company: companyMatch[1].trim(),
        dates: datesMatch?.[1] || '',
        duration: durationMatch?.[1],
        is_current: block.toLowerCase().includes('present'),
      });
    }
  }
  
  return jobs.length > 0 ? jobs : undefined;
}

function convertToISODate(monthYear: string): string {
  const date = new Date(monthYear);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}
