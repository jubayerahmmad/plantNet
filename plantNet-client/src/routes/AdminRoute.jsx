import { Navigate } from "react-router-dom";
import LoadingSpinner from "../components/Shared/LoadingSpinner";
import useRole from "../hooks/useRole";
import PropTypes from "prop-types";

const AdminRoute = ({ children }) => {
  const [role, isLoading] = useRole();
  if (role === "Admin") {
    return children;
  }
  if (isLoading) return <LoadingSpinner />;
  return <Navigate to="/dashboard" replace="true" />;
};
AdminRoute.propTypes = {
  children: PropTypes.node.isRequired,
};
export default AdminRoute;
