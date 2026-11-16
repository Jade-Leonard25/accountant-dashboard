import { Link } from "react-router";
const App = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-200 min-h-screen rounded  border-gray-900 shadow-md w-full h-full">
      <Link to={'/accountant_dashboard'} className="text-black">
        Accountant Dashboard
      </Link>
    </div>
  );
};
export default App;
