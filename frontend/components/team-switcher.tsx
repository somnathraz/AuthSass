// src/components/team-switcher.tsx
"use client";

import * as React from "react";
import { ChevronsUpDown, Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { CreateAppModal } from "./CreateAppModal/CreateAppModal";

interface Team {
  id: string;
  name: string;
  logo: React.ElementType;
  plan?: string;
}

interface TeamSwitcherProps {
  teams: Team[];
  activeId?: string;
  onSelect: (id: string) => void;
  onAppCreated?: () => void; // ← now optional
}

export function TeamSwitcher({
  teams,
  activeId,
  onSelect,
  onAppCreated,
}: TeamSwitcherProps) {
  const { isMobile } = useSidebar();

  const initial = teams.find((t) => t.id === activeId) || teams[0] || null;
  const [activeTeam, setActiveTeam] = React.useState<Team | null>(initial);

  React.useEffect(() => {
    const found = teams.find((t) => t.id === activeId);
    if (found) setActiveTeam(found);
  }, [activeId, teams]);

  if (!activeTeam) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          {/* Trigger */}
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <activeTeam.logo className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeTeam.name}</span>
                {activeTeam.plan && (
                  <div className="truncate text-xs">{activeTeam.plan}</div>
                )}
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          {/* Menu Content */}
          <DropdownMenuContent
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
            className="min-w-[12rem] rounded-lg"
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Applications
            </DropdownMenuLabel>

            {teams.map((team, i) => (
              <DropdownMenuItem
                key={team.id}
                onClick={() => {
                  setActiveTeam(team);
                  onSelect(team.id);
                }}
                className="flex items-center justify-between gap-2 p-2"
              >
                <div className="flex items-center gap-2">
                  <team.logo className="h-4 w-4" />
                  <span className="truncate text-sm">{team.name}</span>
                </div>
                <DropdownMenuShortcut>⌘{i + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />

            {/* Replace your plain “Add application” item with the CreateAppModal trigger */}
            <DropdownMenuItem asChild>
              <CreateAppModal
                trigger={
                  <button className="flex items-center gap-2 p-2 w-full text-left">
                    <Plus className="h-4 w-4" />
                    <span className="text-sm">Add application</span>
                  </button>
                }
                // wrap the optional callback in a no‑op when undefined:
                onCreated={() => {
                  if (onAppCreated) onAppCreated();
                }}
              />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
