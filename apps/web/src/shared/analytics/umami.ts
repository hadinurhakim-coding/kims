type UmamiEventData = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: Record<string, unknown>) => void;
    };
  }
}

export function trackUmamiEvent(eventName: string, eventData?: UmamiEventData) {
  if (typeof window === "undefined" || !window.umami) {
    return;
  }

  window.umami.track(eventName, compactEventData(eventData));
}

function compactEventData(eventData?: UmamiEventData) {
  if (!eventData) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(eventData).filter(([, value]) => value !== undefined),
  );
}
