import { useState } from "react";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { z } from "zod";
import axios from "axios";
import { useNavigate } from "react-router";
const url =
  "https://system-payroll-api.automation-payroll.workers.dev/api/key-products/verify";

const keySchema = z.object({
  key: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9]{3}(?:-[a-z0-9]{3}){2}$/,
      "Enter a key in the format xxx-xxx-xxx.",
    ),
});

export default function App() {
  const navigate = useNavigate();
  const [data, setData] = useState({ key: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const result = keySchema.safeParse(data);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(url, { key: result.data.key });
      navigate("/dashboard", {
        state: { activationKey: result.data.key },
      });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to validate the activation key. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setData((current) => ({ ...current, [name]: value }));
    setError("");
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-2">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Enter Activation Key Product</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlfor="key">Activation Key</Label>
              <Input
                id="key"
                type="text"
                name="key"
                placeholder="xxx-xxx-xxx"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                value={data.key}
                onChange={handleChange}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "activation-key-error" : undefined}
                disabled={isSubmitting}
              />
            </div>
            {error && (
              <p id="activation-key-error" role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Validating…" : "Activate"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}