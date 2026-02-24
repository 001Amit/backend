import Joi from "joi";

/* =============================
   PLACE ORDER VALIDATION
============================= */

export const placeOrderSchema = Joi.object({
  shippingAddress: Joi.object({
    address: Joi.string().min(10).required(),

    city: Joi.string()
      .min(2)
      .pattern(/^[A-Za-z\s]+$/)
      .required(),

    state: Joi.string()
      .min(2)
      .pattern(/^[A-Za-z\s]+$/)
      .required(),

    pincode: Joi.string()
      .pattern(/^\d{6}$/)
      .required(),

    phone: Joi.string()
      .pattern(/^[6-9]\d{9}$/)
      .required(),
  }).required(),

  paymentMethod: Joi.string()
    .valid("COD", "ONLINE")
    .required(),
});
