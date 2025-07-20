// src/components/team-switcher.tsx
"use client";

import * as React from "react";
import { ChevronsUpDown, SquareTerminal } from "lucide-react";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export type Team = {
  id: string;
  name: string;
  logo: string | React.ElementType; // Accepts image URL or icon component
  plan?: string;
};

export interface TeamSwitcherProps {
  teams: Team[];
  activeId?: string;
  onSelect: (id: string) => void;
  /** if present, render this “create” button at the bottom of the list */
  renderCreateItem?: () => React.ReactNode;
}

export function TeamSwitcher({
  teams,
  activeId,
  onSelect,
  renderCreateItem,
}: TeamSwitcherProps) {
  const { isMobile } = useSidebar();
  const initial = teams.find((t) => t.id === activeId) || teams[0] || null;
  const [activeTeam, setActiveTeam] = React.useState<Team | null>(initial);

  React.useEffect(() => {
    const found = teams.find((t) => t.id === activeId);
    if (found) setActiveTeam(found);
  }, [activeId, teams]);

  if (!activeTeam) return null;

  // Helper to render logo (image or icon)
  const renderLogo = (logo: string | React.ElementType, alt: string) => {
    if (typeof logo === "string" && logo) {
      // Check if it's an SVG (DiceBear or other SVG URLs)
      const isSvg = logo.includes(".svg") || logo.includes("api.dicebear.com");

      if (isSvg) {
        // Use regular img tag for SVG images since Next.js Image can't optimize them
        return (
          <img src={logo} alt={alt} className="size-4 rounded object-cover" />
        );
      } else {
        // Use Next.js Image for other image types
        return (
          <Image
            src={logo}
            alt={alt}
            width={16}
            height={16}
            className="size-4 rounded object-cover"
          />
        );
      }
    } else if (typeof logo === "function") {
      const Icon = logo;
      return <Icon className="size-4" />;
    } else if (typeof logo === "object") {
      // Handle object type logos by showing fallback icon
      return <SquareTerminal className="size-4" />;
    }
    return null;
  };

  // Check if we have a fallback icon (no actual logo)
  const hasFallbackIcon =
    typeof activeTeam.logo === "function" ||
    typeof activeTeam.logo === "object";
  console.log("TeamSwitcher Debug:", {
    activeTeamName: activeTeam.name,
    activeTeamLogo: activeTeam.logo,
    logoType: typeof activeTeam.logo,
    hasFallbackIcon,
    isString: typeof activeTeam.logo === "string",
    isFunction: typeof activeTeam.logo === "function",
    isObject: typeof activeTeam.logo === "object",
  });
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div
                className={`flex aspect-square size-8 items-center justify-center rounded-lg border-2 border-sidebar-accent ${
                  hasFallbackIcon
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : ""
                }`}
              >
                {renderLogo(activeTeam.logo, activeTeam.name)}
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

          <DropdownMenuContent
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
            className="min-w-[12rem] rounded-lg"
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {renderCreateItem ? "Organizations" : "Applications"}
            </DropdownMenuLabel>

            {teams.map((team) => {
              const hasTeamFallbackIcon =
                typeof team.logo === "function" ||
                typeof team.logo === "object";
              return (
                <DropdownMenuItem
                  key={team.id}
                  onClick={() => {
                    setActiveTeam(team);
                    onSelect(team.id);
                  }}
                  className="flex items-center justify-between gap-2 p-2"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex aspect-square size-4 items-center justify-center rounded  ${
                        hasTeamFallbackIcon
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : ""
                      }`}
                    >
                      {renderLogo(team.logo, team.name)}
                    </div>
                    <span className="truncate text-sm">{team.name}</span>
                  </div>
                </DropdownMenuItem>
              );
            })}

            {renderCreateItem && (
              <>
                <DropdownMenuSeparator />
                <div className="px-2">{renderCreateItem()}</div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
