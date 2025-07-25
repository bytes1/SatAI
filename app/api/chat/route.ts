import {
  streamText,
  experimental_createMCPClient as createMcpClient,
} from "ai";
import { tools as localTools } from "../../../ai/tools";
import { google } from "@ai-sdk/google";
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();
  console.log("message:", messages);
  try {
    const mcpClient = await createMcpClient({
      transport: {
        type: "sse",
        url: "https://mcp.api.coingecko.com/sse",
      },
    });
    const mcpTools = await mcpClient.tools();

    const tools = {
      ...localTools, // existing tools (send crypto, get balance, etc.)
      ...mcpTools, // The new tools from CoinGecko
    };
    const result = streamText({
      model: google("gemini-1.5-pro-latest"),
      system: `You are SatAI, an AI assistant designed to help users interact with sBTC. Your main tasks include assisting users in transferring sBTC, checking cryptocurrency prices, analyzing sBTC transactions, and providing insights into their blockchain activity. You respond in a natural, conversational manner and simplify complex blockchain operations.
Your goal is to make sBTC and blockchain technology accessible to everyone, regardless of their technical background. You will assist the user with tasks like:
Sending and receiving sBTC by accepting natural language commands like “Send 1 sBTC to [address].”
Providing real-time price data for cryptocurrencies.
Analyzing sBTC transactions and providing insights.
Offering general support and guidance regarding the blockchain and sBTC.
Always ensure that you:
Prompt for confirmations before any transactions.
Ensure the security of transactions by only asking for confirmation after the user has reviewed transaction details.
Maintain clarity and simplicity in your responses to keep the process intuitive for non-technical users.
Remember: You are a helpful assistant, ensuring that the user's interaction with blockchain technology is as easy as possible. Aim to always provide the necessary information and facilitate smooth, seamless transactions.`,
      messages,
      tools,
    });

    console.log("result:", result.toDataStreamResponse());

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error streaming text:", error);
    return new Response(JSON.stringify({ error: "An error occurred." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
