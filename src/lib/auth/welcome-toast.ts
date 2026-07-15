export const WELCOME_TOAST_KEY = "naqd-welcome";
const WELCOME_TOAST_MSG_KEY = "naqd-welcome-msg";

export function markWelcomeToast(message?: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(WELCOME_TOAST_KEY, "1");
  if (message) {
    sessionStorage.setItem(WELCOME_TOAST_MSG_KEY, message);
  } else {
    sessionStorage.removeItem(WELCOME_TOAST_MSG_KEY);
  }
}

export function consumeWelcomeToast(): string | false {
  if (typeof window === "undefined") return false;
  if (sessionStorage.getItem(WELCOME_TOAST_KEY) !== "1") return false;
  sessionStorage.removeItem(WELCOME_TOAST_KEY);
  const message = sessionStorage.getItem(WELCOME_TOAST_MSG_KEY);
  sessionStorage.removeItem(WELCOME_TOAST_MSG_KEY);
  return message ?? "";
}
