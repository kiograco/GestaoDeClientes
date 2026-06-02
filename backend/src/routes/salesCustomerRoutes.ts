import express from "express";
import isAuth from "../middleware/isAuth";
import * as SalesCustomerController from "../controllers/SalesCustomerController";

const salesCustomerRoutes = express.Router();

salesCustomerRoutes.get(
  "/sales/address/cep/:zipCode",
  isAuth,
  SalesCustomerController.showAddressByZipCode
);
salesCustomerRoutes.get(
  "/sales/customers",
  isAuth,
  SalesCustomerController.index
);
salesCustomerRoutes.get(
  "/sales/customers/:contactId",
  isAuth,
  SalesCustomerController.show
);
salesCustomerRoutes.post(
  "/sales/customers",
  isAuth,
  SalesCustomerController.store
);
salesCustomerRoutes.put(
  "/sales/customers/:contactId",
  isAuth,
  SalesCustomerController.update
);

export default salesCustomerRoutes;
