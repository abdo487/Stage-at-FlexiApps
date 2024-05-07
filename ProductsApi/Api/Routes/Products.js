import { Router } from "express";
import { requireAdminPermissions, requireAuth } from "../Controllers/Auth.js";
import {
  upload,
  add_product,
  products_list,
  validateProduct,
  findProductById,
  update_product,
  delete_product,
} from "../Controllers/Products.js";
import HttpResponse from "../Helpers/HttpResponse.js";
import ResponseStatus from "../Helpers/ResponseStatus.js";

const Products = Router();

Products.param("id", findProductById);

Products.get("/", requireAuth, products_list);
Products.get("/:id", requireAuth, (req, res) => {
    return res.status(200).json(HttpResponse(ResponseStatus.SUCCESS, "Product fetched successfully", req.product));
});
Products.post(
  "/",
  requireAuth,
  requireAdminPermissions,
  upload.array("images", 5),
  validateProduct,
  add_product
);
Products.put(
  "/:id",
  requireAuth,
  requireAdminPermissions,
  upload.array("images", 5),
  update_product
);
Products.delete("/:id", requireAuth, requireAdminPermissions, delete_product);

export default Products;
