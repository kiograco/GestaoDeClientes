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
  "/sales/customers/cnpj/:cnpj",
  isAuth,
  SalesCustomerController.showCompanyByCnpj
);
salesCustomerRoutes.get(
  "/sales/customers",
  isAuth,
  SalesCustomerController.index
);
salesCustomerRoutes.get(
  "/sales/customers/:clientId",
  isAuth,
  SalesCustomerController.show
);
salesCustomerRoutes.post(
  "/sales/customers",
  isAuth,
  SalesCustomerController.store
);
salesCustomerRoutes.put(
  "/sales/customers/:clientId",
  isAuth,
  SalesCustomerController.update
);
salesCustomerRoutes.delete(
  "/sales/customers/:clientId",
  isAuth,
  SalesCustomerController.remove
);
salesCustomerRoutes.get(
  "/clients/cnpj/:cnpj",
  isAuth,
  SalesCustomerController.showCompanyByCnpj
);
salesCustomerRoutes.get("/clients", isAuth, SalesCustomerController.index);
salesCustomerRoutes.get(
  "/clients/:clientId",
  isAuth,
  SalesCustomerController.show
);
salesCustomerRoutes.post("/clients", isAuth, SalesCustomerController.store);
salesCustomerRoutes.put(
  "/clients/:clientId",
  isAuth,
  SalesCustomerController.update
);
salesCustomerRoutes.delete(
  "/clients/:clientId",
  isAuth,
  SalesCustomerController.remove
);

export default salesCustomerRoutes;
