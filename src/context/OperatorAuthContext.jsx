import { createContext, useContext, useState, useEffect } from "react";
import { operatorAuthAPI } from "../services/api";

const OperatorAuthContext = createContext(null);

export function OperatorAuthProvider({ children }) {
  const [operator, setOperator] = useState(() => {
    try {
      const stored = localStorage.getItem("operatorUser");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [operatorLoading, setOperatorLoading] = useState(true);

  // Rehydrate session on mount
  useEffect(() => {
    const token = localStorage.getItem("operatorToken");
    if (token) {
      operatorAuthAPI
        .getMe()
        .then((res) => {
          setOperator(res.data.operator);
          localStorage.setItem(
            "operatorUser",
            JSON.stringify(res.data.operator)
          );
        })
        .catch(() => {
          localStorage.removeItem("operatorToken");
          localStorage.removeItem("operatorUser");
          setOperator(null);
        })
        .finally(() => setOperatorLoading(false));
    } else {
      setOperatorLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await operatorAuthAPI.login({ email, password });
    const { token, operator: operatorData } = res.data;
    localStorage.setItem("operatorToken", token);
    localStorage.setItem("operatorUser", JSON.stringify(operatorData));
    setOperator(operatorData);
    return operatorData;
  };

  const logout = () => {
    localStorage.removeItem("operatorToken");
    localStorage.removeItem("operatorUser");
    setOperator(null);
  };

  const register = async (data) => {
    const res = await operatorAuthAPI.register(data);
    const { token, operator: operatorData } = res.data;
    localStorage.setItem("operatorToken", token);
    localStorage.setItem("operatorUser", JSON.stringify(operatorData));
    setOperator(operatorData);
    return operatorData;
  };

  const refreshOperator = async () => {
    try {
      const res = await operatorAuthAPI.getMe();
      setOperator(res.data.operator);
      localStorage.setItem("operatorUser", JSON.stringify(res.data.operator));
      return res.data.operator;
    } catch {
      return null;
    }
  };

  return (
    <OperatorAuthContext.Provider
      value={{ operator, operatorLoading, login, logout, register, refreshOperator }}
    >
      {children}
    </OperatorAuthContext.Provider>
  );
}

export const useOperatorAuth = () => {
  const ctx = useContext(OperatorAuthContext);
  if (!ctx)
    throw new Error("useOperatorAuth must be used inside OperatorAuthProvider");
  return ctx;
};
