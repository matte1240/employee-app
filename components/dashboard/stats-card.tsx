import { ReactNode } from "react";

type ColorType = "green" | "blue" | "purple" | "red" | "orange";

type StatsCardProps = {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: ColorType;
  isLoading?: boolean;
};

const colorMap: Record<ColorType, { bg: string; text: string }> = {
  green: { bg: "bg-green-100", text: "text-green-600" },
  blue: { bg: "bg-blue-100", text: "text-blue-600" },
  purple: { bg: "bg-purple-100", text: "text-purple-600" },
  red: { bg: "bg-red-100", text: "text-red-600" },
  orange: { bg: "bg-orange-100", text: "text-orange-600" },
};

export default function StatsCard({
  title,
  value,
  icon,
  color,
  isLoading = false,
}: StatsCardProps) {
  const colors = colorMap[color];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${colors.bg}`}>
          <div className={`h-6 w-6 ${colors.text}`}>
            {icon}
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {isLoading ? "Caricamento..." : value}
          </p>
        </div>
      </div>
    </div>
  );
}
