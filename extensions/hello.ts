import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

/**
 * Example extension — registered as `/hello` command and `greet` tool.
 *
 * Replace this with your own extensions.
 */

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.notify("agentic-pi package loaded", "info");
  });

  pi.registerCommand("hello", {
    description: "Say hello from agentic-pi",
    handler: async (args, ctx) => {
      ctx.ui.notify(`Hello ${args || "world"}!`, "info");
    },
  });
}