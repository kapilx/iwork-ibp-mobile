import { Button, Card } from "@mui/material";
import { useRouteError, useNavigate } from "react-router-dom";

export function ErrorBoundary() {
  const error = useRouteError() as Error;
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md p-6 space-y-4">
        <h1 className="text-2xl font-bold text-red-600">
          Oops! Something went wrong
        </h1>
        <p className="text-gray-600">
          {error.message || "An unexpected error occurred"}
        </p>
        <div className="flex justify-end space-x-2">
          <Button
            // variant="outline"
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
          <Button onClick={() => navigate("/")}>Return Home</Button>
        </div>
      </Card>
    </div>
  );
}
