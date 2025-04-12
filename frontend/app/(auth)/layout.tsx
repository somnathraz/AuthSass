import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Securerauth dashboard",
  description: "Free and Open-Source auth Dashboard",
  referrer: "no-referrer-when-downgrade",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <script src="https://accounts.google.com/gsi/client" async defer></script>

      <div className="bg-white w-full h-screen">{children}</div>
    </div>
  );
}
