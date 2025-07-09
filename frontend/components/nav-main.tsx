"use client";

import { type LucideIcon } from "lucide-react";
import { Collapsible } from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <Collapsible asChild className="group/collapsible">
              <Link 
                href={item.url}
                onClick={(e) => {
                  // Ensure proper navigation event handling
                  e.stopPropagation();
                  console.log(`🔗 Navigation clicked: ${item.title} -> ${item.url}`);
                }}
                style={{
                  // Ensure link is always clickable
                  pointerEvents: 'auto',
                  position: 'relative',
                  zIndex: 1
                }}
              >
                <SidebarMenuButton 
                  tooltip={item.title}
                  isActive={item.isActive}
                  onClick={(e) => {
                    // Prevent double event handling
                    e.stopPropagation();
                  }}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </Link>
            </Collapsible>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
