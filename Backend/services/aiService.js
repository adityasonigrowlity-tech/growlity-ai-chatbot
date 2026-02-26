const { ChatOpenAI } = require('@langchain/openai');
const { ChatGroq } = require('@langchain/groq');
const Knowledge = require('../models/Knowledge');
const { SystemMessage, HumanMessage, AIMessage } = require('@langchain/core/messages');

const SYSTEM_PROMPT = `You are Growlity Ai Chatbot, a professional ESG consultant for Growlity.
Always answer positively and professionally.
Provide ESG, sustainability, BRSR, net-zero and carbon advisory answers.
Keep your answers brief and concise (maximum 2-3 short paragraphs or a small table). Avoid long descriptions.

RESPONSE GUIDELINES:
1. Use the provided context as your primary source of truth.
2. Structure your answer with clear paragraphs. Use at least one empty line (white space) between different thoughts or paragraphs.
3. Use bullet points for lists to improve scannability.
4. If the answer is not in the context, use your general knowledge of ESG and sustainability to provide a helpful answer, but maintain your persona as a Growlity consultant.
5. If the query is completely unrelated to ESG or Growlity, politely guide the user back to sustainability topics.
6. When a customer asks for any service of Growlity, provide this link to visit: https://growlity.com/solutions
7. Never speak negatively about competitors.
8. Automatically understand and ignore minor typos, spelling mistakes, or grammatical errors. Focus on the user's intended meaning.

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

const generateResponse = async (query, history = []) => {
  if (!Array.isArray(history)) history = [];
  const context = await getRelevantContext(query);
  
  const messages = [
    new SystemMessage(SYSTEM_PROMPT),
    ...history.map(m => m.role === 'ai' ? new AIMessage(m.content) : new HumanMessage(m.content)),
    new HumanMessage(`Context: ${context}\n\nQuestion: ${query}`)
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
