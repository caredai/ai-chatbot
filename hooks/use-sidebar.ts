import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

const sidebarStateAtom = atomWithStorage("chat:sidebarState", true);

export function useSidebarState() {
  const [sidebarState, setSidebarState] = useAtom(sidebarStateAtom);
  return {
    sidebarState,
    setSidebarState,
  };
}
