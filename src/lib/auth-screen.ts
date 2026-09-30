import type { AuthScreen } from "@/lib/types";

export const fallbackAuthScreen: AuthScreen = {
  kicker: "New board",
  title: "Keep your own cities, stocks, and teams.",
  body: "Sign up to pin what you follow. Your board stays with your account. Everyone else still sees the shared defaults.",
  points: [
    "Search and pin cities for weather",
    "Save the stocks you want on the board",
    "Follow NBA, NFL, MLB, and NHL teams",
  ],
  signUpLabel: "Sign up with GitHub",
  signInLabel: "Sign in",
  browseLabel: "Use the shared board",
  footnote: "GitHub creates the account the first time you continue.",
};
