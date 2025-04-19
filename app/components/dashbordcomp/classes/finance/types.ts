export const SCHOOL_MONTHS = [
    "Septembre", "Octobre", "Novembre", "Décembre",
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin"
  ] as const;
  
  export type MonthStatus = "paid" | "partial" | "unpaid" | "current" | "future";
  
  export interface MonthPaymentInfo {
    status: MonthStatus;
    paidAmount: number;
    remainingAmount: number;
    dueDate: string;
  }
  
  export interface Payment {
    id: string;
    amount: number;
    date: Date;
    method: string;
    receiptNumber: string;
  }
  
  export interface PaymentSettings {
    year: string;
    class: string;
    annualAmount: number;
    quarterlyAmount: number;
    monthlyAmount: number;
    currency: string;
    enrollmentFee: number;
    latePaymentFee: number;
    dueDates: Date[];
    schoolId: string;
  }
  
  export interface MonthlyPaymentStatusProps {
    payments: Payment[];
    classe: string;
    schoolId: string;
    studentId: string;
  }
  
  export interface MonthCardProps {
    month: string;
    amount: number;
    paidAmount: number;
    remainingAmount: number;
    currency: string;
    dueDate: string;
    status: MonthStatus;
    isHighlighted?: boolean;
  }
  
  export interface InfoCardProps {
    title: string;
    value: number;
    currency: string;
    variant: "info" | "success" | "warning" | "error";
    description?: string;
  }
