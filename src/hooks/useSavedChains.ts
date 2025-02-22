import { Chain } from "../lib/types";
import { useLocalStorage } from "@raycast/utils";

export function useSavedChains() {
  return useLocalStorage<Chain[]>("chains");
}
