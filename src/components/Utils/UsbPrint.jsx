import React, { useState, useRef } from "react";
import { toast } from "react-toastify";
import { sendorder, setdata } from "../../api";

export default function UsbPrint({
  productsToSend,
  customerPhone,
  customerName,
  customerAddress,
  icon: Icon,
  timestamp,
  includeGST = true,
  save = true, // default true
}) {
  const [isPrinting, setIsPrinting] = useState(false);
  const invoiceRef = useRef();
  // Helper: Calculate total price
  const calculateTotalPrice = (items = []) =>
    items.reduce((sum, p) => sum + p.price * (p.quantity || 1), 0);

  const date = timestamp ? new Date(timestamp) : new Date();
  const formattedDate = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const itemTotal = calculateTotalPrice(productsToSend);
  const gstAmount = includeGST ? +(itemTotal * 0.05).toFixed(2) : 0;
  const netTotal = itemTotal + gstAmount;

  const handleUsbPrint = async () => {
    try {
      setIsPrinting(true);

      const kotContent = document.getElementById("mobileinvoice").innerHTML;

      const newWindow = window.open("", "", "width=600,height=400");
      newWindow.document.write(`
        <html>
          <head>
            <title>KOT</title>
            <style>
                body {
                font-family: Arial, sans-serif;
                font-size: 12px;
                width: 69mm;
              }
              table {
                width: 100%;
                border-collapse: collapse;
              }
              th, td {
                border: 1px solid black;
                padding: 2px;
                text-align: left;
                font-size: 11px;
                color: "black";
              }
                .total {
                font-size: 13px;
                text-align: left;
                margin-top: 4px;
                display: flex;
                align-items: baseline;
                justify-content: space-between;
              }
              .totalAmount {
                font-size: 15px;
                font-weight: 800;
                border: 2px dashed;
                text-align: center;
                background: black;
                color: white;
                padding: 0.4rem;
              }
              hr {
                border: 2px dashed;
              }
            </style>
          </head>
          <body>
            ${kotContent}
          </body>
        </html>
      `);

      newWindow.document.close();

      newWindow.onload = async () => {
        newWindow.focus();
        newWindow.print();
        newWindow.close();
        // 👉 Save to DB just like RawBT
        if (save) {
          const orderId = `order_${Date.now()}`;
          const dateISO = new Date(timestamp || Date.now()).toISOString();

          const order = {
            id: orderId,
            products: productsToSend,
            totalAmount: netTotal,
            name: customerName,
            phone: customerPhone,
            address: customerAddress,
            timestamp: dateISO,
            gstAmount,
            includeGST,
          };

          const customerDataObject = {
            id: orderId,
            name: customerName,
            phone: customerPhone,
            address: customerAddress,
            timestamp: dateISO,
          };

          try {
            await sendorder(order);
            await setdata(customerDataObject);
          } catch (err) {
            toast.info("Error saving USB order:", err);
          }

          // Reload if save=true
          window.location.reload();
        } else {
          setIsPrinting(false);
        }
      };
    } catch (error) {
      console.error("Error generating printable content:", error);
    }
  };

  return (
    <>
      <div onClick={handleUsbPrint}>
        {Icon ? (
          <Icon />
        ) : (
          <button
            className="kot-btn"
            disabled={isPrinting}
            style={{
              opacity: isPrinting ? 0.5 : 1,
              cursor: isPrinting ? "not-allowed" : "pointer",
            }}
          >
            {isPrinting ? "Printing..." : "USB Print"}
          </button>
        )}
      </div>

      {/* Hidden Printable Content */}
      <div
        className="invoice-content"
        id="mobileinvoice"
        ref={invoiceRef}
        style={{ display: "none" }}
      >
        <div
          style={{
            border: "2px dotted",
            margin: "0 0 10px 0",
            padding: ".4rem",
          }}
        >
          <h1
            style={{ textAlign: "center", margin: ".5rem", fontSize: "35px" }}
          >
            Pizza Italia
          </h1>
          <p
            style={{
              textAlign: "center",
              marginTop: 0,
              fontSize: "15px",
              padding: "0 2px",
            }}
          >
            Opposite New Bus Stand,
            <br />
            Pipli Road Kurukshetra,
            <br />
            99922-20610 99922-20610
            <br />
            GstNo: 06QTIPS7467A1Z1
          </p>
          <hr />
          <h2 style={{ textAlign: "center", margin: 0, fontSize: "20px" }}>
            Invoice Details
          </h2>
          <div className="customer-info">
            <p style={{ fontSize: "16px", margin: "0" }}>
              Date:&nbsp;&nbsp;&nbsp;&nbsp;{formattedDate + " " + formattedTime}
            </p>
            <p style={{ fontSize: "16px", margin: "0" }}>
              Bill No:&nbsp;&nbsp;#{Math.floor(1000 + Math.random() * 9000)}
            </p>
            {customerName && (
              <p style={{ fontSize: "16px", margin: "0" }}>
                Customer&nbsp;:&nbsp;{customerName}
              </p>
            )}
            {customerPhone && (
              <p style={{ fontSize: "16px", margin: "0" }}>
                Phone&nbsp;:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                {customerPhone}
              </p>
            )}
            {customerAddress && (
              <p style={{ fontSize: "16px", margin: "0 0 1rem 0" }}>
                Address&nbsp;:&nbsp;&nbsp;&nbsp;&nbsp;{customerAddress}
              </p>
            )}
          </div>
          <table>
            <thead>
              <tr style={{ background: "darkgrey" }}>
                <th style={{ fontSize: "16px" }}>Item</th>
                <th style={{ fontSize: "16px" }}>Qty</th>
                <th style={{ fontSize: "16px" }}>Price</th>
                <th style={{ fontSize: "16px" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {productsToSend.map((product, index) => (
                <tr key={index} className="productdetail">
                  <td style={{ fontSize: "15px" }}>
                    {product.size
                      ? `${product.name} (${product.size})`
                      : product.name}
                  </td>
                  <td style={{ textAlign: "Center", fontSize: "15px" }}>
                    {product.quantity || 1}
                  </td>
                  <td style={{ textAlign: "Center", fontSize: "15px" }}>
                    ₹{product.price}
                  </td>
                  <td style={{ textAlign: "Center", fontSize: "15px" }}>
                    ₹{product.price * (product.quantity || 1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {includeGST && (
            <>
              <p
                style={{
                  fontSize: "15px",
                  margin: "2px 0",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                Item Total: <span>₹{itemTotal.toFixed(2)}</span>
              </p>
              <p
                style={{
                  fontSize: "15px",
                  margin: "2px 0",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                GST (5%): <span>+{gstAmount.toFixed(2)}</span>
              </p>
            </>
          )}
          <p className="totalAmount">Net Total: ₹{netTotal.toFixed(2)}</p>{" "}
          <hr />
          <div
            style={{
              textAlign: "center",
              fontSize: "15px",
              padding: ".1rem 0 1rem",
            }}
          >
            Thank You Visit Again!
            <br />
            <span style={{ fontSize: "12px", fontStyle: "italic", textAlign: "center", color: "gray" }}>
              Powered by Billzo | 70158-23645
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
