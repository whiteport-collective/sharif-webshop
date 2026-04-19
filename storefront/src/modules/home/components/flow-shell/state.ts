"use client"

export type FlowSection = "default" | "results" | "checkout" | "booking" | "complete"
export type DimensionsState = "empty" | "partial" | "valid" | "invalid"
export type CartState = "empty" | "has_items" | "syncing" | "error"
export type CheckoutState =
  | "idle"
  | "cart_review"
  | "editing_address"
  | "address_complete"
  | "editing_payment"
  | "payment_complete"
export type PaymentState = "idle" | "pending" | "authorized" | "captured" | "failed"
export type BookingState = "idle" | "day_expanded" | "slot_selected" | "confirmed"
export type AssistantState = "closed" | "open"

export type FlowShellState = {
  flow: FlowSection
  dimensions: DimensionsState
  cart: CartState
  checkout: CheckoutState
  payment: PaymentState
  booking: BookingState
  assistant: AssistantState
  checkoutLocked: boolean
  conflict: "none" | "dimension_conflict"
}

export type FlowShellScene =
  | "default_no_dimensions"
  | "browsing"
  | "ready_to_checkout"
  | "cart_with_mounting"
  | "address_entry_active"
  | "payment_entry_active"
  | "awaiting_booking"
  | "booking_ready_to_confirm"
  | "complete"
  | "dimension_conflict"
  | "cart_empty_after_removal"
  | "assistant_open_on_results"
  | "assistant_open_on_checkout"

export type FlowShellEvent =
  | { type: "DIMENSIONS_CLEARED" }
  | { type: "DIMENSIONS_VALID" }
  | { type: "DIMENSIONS_INVALID" }
  | { type: "DIMENSIONS_PARTIAL" }
  | { type: "SEARCH_SUBMITTED" }
  | { type: "NAV_TO_DEFAULT" }
  | { type: "NAV_TO_RESULTS" }
  | { type: "NAV_TO_CHECKOUT" }
  | { type: "NAV_TO_BOOKING" }
  | { type: "NAV_TO_COMPLETE" }
  | { type: "CART_SYNC_STARTED" }
  | { type: "CART_SYNC_FAILED" }
  | { type: "CART_UPDATED"; hasItems: boolean }
  | { type: "DIMENSION_CONFLICT" }
  | { type: "DIMENSION_CONFLICT_DISMISSED" }
  | { type: "CHECKOUT_STEP_CHANGED"; step: string }
  | { type: "PAYMENT_PENDING" }
  | { type: "PAYMENT_COMPLETED" }
  | { type: "BOOKING_DAY_EXPANDED" }
  | { type: "BOOKING_SLOT_SELECTED" }
  | { type: "BOOKING_CONFIRMED" }
  | { type: "ASSISTANT_OPENED" }
  | { type: "ASSISTANT_CLOSED" }

export const initialFlowShellState: FlowShellState = {
  flow: "default",
  dimensions: "empty",
  cart: "empty",
  checkout: "idle",
  payment: "idle",
  booking: "idle",
  assistant: "closed",
  checkoutLocked: false,
  conflict: "none",
}

export function reduceFlowShellState(
  state: FlowShellState,
  event: FlowShellEvent
): FlowShellState {
  switch (event.type) {
    case "DIMENSIONS_CLEARED":
      return {
        ...state,
        flow: "default",
        dimensions: "empty",
        checkout: "idle",
        payment: "idle",
        booking: "idle",
        conflict: "none",
      }
    case "DIMENSIONS_PARTIAL":
      return {
        ...state,
        dimensions: "partial",
      }
    case "DIMENSIONS_INVALID":
      return {
        ...state,
        dimensions: "invalid",
      }
    case "DIMENSIONS_VALID":
      return {
        ...state,
        dimensions: "valid",
      }
    case "SEARCH_SUBMITTED":
      return {
        ...state,
        flow: "results",
        dimensions: state.dimensions === "empty" ? "valid" : state.dimensions,
        conflict: "none",
      }
    case "NAV_TO_DEFAULT":
      return {
        ...state,
        flow: "default",
        conflict: "none",
      }
    case "NAV_TO_RESULTS":
      return {
        ...state,
        flow: "results",
      }
    case "NAV_TO_CHECKOUT":
      return state.checkoutLocked
        ? state
        : {
            ...state,
            flow: "checkout",
            checkout: state.checkout === "idle" ? "cart_review" : state.checkout,
          }
    case "NAV_TO_BOOKING":
      return state.checkoutLocked
        ? state
        : {
            ...state,
            flow: "booking",
            checkout: "payment_complete",
            payment: state.payment === "idle" ? "authorized" : state.payment,
          }
    case "NAV_TO_COMPLETE":
      return {
        ...state,
        flow: "complete",
        booking: "confirmed",
        checkoutLocked: true,
      }
    case "CART_SYNC_STARTED":
      return {
        ...state,
        cart: "syncing",
      }
    case "CART_SYNC_FAILED":
      return {
        ...state,
        cart: "error",
      }
    case "CART_UPDATED":
      if (!event.hasItems) {
        return {
          ...state,
          cart: "empty",
          flow: state.dimensions === "valid" ? "results" : "default",
          checkout: state.checkoutLocked ? state.checkout : "idle",
          conflict: "none",
        }
      }

      return {
        ...state,
        cart: "has_items",
      }
    case "DIMENSION_CONFLICT":
      return {
        ...state,
        conflict: "dimension_conflict",
      }
    case "DIMENSION_CONFLICT_DISMISSED":
      return {
        ...state,
        conflict: "none",
      }
    case "CHECKOUT_STEP_CHANGED": {
      const normalized = event.step.toLowerCase()

      if (normalized === "delivery") {
        return {
          ...state,
          flow: "checkout",
          checkout: "cart_review",
        }
      }

      if (normalized === "address") {
        return {
          ...state,
          flow: "checkout",
          checkout: "editing_address",
        }
      }

      if (normalized === "payment") {
        return {
          ...state,
          flow: "checkout",
          checkout: "editing_payment",
          payment: state.payment === "idle" ? "pending" : state.payment,
        }
      }

      if (normalized === "booking") {
        return {
          ...state,
          flow: "booking",
          checkout: "payment_complete",
          payment: state.payment === "idle" ? "authorized" : state.payment,
        }
      }

      if (normalized === "confirmation") {
        return {
          ...state,
          flow: "booking",
          booking: "slot_selected",
        }
      }

      return state
    }
    case "PAYMENT_PENDING":
      return {
        ...state,
        payment: "pending",
      }
    case "PAYMENT_COMPLETED":
      return {
        ...state,
        payment: "captured",
        checkout: "payment_complete",
        flow: "booking",
        checkoutLocked: true,
      }
    case "BOOKING_DAY_EXPANDED":
      return {
        ...state,
        flow: "booking",
        booking: "day_expanded",
      }
    case "BOOKING_SLOT_SELECTED":
      return {
        ...state,
        flow: "booking",
        booking: "slot_selected",
      }
    case "BOOKING_CONFIRMED":
      return {
        ...state,
        flow: "complete",
        booking: "confirmed",
        checkoutLocked: true,
      }
    case "ASSISTANT_OPENED":
      return {
        ...state,
        assistant: "open",
      }
    case "ASSISTANT_CLOSED":
      return {
        ...state,
        assistant: "closed",
      }
    default:
      return state
  }
}

export function deriveFlowShellScene(state: FlowShellState): FlowShellScene {
  if (state.conflict === "dimension_conflict") {
    return "dimension_conflict"
  }

  if (state.flow === "complete") {
    return "complete"
  }

  if (state.flow === "booking" && state.booking === "slot_selected") {
    return "booking_ready_to_confirm"
  }

  if (state.flow === "booking") {
    return "awaiting_booking"
  }

  if (state.flow === "checkout" && state.checkout === "editing_payment") {
    return "payment_entry_active"
  }

  if (state.flow === "checkout" && state.checkout === "editing_address") {
    return "address_entry_active"
  }

  if (state.flow === "results" && state.cart === "has_items") {
    return state.assistant === "open" ? "assistant_open_on_results" : "ready_to_checkout"
  }

  if (state.flow === "checkout" && state.assistant === "open") {
    return "assistant_open_on_checkout"
  }

  if (state.flow === "results" && state.cart === "empty") {
    return "browsing"
  }

  if (state.cart === "empty" && state.dimensions === "valid") {
    return "cart_empty_after_removal"
  }

  return "default_no_dimensions"
}

export function mapFlowToLegacyView(flow: FlowSection): "home" | "results" | "checkout" {
  if (flow === "default") {
    return "home"
  }

  if (flow === "results") {
    return "results"
  }

  return "checkout"
}

export function canNavigateBack(state: FlowShellState) {
  if (state.flow === "complete") {
    return false
  }

  if (
    state.checkoutLocked &&
    (state.flow === "booking" || state.flow === "checkout")
  ) {
    return false
  }

  if (state.payment === "authorized" || state.payment === "captured") {
    return false
  }

  return true
}
