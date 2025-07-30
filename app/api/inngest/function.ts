import { z } from "zod";
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

import { gemini, createAgent, createTool, createNetwork } from "@inngest/agent-kit";
import { getSandbox, lastAssistantTextMessageContent } from "./utils";
import { PROMPT } from "./prompt";

export const summarizeContents = inngest.createFunction(
    { id: "summarize-contents" },
    { event: "app/ticket.created" },
    async ({ event, step }) => {
        const sandboxId = await step.run("get-sandbox-id", async () => {
            const sandbox = await Sandbox.create("devforall-test-2");
            return sandbox.sandboxId;
        })

        console.log("Event data:", event.data.value);

        // Create a new agent with a system prompt (you can add optional tools, too)
        const codeAgent = createAgent({
            name: "code-agent",
            description:"An expert conding agent",
            system: PROMPT,
            model: gemini({
                model: "gemini-1.5-flash", // Use the Gemini model
                apiKey: process.env.GEMINI_API_KEY, // Use your Gemini API key from environment variables
                // Note: max_tokens is required for Gemini models
                defaultParameters: {},
            }),
            tools: [
                createTool({
                    name: "terminal",
                    description: "Use the terminal to run commands",
                    parameters: z.object({
                        command: z.string(),
                    }),
                    handler: async ({ command }, { step }) => {
                        return await step?.run("terminal", async () => {
                            const buffers = { stdout: "", stderr: "" };

                            try {
                                const sandbox = await getSandbox(sandboxId);
                                const result = await sandbox.commands.run(command, {
                                    onStdout: (data: string) => {
                                        buffers.stdout += data;
                                    },
                                    onStderr: (data: string) => {
                                        buffers.stderr += data;
                                    }
                                });
                                return result.stdout;
                            } catch (error) {
                                console.error(
                                    `Error running command "${command}":\n`,
                                    `stdout: ${buffers.stdout}\n`,
                                    `stderr: ${buffers.stderr}\n`,
                                );
                            }
                        })
                    }
                }),
                createTool({
                    name: "createOrUpdateFiles",
                    description: "Create or update files in the sandbox",
                    parameters : z.object({
                        files: z.array(z.object({
                            path: z.string(),
                            content: z.string(),
                        })),
                    }),
                    handler: async ({ files }, { step, network }) => {
                        const newFiles = await step?.run("createOrUpdateFiles", async () => {
                            try {
                                const updatedFiles = network.state.data.files || {};
                                const sandbox = await getSandbox(sandboxId);

                                for (const file of files) {
                                    await sandbox.files.write(file.path, file.content);
                                    updatedFiles[file.path] = file.content;
                                }

                                return updatedFiles;
                            } catch (e) {
                                return "Error: " + e;
                            }
                        })
                        if (typeof newFiles === "object") {
                            network.state.data.files = newFiles;
                        }
                    },
                }),
                createTool({
                    name: "readFiles",
                    description: "Read files from the sandbox",
                    parameters: z.object({
                        files: z.array(z.string()),
                    }),
                    handler: async ({ files }, { step }) => {
                        return await step?.run("readFiles", async () => {
                            try {
                                const sandbox = await getSandbox(sandboxId);
                                const contents = [];
                                for (const file of files) {
                                    const content = await sandbox.files.read(file);
                                    contents.push({ path: file, content });
                                }
                                return JSON.stringify(contents);
                            } catch (e) {
                                return "Error: " + e;
                            }
                        })
                    }
                })
            ],
            lifecycle: {
                onResponse: async ({result , network}) => {
                    const lastAssistantTextMessage = 
                    lastAssistantTextMessageContent(result);

                    if(lastAssistantTextMessage && network){
                        if(lastAssistantTextMessage.includes("<task_summary>")) {
                            network.state.data.summary = lastAssistantTextMessage;
                        }
                    }

                    return result;
                }
            }
        });

        const network = createNetwork({
            name:"coding-agent-network",
            agents: [codeAgent],
            maxIter: 15,
            router: async ({ network}) => {
                const summary = network.state.data.summary;

                if(summary){
                    return;
                }

                return codeAgent;
            }
        });

        const result = await network.run("create a simple calculator");

        const sandboxUrl = await step.run("get-sandbox-url", async () => {
            const sandbox = await getSandbox(sandboxId);
            const host = sandbox.getHost(3000); // Assuming the sandbox template is running on port 3000
            return `https://${host}`;
        });

        // Run the agent with an input.  This automatically uses steps
        // to call your AI model.
        //const { output } = await codeAgent.run("Write a tweet on how AI works");
       // console.log("Output from agent:", output);

        return {
            url:sandboxUrl,
            title: "Fragment",
            files: result.state.data.files,
            summary: result.state.data.summary
        }
    }
);