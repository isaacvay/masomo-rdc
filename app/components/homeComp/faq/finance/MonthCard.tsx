"use client";
import React from "react";
import { Check, X } from "lucide-react";
import { MonthCardProps } from "./types";

const MonthCard: React.FC<MonthCardProps> = ({
  month,
  amount,
  paidAmount,
  remainingAmount,
  currency,
  dueDate,
  status,
  isHighlighted = false,
}) => {
  const statusConfig = {
    paid: {
      bg: "bg-green-50",
      border: "border-green-200",
      icon: <Check className="text-green-600" size={16} />,
      text: "text-green-700",
    },
    partial: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      icon: <span className="text-yellow-600 text-sm font-bold">~</span>,
      text: "text-yellow-700",
    },
    unpaid: {
      bg: "bg-red-50",
      border: "border-red-200",
      icon: <X className="text-red-600" size={16} />,
      text: "text-red-700",
    },
    current: {
        bg: "bg-blue-50",
        border: "border-blue-200",
        icon: <span className="w-3 h-3 rounded-full bg-blue-600" />,
        text: "text-blue-700",
      },
    future: {
      bg: "bg-gray-50",
      border: "border-gray-200",
      icon: null,
      text: "text-gray-700",
    },
  }[status];

  const paymentPercentage = Math.round((paidAmount / amount) * 100);

  return (
    <div
      className={`p-3 rounded-lg border ${statusConfig.bg} ${statusConfig.border} ${
        isHighlighted ? "ring-2 ring-blue-300" : ""
      }`}
    >
      <div className="flex justify-between items-center mb-1">
        <div className="flex justify-center w-4">
          {statusConfig.icon}
        </div>
        {status !== "future" && (
          <span className={`text-xs ${statusConfig.text} font-medium`}>
            {paymentPercentage}%
          </span>
        )}
      </div>
      <p className="font-medium text-gray-800">{month}</p>
      <div className="text-sm text-gray-600 space-y-1 mt-1">
        <div>
          <span className="font-medium">{paidAmount.toLocaleString()}</span>/{amount.toLocaleString()} {currency}
        </div>
        {remainingAmount > 0 && status !== "future" && (
          <div className="text-xs text-red-600">
            Reste: {remainingAmount.toLocaleString()} {currency}
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Échéance: {dueDate}
      </p>
    </div>
  );
};

export default MonthCard;