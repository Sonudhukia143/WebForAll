import {Sandbox} from "@e2b/code-interpreter";
import { AgentResult, TextMessage } from "@inngest/agent-kit";

/**
 * Connects to a sandbox environment using the provided sandbox ID.
 *
 * @param sandboxId - The unique identifier of the sandbox to connect to
 * @returns A promise that resolves to the connected sandbox instance
 */
export async function getSandbox(sandboxId: string) {
    const sandbox = await Sandbox.connect (sandboxId);
    return sandbox;
}

export function lastAssistantTextMessageContent(result: AgentResult) {
    const lastAssistantTextMessageContentIndex = result.output.findLastIndex(
        (message) => message.role = 'assistant',
    );

    const message  = result.output[lastAssistantTextMessageContentIndex] as
    |
    TextMessage
    | 
    undefined;

    return message?.content
    ? typeof message.content === "string"
    ? message.content
    : message.content.map((c) => c.text).join("")
    : undefined;
}