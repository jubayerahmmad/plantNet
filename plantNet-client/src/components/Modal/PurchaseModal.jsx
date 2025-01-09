/* eslint-disable react/prop-types */
import {
  Dialog,
  Transition,
  TransitionChild,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { Fragment, useState } from "react";
import Button from "../Shared/Button/Button";
import useAuth from "../../hooks/useAuth";
import toast from "react-hot-toast";
import useAxiosSecure from "../../hooks/useAxiosSecure";
import { useNavigate } from "react-router-dom";

const PurchaseModal = ({ closeModal, isOpen, plant, refetch }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const axiosSecure = useAxiosSecure();

  const { category, name, seller, price, quantity, _id } = plant;
  const [totalPrice, setTotalPrice] = useState(price);
  const [totalQuantity, setTotalQuantity] = useState(1);
  const [purchaseInfo, setPurchaseInfo] = useState({
    customer: {
      name: user?.displayName,
      email: user?.email,
      image: user?.photoURL,
    },
    plantId: _id,
    price: totalPrice,
    quantity: totalQuantity,
    seller: seller?.email,
    address: "",
    status: "Pending",
  });

  // console.log(totalQuantity);

  const handleQuantity = (value) => {
    if (value > quantity) {
      // setTotalQuantity(quantity);
      return toast.error("Quantity exceeded available stock");
    }
    if (value < 0) {
      return toast.error("Quantity cannot be less than or equal to 0");
    }

    setTotalQuantity(value);
    setTotalPrice(value * price);
    setPurchaseInfo((prev) => {
      return { ...prev, price: value * price, quantity: value };
    });
  };

  const handlePurchase = async () => {
    // console.table(purchaseInfo);
    //post request to db
    try {
      await axiosSecure.post("/order", purchaseInfo);
      // update(decrease) quantity
      await axiosSecure.patch(`/plant/quantity/${_id}`, {
        quantityToUpdate: totalQuantity,
        status: "decrease",
      });
      refetch();
      toast.success("Order Successful!");
      navigate("/dashboard/my-orders");
    } catch (error) {
      console.log(error.message);
    } finally {
      closeModal();
    }
  };
  // Total Price Calculation

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={closeModal}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <DialogTitle
                  as="h3"
                  className="text-lg font-medium text-center leading-6 text-gray-900"
                >
                  Review Info Before Purchase
                </DialogTitle>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Plant: {name}</p>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Category: {category}</p>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Customer: {user?.displayName}
                  </p>
                </div>

                <div className="mt-2">
                  <p className="text-sm text-gray-500">Price: $ {totalPrice}</p>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Available Quantity: {quantity}
                  </p>
                </div>
                {/* quantity input field */}
                <div className="space-x-3 text-sm">
                  <label htmlFor="quantity" className=" text-gray-600">
                    Quantity:
                  </label>
                  <input
                    className="px-2 py-1 text-gray-800 border border-lime-300 focus:outline-lime-500 rounded-md bg-white"
                    name="quantity"
                    value={totalQuantity}
                    onChange={(e) => handleQuantity(parseInt(e.target.value))}
                    step={1}
                    max={quantity}
                    id="quantity"
                    type="number"
                    placeholder="Available quantity"
                    required
                  />
                </div>

                {/* address input field */}
                <div className="space-x-3 my-2 text-sm">
                  <label htmlFor="address" className=" text-gray-600">
                    Address:
                  </label>
                  <input
                    onChange={(e) =>
                      setPurchaseInfo((prev) => {
                        return { ...prev, address: e.target?.value };
                      })
                    }
                    className="px-2 py-1 text-gray-800 border border-lime-300 focus:outline-lime-500 rounded-md bg-white"
                    name="address"
                    id="address"
                    type="text"
                    placeholder="Shipping Address"
                    required
                  />
                </div>
                <Button
                  onClick={() => handlePurchase(_id)}
                  disabled={totalQuantity <= 0}
                  label={`Pay ${totalPrice} $`}
                ></Button>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default PurchaseModal;
