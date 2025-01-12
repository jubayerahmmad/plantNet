// This example shows you how to set up React Stripe.js and use Elements.
// Learn how to accept a payment using the official Stripe docs.
// https://stripe.com/docs/payments/accept-a-payment#web

import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import "./CheckoutForm.css";
import Button from "../Shared/Button/Button";
import { useEffect, useState } from "react";
import useAxiosSecure from "../../hooks/useAxiosSecure";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const CheckoutForm = ({ refetch, purchaseInfo, closeModal }) => {
  const axiosSecure = useAxiosSecure();
  const [clientSecret, setClientSecret] = useState("");
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  console.log(clientSecret);
  useEffect(() => {
    const getPaymentIntent = async () => {
      try {
        const { data } = await axiosSecure.post("/create-payment-intent", {
          quantity: purchaseInfo?.quantity,
          plantId: purchaseInfo?.plantId,
        });
        setClientSecret(data);
      } catch (error) {
        console.log(error);
      }
    };
    getPaymentIntent();
  }, [purchaseInfo, axiosSecure]);

  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event) => {
    setProcessing(true);
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const card = elements.getElement(CardElement);

    if (card == null) {
      setProcessing(false);
      return;
    }

    // Use your card Element with other Stripe.js APIs
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card,
    });

    if (error) {
      setProcessing(false);
      console.log("[error]", error);
    } else {
      console.log("[PaymentMethod]", paymentMethod);
    }

    // confirm payment
    const { paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: card,
        billing_details: {
          name: purchaseInfo?.customer?.name,
          email: purchaseInfo?.customer?.email,
        },
      },
    });
    if (paymentIntent.status === "succeeded") {
      try {
        await axiosSecure.post("/order", {
          ...purchaseInfo,
          transactionId: paymentIntent.id,
        });
        // update(decrease) quantity
        await axiosSecure.patch(`/plant/quantity/${purchaseInfo?.plantId}`, {
          quantityToUpdate: purchaseInfo?.quantity,
          status: "decrease",
        });
        refetch();
        toast.success("Order Successful!");
        navigate("/dashboard/my-orders");
      } catch (error) {
        console.log(error.message);
      } finally {
        setProcessing(false);
        closeModal();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement
        options={{
          style: {
            base: {
              fontSize: "16px",
              color: "#424770",
              "::placeholder": {
                color: "#aab7c4",
              },
            },
            invalid: {
              color: "#9e2146",
            },
          },
        }}
      />
      <div className="flex justify-around gap-2 items-center">
        <Button
          type="submit"
          label={`Pay ${purchaseInfo?.price} $`}
          disabled={!stripe || !clientSecret || processing}
        ></Button>
        <Button onClick={closeModal} label={"Cancel"} outline={true}></Button>
      </div>
    </form>
  );
};

CheckoutForm.propTypes = {
  refetch: PropTypes.func,
  purchaseInfo: PropTypes.object,
  closeModal: PropTypes.func,
};

export default CheckoutForm;
