import { GoogleGenAI } from "@google/genai"

// Ensure the API key is set
const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set. AI features will fallback to dummy data.")
}

const ai = new GoogleGenAI({ apiKey: apiKey || "dummy" })
const defaultModel = 'gemini-3.6-flash'

/**
 * Categorizes and analyzes a citizen's reported problem.
 */
export async function categorizeAndAnalyzeProblem(title: string, description: string, location: string, categoryFallback: string) {
  if (!apiKey) return getFallbackAnalysis(title, description, categoryFallback)

  const aiPrompt = `
    Analyze the following societal challenge reported by a citizen in India:
    Title: ${title}
    Description: ${description}
    Location: ${location}
    Reporter's Category: ${categoryFallback || "Not specified"}

    Provide a JSON response with the following strictly formatted keys:
    {
      "category": "The best matching high-level category (e.g., Infrastructure, Water, Education)",
      "subcategory": "A more specific sub-category",
      "severity": "Low, Medium, High, or Critical",
      "priority": "Low, Medium, High, or Urgent",
      "priorityReason": "A short 1 sentence explanation of why this priority was assigned.",
      "problemBrief": "A concise, professional 1-2 sentence summary of the problem and its impact",
      "impact": "A short description of who is affected and how",
      "suggestedStakeholders": ["Stakeholder 1", "Stakeholder 2", "Stakeholder 3"],
      "suggestedSolutions": ["Solution idea 1", "Solution idea 2", "Solution idea 3"]
    }
    Return ONLY valid JSON.
  `

  try {
    const response = await ai.models.generateContent({
      model: defaultModel,
      contents: aiPrompt,
      config: { responseMimeType: "application/json" }
    })
    
    return JSON.parse(response.text || "{}")
  } catch (error) {
    console.error("Gemini categorizeAndAnalyzeProblem failed:", error)
    return getFallbackAnalysis(title, description, categoryFallback)
  }
}

/**
 * Detects duplicate or highly similar problems before submission.
 */
export async function detectDuplicateProblems(newProblem: { title: string, description: string }, existingProblems: any[]) {
  if (!apiKey || existingProblems.length === 0) return { duplicates: [] }

  const problemsContext = existingProblems.map(p => 
    `ID: ${p.id} | Title: ${p.title} | Desc: ${p.description.substring(0, 100)}...`
  ).join('\n')

  const aiPrompt = `
    You are an AI tasked with finding duplicate or highly similar societal challenges.
    
    New Challenge:
    Title: ${newProblem.title}
    Description: ${newProblem.description}

    Existing Challenges:
    ${problemsContext}

    Compare the New Challenge against the Existing Challenges. Find any existing challenges that are semantically very similar (e.g. reporting the same pothole, same water shortage in the same area). 
    Return a JSON object:
    {
      "duplicates": [
        {
          "id": "ID of the existing challenge",
          "similarityPercentage": 85,
          "reason": "Short reason why they match"
        }
      ]
    }
    Only include duplicates with a similarity > 75%. If none, return empty array. Return ONLY valid JSON.
  `

  try {
    const response = await ai.models.generateContent({
      model: defaultModel,
      contents: aiPrompt,
      config: { responseMimeType: "application/json" }
    })
    
    return JSON.parse(response.text || '{"duplicates":[]}')
  } catch (error) {
    console.error("Gemini detectDuplicateProblems failed:", error)
    return { duplicates: [] }
  }
}

/**
 * Analyzes a university's solution proposal against the problem.
 */
export async function analyzeSolutionProposal(problemTitle: string, problemDescription: string, solutionTitle: string, solutionDescription: string, resources: string) {
  if (!apiKey) return getFallbackSolutionAnalysis()

  const aiPrompt = `
    Analyze a university's solution proposal for a societal problem.
    
    Problem:
    Title: ${problemTitle}
    Description: ${problemDescription}

    Solution Proposed:
    Title: ${solutionTitle}
    Description: ${solutionDescription}
    Resources Requested: ${resources}

    Provide a JSON response with the following strictly formatted keys:
    {
      "problemAlignment": "High, Medium, or Low (with a short sentence reason)",
      "expectedImpact": "Short description of the potential positive impact",
      "feasibility": "High, Medium, or Low (with a short sentence reason)",
      "implementationRisks": "Short description of potential risks or roadblocks",
      "suggestedImprovements": "One constructive suggestion to improve the solution"
    }
    Return ONLY valid JSON.
  `

  try {
    const response = await ai.models.generateContent({
      model: defaultModel,
      contents: aiPrompt,
      config: { responseMimeType: "application/json" }
    })
    
    return JSON.parse(response.text || "{}")
  } catch (error) {
    console.error("Gemini analyzeSolutionProposal failed:", error)
    return getFallbackSolutionAnalysis()
  }
}

/**
 * Matches a proposed solution to potential industry partners based on their profile tags.
 */
export async function matchIndustryToSolution(solutionTitle: string, solutionDescription: string, industries: any[]) {
  if (!apiKey || industries.length === 0) return { matches: [] }

  const industryContext = industries.map(i => 
    `ID: ${i.id} | Name: ${i.organization || i.name} | Tags: ${i.profileTags || 'None'}`
  ).join('\n')

  const aiPrompt = `
    Match a proposed societal solution to the most relevant industry partners for funding/support.
    
    Solution:
    Title: ${solutionTitle}
    Description: ${solutionDescription}

    Available Industries:
    ${industryContext}

    Return a JSON object:
    {
      "matches": [
        {
          "industryId": "ID of the matched industry",
          "reason": "1-2 sentence explanation of why this industry's profile aligns with the solution requirements."
        }
      ]
    }
    Only include strong matches. Return ONLY valid JSON.
  `

  try {
    const response = await ai.models.generateContent({
      model: defaultModel,
      contents: aiPrompt,
      config: { responseMimeType: "application/json" }
    })
    
    return JSON.parse(response.text || '{"matches":[]}')
  } catch (error) {
    console.error("Gemini matchIndustryToSolution failed:", error)
    return { matches: [] }
  }
}

/**
 * Generates an implementation roadmap when an industry accepts a solution.
 */
export async function generateImplementationPlan(solutionTitle: string, supportType: string) {
  if (!apiKey) return getFallbackRoadmap()

  const aiPrompt = `
    Generate a 4-5 phase implementation roadmap for a societal solution that has just been funded/supported by an industry partner.
    
    Solution: ${solutionTitle}
    Industry Support Type: ${supportType}

    Return a JSON object:
    {
      "phases": [
        {
          "title": "Phase Name (e.g. Planning & Design)",
          "tasks": ["Task 1", "Task 2"]
        }
      ]
    }
    Return ONLY valid JSON.
  `

  try {
    const response = await ai.models.generateContent({
      model: defaultModel,
      contents: aiPrompt,
      config: { responseMimeType: "application/json" }
    })
    
    return JSON.parse(response.text || '{"phases":[]}')
  } catch (error) {
    console.error("Gemini generateImplementationPlan failed:", error)
    return getFallbackRoadmap()
  }
}

/**
 * Summarizes the progress of a solution based on updates.
 */
export async function summarizeProgress(solutionTitle: string, updates: string[]) {
  if (!apiKey || updates.length === 0) return getFallbackProgressSummary()

  const updatesContext = updates.map((u, i) => `Update ${i+1}: ${u}`).join('\n')

  const aiPrompt = `
    Summarize the implementation progress of a societal solution.
    
    Solution: ${solutionTitle}
    Recent Updates:
    ${updatesContext}

    Return a JSON object:
    {
      "summary": "A 2-3 sentence overarching summary of current progress",
      "completedMilestones": ["Milestone 1"],
      "pendingMilestones": ["Pending 1"],
      "risks": ["Risk 1 or None"],
      "nextAction": "The immediate next step recommended"
    }
    Return ONLY valid JSON.
  `

  try {
    const response = await ai.models.generateContent({
      model: defaultModel,
      contents: aiPrompt,
      config: { responseMimeType: "application/json" }
    })
    
    return JSON.parse(response.text || "{}")
  } catch (error) {
    console.error("Gemini summarizeProgress failed:", error)
    return getFallbackProgressSummary()
  }
}

/**
 * Parses natural language search queries into structured filters.
 */
export async function parseNaturalLanguageSearch(query: string) {
  if (!apiKey) return { category: null, query: query }

  const aiPrompt = `
    Parse the following natural language search query for societal problems into structured filters.
    
    User Query: "${query}"

    Extract potential filters. Return a JSON object:
    {
      "category": "High level category if mentioned (e.g. Education, Water, Healthcare), else null",
      "location": "Location if mentioned, else null",
      "status": "Status if mentioned (e.g. SUBMITTED, RESOLVED), else null",
      "keywords": "Cleaned up keywords to search in title/description"
    }
    Return ONLY valid JSON.
  `

  try {
    const response = await ai.models.generateContent({
      model: defaultModel,
      contents: aiPrompt,
      config: { responseMimeType: "application/json" }
    })
    
    return JSON.parse(response.text || "{}")
  } catch (error) {
    console.error("Gemini parseNaturalLanguageSearch failed:", error)
    return { category: null, query: query }
  }
}

// Fallback functions
function getFallbackAnalysis(title: string, desc: string, cat: string) {
  return {
    category: cat || "Uncategorized",
    subcategory: "Pending AI Analysis",
    severity: "Medium",
    priority: "Medium",
    priorityReason: "Fallback priority assigned.",
    problemBrief: desc.substring(0, 150) + "...",
    impact: "Pending AI Analysis",
    suggestedStakeholders: ["Local Authorities"],
    suggestedSolutions: ["Pending Analysis"]
  }
}

function getFallbackSolutionAnalysis() {
  return {
    problemAlignment: "Medium - Standard alignment",
    expectedImpact: "Moderate positive impact expected.",
    feasibility: "Medium - Standard feasibility",
    implementationRisks: "Standard implementation risks apply.",
    suggestedImprovements: "Consider gathering more community feedback."
  }
}

function getFallbackRoadmap() {
  return {
    phases: [
      { title: "Phase 1 - Planning", tasks: ["Requirement analysis", "Resource identification"] },
      { title: "Phase 2 - Development", tasks: ["Technical implementation"] },
      { title: "Phase 3 - Deployment", tasks: ["Field deployment", "Testing"] }
    ]
  }
}

function getFallbackProgressSummary() {
  return {
    summary: "Implementation is progressing steadily.",
    completedMilestones: ["Initial planning"],
    pendingMilestones: ["Field deployment"],
    risks: ["None identified"],
    nextAction: "Continue execution as planned."
  }
}
