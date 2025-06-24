import React from "react";

export default function WhatsAppButton({
  productsToSend,
  deliveryChargeAmount,
  deliveryCharge,
  parsedDiscount,
  customerPhone,
  customerName,
  customerAddress,
  restaurantName,
}) {
  // Helper to calculate total price of items
  const calculateTotalPrice = (items = []) =>
    items.reduce((sum, p) => sum + p.price * (p.quantity || 1), 0);

    const itemTotal = calculateTotalPrice(productsToSend);
    const gstAmount = +(itemTotal * 0.05).toFixed(2);

  const handleSendToWhatsApp = () => {
    // Compute current total
    const currentTotal =
      calculateTotalPrice(productsToSend) + gstAmount +
      deliveryChargeAmount -
      parsedDiscount;

    // Map product details
    const productDetails = productsToSend
      .map((product, i) => {
        const qty = product.quantity || 1;
        const sizeLabel = product.size ? ` ${product.size}` : "";
        return `${i+1}. ${qty} x ${product.name}${sizeLabel} = ₹${
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
      `*🍔🍟🍕 Pizza Italia 🍕🍟🍔*\n\n` +
        `Order: *${orderId}*` +
        (customerName ? `\nName: *${customerName}*` : "") +
        (customerPhone ? `\nPhone: *${customerPhone}*` : "") +
        (customerAddress ? `\nAddress: *${customerAddress}*` : "") +
        `\nAmount: *₹${currentTotal}*` +
        `\n\n----------item----------\n${productDetails}` +
        `\n\n GST (5%) =  ₹${gstAmount}` +
        (serviceText ? `\n${serviceText}` : "") +
        (discountText ? `\n${discountText}` : "")
    );

    // Format number for WhatsApp
    const formattedPhone = `${customerPhone}`;
    const waUrl = `https://wa.me/${formattedPhone}?text=${message}`;
    window.open(waUrl, "_blank");
  };

  return (
    <button onClick={handleSendToWhatsApp} className="popupButton">
      Send to WhatsApp
    </button>
  );
}
