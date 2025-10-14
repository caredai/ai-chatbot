"use client";

import { Link, useRouter } from "@tanstack/react-router";
import type { User } from "next-auth";
import { PlusIcon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { SidebarHistory } from "@/components/sidebar-history";
import { SidebarUser } from "@/components/sidebar-user";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row items-center justify-between">
            <div className="flex flex-row items-center gap-1 ps-1">
              <Link
                onClick={(e) => {
                  e.preventDefault();
                  setOpenMobile(false);
                  router.navigate({ to: "/", reloadDocument: true });
                }}
                preload={false}
                to="/"
              >
                <Logo />
              </Link>
              <Link
                onClick={() => {
                  setOpenMobile(false);
                }}
                to="/chat"
              >
                <span className="cursor-pointer rounded-md px-2 font-semibold text-lg hover:bg-muted">
                  Chat
                </span>
              </Link>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="h-8 p-1 md:h-fit md:p-2"
                  onClick={() => {
                    setOpenMobile(false);
                    router.navigate({ to: "/chat" });
                  }}
                  type="button"
                  variant="ghost"
                >
                  <PlusIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent align="end" className="hidden md:block">
                New Chat
              </TooltipContent>
            </Tooltip>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarHistory user={user} />
      </SidebarContent>
      <SidebarFooter>{user && <SidebarUser user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
