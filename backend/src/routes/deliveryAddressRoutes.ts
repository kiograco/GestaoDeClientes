import express from "express";
import isAuth from "../middleware/isAuth";
import * as DeliveryAddressController from "../controllers/DeliveryAddressController";

const deliveryAddressRoutes = express.Router();

deliveryAddressRoutes.get(
  "/delivery/contacts/:contactId/addresses",
  isAuth,
  DeliveryAddressController.indexAddresses
);
deliveryAddressRoutes.post(
  "/delivery/addresses",
  isAuth,
  DeliveryAddressController.storeAddress
);
deliveryAddressRoutes.put(
  "/delivery/addresses/:addressId",
  isAuth,
  DeliveryAddressController.updateAddress
);
deliveryAddressRoutes.delete(
  "/delivery/addresses/:addressId",
  isAuth,
  DeliveryAddressController.removeAddress
);
deliveryAddressRoutes.get(
  "/delivery/zones",
  isAuth,
  DeliveryAddressController.indexZones
);
deliveryAddressRoutes.get(
  "/delivery/zones/resolve",
  isAuth,
  DeliveryAddressController.showResolvedZone
);
deliveryAddressRoutes.post(
  "/delivery/zones",
  isAuth,
  DeliveryAddressController.storeZone
);
deliveryAddressRoutes.put(
  "/delivery/zones/:zoneId",
  isAuth,
  DeliveryAddressController.updateZone
);
deliveryAddressRoutes.delete(
  "/delivery/zones/:zoneId",
  isAuth,
  DeliveryAddressController.removeZone
);

export default deliveryAddressRoutes;
