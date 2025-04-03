import React from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
}

export default function Toast({ message, type }: ToastProps) {
  return (
    <div className={`fixed top-5 left-1/2 transform -translate-x-1/2 ${
          type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white px-6 py-3 rounded-lg shadow-lg transition-opacity duration-300 z-50`}>
      {message}
    </div>
  );
}
