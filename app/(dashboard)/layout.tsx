import Navbar from "@/components/Navbar";
import React, { ReactNode } from "react";
import DashboardShortcuts from "./_components/DashboardShortcuts";

const layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="relative flex h-screen w-full flex-col">
      <Navbar />
      <div className="w-full pt-[80px] md:pt-[60px] 3xl:pt-[100px]">{children}</div>
      <DashboardShortcuts />
    </div>
  );
};

export default layout;
