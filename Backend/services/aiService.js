const { ChatOpenAI } = require('@langchain/openai');
const { ChatGroq } = require('@langchain/groq');
const Knowledge = require('../models/Knowledge');
const { SystemMessage, HumanMessage, AIMessage } = require('@langchain/core/messages');

const SYSTEM_PROMPT = `You are Growlity Ai Chatbot, a professional ESG consultant for Growlity.
Always answer positively and professionally.
Provide ESG, sustainability, BRSR, net-zero and carbon advisory answers.
Keep responses medium length — 1-2 short paragraphs (around 100-200 words). Use bullet points for lists. Be clear and informative but avoid unnecessary detail.

CONTEXT & HISTORY HANDLING:
1. Use the provided conversation history to identify the core topic (e.g., BRSR, EcoVadis, Net-Zero).
2. If the user asks a follow-up (like "process" or "what are the steps"), your answer MUST be about the topic identified in the history.
3. If the provided context is about a DIFFERENT topic (e.g., if history is about BRSR but context is about EcoVadis), SILENTLY IGNORE the context and use your general knowledge to explain the history's topic.
4. DO NOT explain to the user that the context is a mismatch or from a different standard. Just provide the correct answer directly.
5. Resolve pronouns (e.g., "it", "that", "the process") using previous turns.

RESPONSE GUIDELINES:
1. Structure your answer with clear paragraphs. Use at least one empty line (white space) between different thoughts or paragraphs.
2. Use bullet points for lists to improve scannability.
3. If the query is completely unrelated to ESG or Growlity, politely guide the user back to sustainability topics.
4. When a customer asks for any service of Growlity, provide this link to visit: https://growlity.com/solutions
5. Never speak negatively about competitors.
6. Automatically understand and ignore minor typos, spelling mistakes, or grammatical errors. Focus on the user's intended meaning.
7. If a user asks about a webinar, provide this link to register for upcoming webinars: https://growlity.com/webinars
8. If any person ask for footprint of growlity, tell it provide service in all region of world.
9. When any person asks about a whitepaper, give this link: https://growlity.com/esg-sustainability-publications/esg-sustainability-performance-of-25-global-solar-leaders

End every answer with: "For more personalized ESG guidance, book an appointment with Growlity: https://growlity.com/contact-us"`;

const { OpenAIEmbeddings } = require('@langchain/openai');

const getRelevantContext = async (query) => {
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENROUTER_API_KEY,
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
    },
    modelName: "openai/text-embedding-3-small",
  });

  const queryVector = await embeddings.embedQuery(query);

  // MongoDB Vector Search (Requires Atlas Search Index named 'vector_index')
  const results = await Knowledge.aggregate([
    {
      $vectorSearch: {
        index: "AiChatbot",
        path: "embedding",
        queryVector: queryVector,
        numCandidates: 100,
        limit: 5,
      },
    },
    {
      $project: {
        content: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]);

  return results.map(r => r.content).join('\n\n');
};

const condenseQuery = async (query, history) => {
  if (!history || history.length === 0) return query;

  const messages = [
    new SystemMessage(`You are a question rephraser for an ESG chatbot. 
    Your task is to take a follow-up question and rewrite it to be a standalone search query based on the conversation history.
    
    Rules:
    - If the follow-up refers to a previous topic (e.g., "process ?", "how to do it?"), rewrite it to include that topic (e.g., "What is the BRSR reporting process?").
    - DO NOT answer the question.
    - ONLY return the rephrased question text.
    - If the question is already standalone, return it as is.`),
    ...history.map(m => m.role === 'ai' ? new AIMessage(m.content) : new HumanMessage(m.content)),
    new HumanMessage(query)
  ];

  try {
    const groq = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: "llama-3.3-70b-versatile", // Use the strong model for rephrasing too
      temperature: 0,
    });
    const response = await groq.invoke(messages);
    return response.content.trim();
  } catch (err) {
    console.error("Condense Query failed:", err.message);
    return query;
  }
};

const generateResponse = async (query, history = []) => {
  if (!Array.isArray(history)) history = [];
  
  // Condense question for better context retrieval
  const condensedQuery = await condenseQuery(query, history);
  
  const context = await getRelevantContext(condensedQuery);
  
  const messages = [
    new SystemMessage(SYSTEM_PROMPT),
    ...history.map(m => m.role === 'ai' ? new AIMessage(m.content) : new HumanMessage(m.content)),
    new HumanMessage(`Context: ${context}\n\nQuestion: ${condensedQuery}`)
  ];

  // 1. Primary: Groq (Ultra-fast)
  try {
    const groq = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: "llama-3.3-70b-versatile",
      temperature: 0.4,
    });

    const response = await groq.invoke(messages);

    if (!response?.content) {
      throw new Error("Invalid Groq response");
    }

    return response.content;

  } catch (err) {
    console.error("Groq failed, falling back to OpenRouter:", err.message);
  }

  // 2. Fallback: OpenRouter
    try {
      const openRouter = new ChatOpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        configuration: {
          baseURL: "https://openrouter.ai/api/v1",
        },
        model: "gpt-oss-120b",
        temperature: 0.4,
      });

      const response = await openRouter.invoke(messages);

      if (!response?.content) {
        throw new Error("Invalid OpenRouter response");
      }

      return response.content;

    } catch (fallbackErr) {
      console.error("All AI models failed:", fallbackErr.message);
      return "I'm experiencing technical difficulties but remain committed to your ESG journey. Please try again or contact us directly at https://growlity.com/contact-us";
    }
};

module.exports = { generateResponse, getRelevantContext };
