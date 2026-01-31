import Navbar from "@/components/Navbar";
import React, { ReactNode } from "react";
import { DashboardClientWrapper } from "./_components/DashboardClientWrapper";

const layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="relative flex h-screen w-full flex-col">
      <Navbar />
      <DashboardClientWrapper>{children}</DashboardClientWrapper>
    </div>
  );
};

export default layout;
