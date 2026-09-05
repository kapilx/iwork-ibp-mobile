import React from "react";
import { useNavigate } from "react-router-dom";
import SignIn from "../../components/SignIn";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    navigate("/dashboard");
  };

  return <SignIn onSuccess={handleLoginSuccess} isFullPage />;
};

export default LoginPage;
