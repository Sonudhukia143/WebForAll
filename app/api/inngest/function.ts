import { inngest } from "../../../inngest/client";
import { Sandbox } from "@e2b/code-interpreter"

// export const helloWorld = inngest.createFunction(
//   { id: "hello-world" },
//   { event: "test/hello.world" },
//   async ({ event, step }) => {
//     await step.sleep("wait-a-moment", "2s");
//     return { message: `Hello ${event.data.email}!` };
//   },
// );


import { gemini, createAgent } from "@inngest/agent-kit";
import { getSandbox } from "./utils";
export const summarizeContents = inngest.createFunction(
    { id: "summarize-contents" },
    { event: "app/ticket.created" },
    async ({ event, step }) => {
        const sandboxId = await step.run("get-sandbox-id", async () => {
            const sandbox = await Sandbox.create("devforall-test-2");
            return sandbox.sandboxId;
        })

        console.log("Event data:", event.data);
        console.log("Event name:", event.name);
        console.log(step);

        // Create a new agent with a system prompt (you can add optional tools, too)
        const writer = createAgent({
            name: "writer",
            system: "You are an expert writer.You write readable, concise, simple content.",
            model: gemini({
                model: "gemini-1.5-flash", // Use the Gemini model
                apiKey: process.env.GEMINI_API_KEY, // Use your Gemini API key from environment variables
                // Note: max_tokens is required for Gemini models
                defaultParameters: { },
            }),
        });

        const sandboxUrl = await step.run("get-sandbox-url", async () => {
            const sandbox = await getSandbox(sandboxId);
            const host =  sandbox.getHost(3000); // Assuming the sandbox template is running on port 3000
            return `https://${host}`;
        }); 

        // Run the agent with an input.  This automatically uses steps
        // to call your AI model.
        const { output } = await writer.run("Write a tweet on how AI works");

        console.log("Output from agent:", output);
        return {
            output,
            message: `AI response: ${output}`,
            sandboxUrl,
        }
    }
);