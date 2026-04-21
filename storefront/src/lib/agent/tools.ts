import Anthropic from "@anthropic-ai/sdk"

export const storefrontAgentTools: Anthropic.Tool[] = [
  // ─── UI tools (browser-side, dispatched via AgentToolContext) ───
  {
    name: "setSearchField",
    description:
      "Set ONE field in the tire search form on the home view. Call once per field — do not batch. Fills the field in the UI with an amber pulse so the customer sees what you did. Valid fields: width (three-digit mm, e.g. 205), profile (two-digit aspect ratio, e.g. 55), rim (two-digit inches, e.g. 16), qty (1–8), season (one of: sommer, vinter-piggfritt, vinter-piggdekk).",
    input_schema: {
      type: "object" as const,
      properties: {
        field: {
          type: "string",
          enum: ["width", "profile", "rim", "qty", "season"],
        },
        value: { type: "string", description: "Field value as a string." },
      },
      required: ["field", "value"],
    },
  },
  {
    name: "triggerSearch",
    description:
      "Run the tire search and scroll the customer to the results view. Fails with ok:false if the search form is incomplete. On success, returns the full product list inline so you can describe what you found without a second call.",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "selectTire",
    description: "Open the checkout panel for a specific product",
    input_schema: {
      type: "object" as const,
      properties: {
        productId: { type: "string" },
      },
      required: ["productId"],
    },
  },
  {
    name: "scrollToProduct",
    description: "Scroll the product carousel to a specific product card",
    input_schema: {
      type: "object" as const,
      properties: {
        productId: { type: "string" },
      },
      required: ["productId"],
    },
  },
  {
    name: "prefillCheckoutField",
    description: "Fill a checkout field with a value and highlight animation",
    input_schema: {
      type: "object" as const,
      properties: {
        field: { type: "string", description: "Field name: first_name, last_name, address, city, postal_code, email, phone" },
        value: { type: "string" },
      },
      required: ["field", "value"],
    },
  },
  {
    name: "openPaymentStep",
    description: "Advance the checkout to the payment step",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  // ─── Data tools (server-side Layer 2) ───
  {
    name: "searchProducts",
    description: "Search for tires by dimension",
    input_schema: {
      type: "object" as const,
      properties: {
        dimension: { type: "string", description: "Format: WIDTHxPROFILExRIM e.g. 205/55R16" },
        filters: {
          type: "object",
          properties: {
            priority: { type: "string", description: "noise | fuel | grip | value" },
          },
        },
      },
      required: ["dimension"],
    },
  },
  {
    name: "getProductDetail",
    description: "Get full product details for a tire",
    input_schema: {
      type: "object" as const,
      properties: {
        productId: { type: "string" },
      },
      required: ["productId"],
    },
  },
  {
    name: "lookupOrder",
    description: "Look up an order by email and one-time-code token",
    input_schema: {
      type: "object" as const,
      properties: {
        email: { type: "string" },
        otcToken: { type: "string" },
      },
      required: ["email", "otcToken"],
    },
  },
  {
    name: "sendOneTimeCode",
    description: "Send a one-time login code to a customer email",
    input_schema: {
      type: "object" as const,
      properties: {
        email: { type: "string" },
      },
      required: ["email"],
    },
  },
  {
    name: "verifyOneTimeCode",
    description: "Verify a one-time code and return an auth token",
    input_schema: {
      type: "object" as const,
      properties: {
        email: { type: "string" },
        code: { type: "string" },
      },
      required: ["email", "code"],
    },
  },
  {
    name: "escalateToAdmin",
    description: "Escalate an unanswered customer question to Moohsen",
    input_schema: {
      type: "object" as const,
      properties: {
        email: { type: "string" },
        message: { type: "string" },
      },
      required: ["message"],
    },
  },
]

export const UI_TOOL_NAMES = new Set([
  "setSearchField",
  "fillDimensionField",
  "triggerSearch",
  "selectTire",
  "scrollToProduct",
  "prefillCheckoutField",
  "openPaymentStep",
])

// Tools the server intercepts to produce a meaningful tool_result
// beyond {ok:true}. They still emit a UI tool_call for the browser
// side effect before resolving on the server.
export const SERVER_UI_TOOL_NAMES = new Set(["triggerSearch"])
