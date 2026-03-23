import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  maxWidth?: "narrow" | "medium" | "wide";
}

export function PageContainer({ children, maxWidth = "medium" }: PageContainerProps) {
  const widths = {
    narrow: "max-w-[600px]",
    medium: "max-w-[800px]",
    wide: "max-w-[1100px]",
  };

  return (
    <div className={`w-full mx-auto px-6 ${widths[maxWidth]}`}>
      {children}
    </div>
  );
}
