"use client";

import { useState } from "react";
import Sidebar from "../../components/Sidebar";

export default function InvoicesPage() {

  const [items, setItems] = useState([
  {
    description: "",
    quantity: 1,
    price: 0,
  },
]);

 const subtotal = items.reduce(
  (sum, item) => sum + item.quantity * item.price,
  0
);

const tax = subtotal * 0.086;
const total = subtotal + tax;

function addItem() {
  setItems([
    ...items,
    {
      description: "",
      quantity: 1,
      price: 0,
    },
  ]);
}

function removeItem(index: number) {
  setItems(items.filter((_, i) => i !== index));
}

function updateItem(
  index: number,
  field: string,
  value: string | number
) {
  const updated = [...items];

  updated[index] = {
    ...updated[index],
    [field]: value,
  };

  setItems(updated);
}

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="flex">
        <Sidebar />

        <section className="flex-1 p-10">
          <h2 className="text-5xl font-bold">New Invoice</h2>
          <p className="mt-2 text-slate-400">
            Create an invoice and calculate totals automatically.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-2">
            <div className="rounded-xl bg-slate-900 p-6">
              <h3 className="text-2xl font-bold">Invoice Details</h3>

              <input
                placeholder="Customer name"
                className="mt-6 w-full rounded-lg bg-slate-800 p-3"
              />

              {items.map((item, index) => (
  <div key={index} className="mt-4 grid grid-cols-12 gap-3">

    <input
      value={item.description}
      onChange={(e) =>
        updateItem(index, "description", e.target.value)
      }
      placeholder="Description"
      className="col-span-6 rounded-lg bg-slate-800 p-3"
    />

    <input
      type="number"
      value={item.quantity}
      onChange={(e) =>
        updateItem(index, "quantity", Number(e.target.value))
      }
      className="col-span-2 rounded-lg bg-slate-800 p-3"
    />

    <input
      type="number"
      value={item.price}
      onChange={(e) =>
        updateItem(index, "price", Number(e.target.value))
      }
      className="col-span-2 rounded-lg bg-slate-800 p-3"
    />

 <button
  onClick={() => removeItem(index)}
  className="col-span-2 rounded-lg bg-red-600"
>
  Delete
</button>
</div>
))}

<button
  onClick={addItem}
  className="mt-6 rounded-lg bg-green-600 px-6 py-3 font-semibold"
>
  + Add Item
</button>
    onClick={addItem}
    className="mt-6 rounded-lg bg-green-600 px-6 py-3 font-semibold"
>
    + Add Item
</button>

  </div>
))}
<button
         onClick={addItem}
         className="mt-6 rounded-lg bg-green-600 px-6 py-3 font-semibold"
>
  + Add Item
</button>

              <button className="mt-6 rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500">
                Save Invoice
              </button>
            </div>

            <div className="rounded-xl bg-white p-8 text-slate-950">
              <h3 className="text-3xl font-bold">Invoice Preview</h3>

              <div className="mt-6 border-t border-slate-300 pt-6">
                <p className="font-semibold">InvoiceAI</p>
                <p className="text-slate-500">Invoice #1001</p>
              </div>

              <div className="mt-8">
                <p className="font-semibold">Description</p>
                <p>{description || "No description yet"}</p>
              </div>

              <div className="mt-8 space-y-2">
                <div className="flex justify-between">
                  <span>Quantity</span>
                  <span>{quantity}</span>
                </div>

                <div className="flex justify-between">
                  <span>Price</span>
                  <span>${price.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>

                <div className="flex justify-between border-t border-slate-300 pt-4 text-xl font-bold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}