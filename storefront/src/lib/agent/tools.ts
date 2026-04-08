import Anthropic from "@anthropic-ai/sdk"

export const storefrontAgentTools: Anthropic.Tool[] = [
  // ─── UI tools (browser-side, dispatched via AgentToolContext) ───
  {
    name: "fillDimensionField",
    description: "Fill the dimension search fields (width, profile, rim) with amber pulse animation",
    input_schema: {
      type: "object" as const,
      properties: {
        width: { type: "number" },
        profile: { type: "number" },
        rim: { type: "number" },
      },
      required: ["width", "profile", "rim"],
    },
  },
  {
    name: "triggerSearch",
    description: "Fire the search — triggers parallax to results view",
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
  "fillDimensionField",
  "triggerSearch",
  "selectTire",
  "scrollToProduct",
  "prefillCheckoutField",
  "openPaymentStep",
])
