import React, { useState } from "react";
import { FaTrash } from "react-icons/fa";

const CartItem = () => {
  const [quantity, setQuantity] = useState(5);
  const price = 1250;
  const total = quantity * price;

  const increment = () => setQuantity(q => q + 1);
  const decrement = () => setQuantity(q => (q > 1 ? q - 1 : 1));

  return (
    <div className="max-w-xl mx-auto bg-white p-4 rounded-md shadow-md">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-4">
          <img
            src="https://via.placeholder.com/80"
            alt="Kids Tshirt"
            className="w-20 h-20 rounded object-cover"
          />
          <div>
            <h2 className="font-semibold text-lg">Kids Tshirt</h2>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={decrement}
                className="px-2 py-1 border rounded-full text-lg"
              >
                −
              </button>
              <span className="text-lg">{quantity}</span>
              <button
                onClick={increment}
                className="px-2 py-1 border rounded-full text-lg"
              >
                +
              </button>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-medium">${price.toFixed(2)}</p>
          <button className="text-red-500 mt-2">
            <FaTrash />
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center mt-4">
        <span className="text-xl font-medium">Total</span>
        <span className="text-xl font-semibold">${total}</span>
      </div>

      <button className="w-full bg-[#0a0a23] text-white py-2 mt-4 rounded-md hover:bg-[#1a1a3b]">
        Checkout
      </button>
    </div>
  );
};

export default CartItem;
