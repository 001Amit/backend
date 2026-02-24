export const generateInvoice = (order) => {
  return `
    Invoice ID: ${order._id}
    Total: ₹${order.totalAmount}
    Status: ${order.orderStatus}
  `;
};
