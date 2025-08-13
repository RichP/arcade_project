"use client";

import React, { createContext, useContext } from "react";

export type ConfettiProfile = "subtle" | "celebration" | "low-power";

const Ctx = createContext<ConfettiProfile>("celebration");

export function useConfettiProfile(): ConfettiProfile {
  return useContext(Ctx);
}

export default function ConfettiProfileProvider({ profile, children }: { profile: ConfettiProfile; children: React.ReactNode }) {
  return <Ctx.Provider value={profile}>{children}</Ctx.Provider>;
}
