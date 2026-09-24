import { useSyncExternalStore } from "react";
import { subscribe, getSavedIds } from "@/lib/savedJobsStore";

const EMPTY = new Set<string>();

export function useSavedJobIds() {
  return useSyncExternalStore(subscribe, getSavedIds, () => EMPTY);
}
