import React from "react";

/**
 * Props expected:
 * - productsToSend: Array of { name, price, quantity, size }
 * - deliveryChargeAmount: number
 * - deliveryCharge: string or number
 * - parsedDiscount: number
 * - customerPhone: string
 * - customerAddress: string
 * - restaurantName: string
 */
export default function WhatsAppButton({
  productsToSend,
  deliveryChargeAmount,
  deliveryCharge,
  parsedDiscount,
  customerPhone,
  customerAddress,
  restaurantName,
}) {
  // Helper to calculate total price of items
  const calculateTotalPrice = (items = []) =>
    items.reduce((sum, p) => sum + p.price * (p.quantity || 1), 0);

  const handleSendToWhatsApp = () => {
    // Compute current total
    const currentTotal =
      calculateTotalPrice(productsToSend) +
      deliveryChargeAmount -
      parsedDiscount;

    // Map product details
    const productDetails = productsToSend
      .map((product, i) => {
        const qty = product.quantity || 1;
        const sizeLabel = product.size ? ` ${product.size}` : "";
        return `${i + 1}. ${qty} x ${product.name}${sizeLabel} = ₹${
          product.price * qty
        }`;
      })
      .join("\n");

    // Optional charges
    const serviceText = deliveryCharge
      ? `Service Charge: ₹${deliveryChargeAmount}`
      : "";
    const discountText = parsedDiscount
      ? `Discount: -₹${parsedDiscount}`
      : "";

    // Order ID
    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    // Construct message
    const message = encodeURIComponent(
      `*🍔🍟🍕 ${restaurantName} 🍕🍟🍔*\n\n` +
        `Order: *${orderId}*` +
        (customerPhone ? `\nPhone: *${customerPhone}*` : "") +
        (customerAddress ? `\nAddress: *${customerAddress}*` : "") +
        `\nAmount: *₹${currentTotal}*` +
        `\n\n----------item----------\n${productDetails}` +
        (serviceText ? `\n${serviceText}` : "") +
        (discountText ? `\n${discountText}` : "")
    );

    if (!customerPhone) {
      alert("Customer phone is required to send message.");
      return;
    }

    // Format number for WhatsApp
    const formattedPhone = `+91${customerPhone}`;
    const waUrl = `https://wa.me/${formattedPhone}?text=${message}`;
    window.open(waUrl, "_blank");
  };

  return (
    <button onClick={handleSendToWhatsApp} className="popupButton">
      Send to WhatsApp
    </button>
  );
}
