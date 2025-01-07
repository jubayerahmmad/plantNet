import { useState } from "react";
import UpdateUserModal from "../../Modal/UpdateUserModal";
import PropTypes from "prop-types";
const UserDataRow = ({ userData }) => {
  const [isOpen, setIsOpen] = useState(false);

  const { email, role, status } = userData;

  return (
    <tr>
      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
        <p className="text-gray-900 whitespace-no-wrap">{email}</p>
      </td>
      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
        <p className="text-gray-900 whitespace-no-wrap">{role}</p>
      </td>
      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
        {status ? (
          <p
            className={`${
              status === "Requested"
                ? "text-yellow-700 bg-yellow-100"
                : "text-green-700 bg-green-100"
            } px-3 py-1 w-fit rounded-full whitespace-no-wrap`}
          >
            {status}
          </p>
        ) : (
          <p className="text-red-700 px-3 py-1 rounded-full bg-red-100 w-fit whitespace-no-wrap">
            Unavailable
          </p>
        )}
      </td>

      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
        <span
          onClick={() => setIsOpen(true)}
          className="relative cursor-pointer inline-block px-3 py-1 font-semibold text-green-900 leading-tight"
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-green-200 opacity-50 rounded-full"
          ></span>
          <span className="relative">Update Role</span>
        </span>
        {/* Modal */}
        <UpdateUserModal isOpen={isOpen} setIsOpen={setIsOpen} />
      </td>
    </tr>
  );
};

UserDataRow.propTypes = {
  user: PropTypes.object,
  refetch: PropTypes.func,
};
UserDataRow.propTypes = {
  userData: PropTypes.shape({
    email: PropTypes.string,
    role: PropTypes.string,
    status: PropTypes.string,
  }),
};

export default UserDataRow;
