import { useLocation } from "react-router";

export default function Dashboard() {
  const { state } = useLocation();
  const activationKey = state?.activationKey;

  return (
    <div>
      Dashboard
      {activationKey && <p>Activation verified.</p>}
    </div>
  );
}