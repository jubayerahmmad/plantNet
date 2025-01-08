import { Navigate } from "react-router-dom";
import LoadingSpinner from "../components/Shared/LoadingSpinner";
import useRole from "../hooks/useRole";
import PropTypes from "prop-types";

const SellerRoute = ({ children }) => {
  const [role, isLoading] = useRole();
  if (role === "Seller") {
    return children;
  }
  if (isLoading) return <LoadingSpinner />;
  return <Navigate to="/dashboard/manage-orders" replace="true" />;
};
SellerRoute.propTypes = {
  children: PropTypes.node.isRequired,
};
export default SellerRoute;
