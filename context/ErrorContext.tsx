import React, { createContext, useContext, useState, ReactNode } from "react";

type ErrorContextType = {
  error: string;
  setError: (msg: string) => void;
  clearError: () => void;
};

const ErrorContext = createContext<ErrorContextType>({
  error: "",
  setError: () => {},
  clearError: () => {},
});

export function useError() {
  return useContext(ErrorContext);
}

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [error, setErrorState] = useState("");
  const setError = (msg: string) => setErrorState(msg);
  const clearError = () => setErrorState("");

  return (
    <ErrorContext.Provider value={{ error, setError, clearError }}>
      {children}
    </ErrorContext.Provider>
  );
}
