import { Timestamp } from "firebase/firestore";


export interface Student {
  id: string;
  displayName: string;
  email: string;
}

export interface FinanceEleveProps {
  student: Student;
  classe: string;
  schoolId: string;
  onRetour: () => void;
}


export interface Payment {
    id: string;
    date: Date;
    amount: number;
    method: string;
    reference: string;
    recordedBy: string;
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
    schoolId: string;
    dueDates: Date[];
  }

  