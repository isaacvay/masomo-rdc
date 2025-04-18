"use client";
import React from "react";
import { InfoCardProps } from "./types";

const InfoCard: React.FC<InfoCardProps> = ({ title, value, currency, variant }) => {
  const variantConfig = {
    info: {
      bg: "bg-blue-50",
      text: "text-blue-800",
    },
    success: {
      bg: "bg-green-50",
      text: "text-green-800",
    },
    warning: {
      bg: "bg-orange-50",
      text: "text-orange-800",
    },
    error: {
      bg: "bg-red-50",
      text: "text-red-800",
    },
  }[variant];

  return (
    <div className={`${variantConfig.bg} ${variantConfig.text} p-4 rounded-lg h-full`}>
      <h4 className="text-sm font-medium">{title}</h4>
      <p className="text-2xl font-bold">
        {value.toLocaleString()} {currency}
      </p>
    </div>
  );
};

export default InfoCard;