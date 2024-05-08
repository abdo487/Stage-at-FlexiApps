import Database from "../Database.js";
import OnlineUsers from "../Helpers/Online-users.js";
import ResponseStatus from "../Helpers/ResponseStatus.js";
import Order, { ORDER_STATUSES } from "../Models/Order.js";
import User, { LIVREUR_STATUS, ROLES } from "../Models/User.js";
import Products from "../Models/Product.js";
import Notification from "../Models/Notification.js";
import { io } from "../../Server.js";
import HttpResponse from "../Helpers/HttpResponse.js";

// This is the midleware for getting order by id
export const getOrderById = async (req, res, next, id) => {
  try {
    await Database.getInstance();
    const order = await Order.findById(id);
    if (!order) {
      return res
        .status(404)
        .json(HttpResponse(ResponseStatus.FAILED, "Order not found"));
    }
    req.order = order;
    next();
  } catch (err) {
    res.status(500).json(HttpResponse(ResponseStatus.SERVER_ERR, err.message));
  }
};

// This is the function for getting orders by user
export const getOrdersByUser = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    await Database.getInstance();
    const orders = await Order.find({ user: req.user._id })
      .skip((page - 1) * limit)
      .limit(limit * 1);
    return res.status(200).json(
      HttpResponse(ResponseStatus.SUCCESS, "Orders retrieved", {
        orders,
        pagination: {
          total: orders.length,
          page: page,
          limit: limit,
          totalPages: Math.ceil(orders.length / limit),
          totalOrders: Order.countDocuments(),
        },
      })
    );
  } catch (err) {
    res.status(500).json(HttpResponse(ResponseStatus.SERVER_ERR, err.message));
  }
};

// This is the function for getting all orders
export const getOrders = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    await Database.getInstance();
    const orders = await Order.find()
      .skip((page - 1) * limit)
      .limit(limit * 1);
    return res.status(200).json(
      HttpResponse(ResponseStatus.SUCCESS, "Orders retrieved", {
        orders,
        pagination: {
          total: orders.length,
          page: page,
          limit: limit,
          totalPages: Math.ceil(orders.length / limit),
          totalOrders: Order.countDocuments(),
        },
      })
    );
  } catch (err) {
    res.status(500).json(HttpResponse(ResponseStatus.SERVER_ERR, err.message));
  }
};

// This is the function for getting a single order
export const getOrder = (req, res) => {
  return res
    .status(200)
    .json(HttpResponse(ResponseStatus.SUCCESS, "Order retrieved", req.order));
};

// This is the midlware for validating the order details before adding it to the database
export const validateOrder = (req, res, next) => {
  const { products, address } = req.body;
  if (!products) {
    return res
      .status(400)
      .json(
        HttpResponse(ResponseStatus.ORDER_PRODUCTS_ERR, "Products are required")
      );
  } else if (!Array.isArray(products)) {
    return res
      .status(400)
      .json(
        HttpResponse(
          ResponseStatus.ORDER_PRODUCTS_ERR,
          "Products should be an array"
        )
      );
  } else if (products.length === 0) {
    return res
      .status(400)
      .json(
        HttpResponse(
          ResponseStatus.ORDER_PRODUCTS_ERR,
          "Products should not be empty"
        )
      );
  } else if (!address) {
    return res
      .status(400)
      .json(
        HttpResponse(ResponseStatus.ORDER_PRODUCTS_ERR, "Address is required")
      );
  }
  next();
};

// This is the function for creating an order
export const createOrder = async (req, res) => {
  try {
    await Database.getInstance();
    let { products, address } = req.body;
    products = await Products.find({ _id: { $in: products } });
    let total = products.reduce((acc, product) => acc + product.price, 0);
    const order = await Order.create({
      user: req.user._id,
      products,
      total,
      address,
    });
    return res
      .status(201)
      .json(HttpResponse(ResponseStatus.SUCCESS, "Order created", order));
  } catch (err) {
    res.status(500).json(HttpResponse(ResponseStatus.SERVER_ERR, err.message));
  }
};

// This is the midleware for checking if the user is the owner of the order
export const isOrderOwner = (req, res, next) => {
  const { user, order } = req;
  if (user._id.toString() !== order.user.toString()) {
    return res
      .status(403)
      .json(HttpResponse(ResponseStatus.FORBIDDEN, "Access denied"));
  }
  next();
};

// This is the function for updating orders Products
export const updateOrderProducts = async (req, res) => {
  try {
    let order = req.order;
    if (order.status !== ORDER_STATUSES.BASKET) {
      return res
        .status(403)
        .json(
          HttpResponse(ResponseStatus.FORBIDDEN, "You can't update this order")
        );
    }
    await Database.getInstance();
    const { products } = req.body;
    if (!products || products.length === 0 || !Array.isArray(products)) {
      return res
        .status(400)
        .json(
          HttpResponse(
            ResponseStatus.ORDER_PRODUCTS_ERR,
            "Array of Products is required"
          )
        );
    }
    order = await Order.findByIdAndUpdate(
      { _id: order._id },
      { $set: { products } },
      { new: true }
    );
    return res
      .status(200)
      .json(HttpResponse(ResponseStatus.SUCCESS, "Order updated", order));
  } catch (err) {
    res.status(500).json(HttpResponse(ResponseStatus.SERVER_ERR, err.message));
  }
};

// This is the function for confirming an order
export const confirmOrder = async (req, res) => {
  try {
    let order = req.order;
    if (order.status !== ORDER_STATUSES.BASKET) {
      return res
        .status(403)
        .json(
          HttpResponse(
            ResponseStatus.FORBIDDEN,
            "You can't confirm this order, because it's already processed."
          )
        );
    }
    await Database.getInstance();
    order = await Order.findByIdAndUpdate(
      { _id: order._id },
      { status: ORDER_STATUSES.CONFIRMED },
      { new: true }
    );
    // add livreur to order
    let livreurs = await User.find({
      role: ROLES.LIVREUR,
      status: LIVREUR_STATUS.FREE,
    });

    // if no available livreur
    if (livreurs.length === 0) {
      return res
        .status(400)
        .json(
          HttpResponse(
            ResponseStatus.FAILED,
            "No available livreur to deliver the order"
          )
        );
    }
    let livreur = livreurs.find((l) => OnlineUsers.isOnline(l._id.toString()));
    let livreurNotification = {
      title: "New Order",
      message: "You have a new order to deliver",
    }; // initialize notification
    if (livreur) {
      // if there is an online available livreur assign the order to him and send him a notification
      livreurNotification.user = livreur._id.toString();
      const notification = await Notification.create(livreurNotification);
      let socketId = OnlineUsers.getUserById(livreur._id.toString()).socketId;
      io.to(socketId).emit("notification", notification);
    } else {
      // if there is no online available livreur assign the order to the first available livreur
      livreur = livreurs[0];
      livreurNotification.user = livreur._id.toString();
      const notification = await Notification.create(livreurNotification);
    }
    order.livreur = livreur._id;
    await order.save();

    // initialize a notification for the user
    let userNotification = {
      title: "Order Confirmed",
      message: "Your order has been confirmed",
      user: order.user,
    };
    const notification = await Notification.create(userNotification);
    if (OnlineUsers.isOnline(order.user.toString())) {
      // if the user is online send him a notification
      io.to(OnlineUsers.getUserById(order.user.toString()).socketId).emit(
        "notification",
        notification
      );
    }

    return res
      .status(200)
      .json(HttpResponse(ResponseStatus.SUCCESS, "Order confirmed", order));
  } catch (err) {
    console.log(err);
    res.status(500).json(HttpResponse(ResponseStatus.SERVER_ERR, err.message));
  }
};

// This is the midleware for checking if the user is a livreur
export const isOrderLivreur = (req, res, next) => {
  try {
    const { user, order } = req;
    if (order.livreur == null) {
      return res
        .status(403)
        .json(
          HttpResponse(
            ResponseStatus.FORBIDDEN,
            "You are not the livreur of this order"
          )
        );
    }
    if (user._id.toString() !== order.livreur.toString()) {
      return res
        .status(403)
        .json(
          HttpResponse(
            ResponseStatus.FORBIDDEN,
            "You are not the livreur of this order"
          )
        );
    }
    next();
  } catch (error) {
    next(error);
  }
};

// This is the function for changing the status of an order to livraison
export const liverOrder = async (req, res) => {
  try {
    let order = req.order;
    if (order.status !== ORDER_STATUSES.CONFIRMED) {
      return res
        .status(403)
        .json(
          HttpResponse(
            ResponseStatus.FORBIDDEN,
            "You can't deliver this order, because it's not confirmed."
          )
        );
    }
    await Database.getInstance();
    order = await Order.findByIdAndUpdate(
      { _id: order._id },
      { status: ORDER_STATUSES.LIVRAISON },
      { new: true }
    );
    // initialize a notification for the user
    let userNotification = {
      title: "Order in delivery",
      message: "Your order is in delivery",
      user: order.user,
    };
    const notification = await Notification.create(userNotification);
    if (OnlineUsers.isOnline(order.user.toString())) {
      // if the user is online send him a notification
      io.to(OnlineUsers.getUserById(order.user.toString()).socketId).emit(
        "notification",
        notification
      );
    }
    return res
      .status(200)
      .json(HttpResponse(ResponseStatus.SUCCESS, "Order in delivery", order));
  } catch (err) {
    res.status(500).json(HttpResponse(ResponseStatus.SERVER_ERR, err.message));
  }
};

// This is the function for updating an order status to deposed
export const deposeOrder = async (req, res) => {
  try {
    let order = req.order;
    await Database.getInstance();
    order = await Order.findByIdAndUpdate(
      { _id: order._id },
      { status: ORDER_STATUSES.DEPOSED },
      { new: true }
    );
    // initialize a notification for the user
    let userNotification = {
      title: "Order Delivered",
      message: "Your order has been delivered",
      user: order.user,
    };
    const notification = await Notification.create(userNotification);
    if (OnlineUsers.isOnline(order.user.toString())) {
      // if the user is online send him a notification
      io.to(OnlineUsers.getUserById(order.user.toString()).socketId).emit(
        "notification",
        notification
      );
    }
    return res
      .status(200)
      .json(HttpResponse(ResponseStatus.SUCCESS, "Order delivered", order));
  } catch (err) {
    res.status(500).json(HttpResponse(ResponseStatus.SERVER_ERR, err.message));
  }
};

// This is the function for deleting an order
export const deleteOrder = async (req, res) => {
  try {
    await Database.getInstance();
    let order = req.order;
    await Order.findByIdAndDelete(order._id);
    return res
      .status(200)
      .json(HttpResponse(ResponseStatus.SUCCESS, "Order deleted"));
  } catch (err) {
    res.status(500).json(HttpResponse(ResponseStatus.SERVER_ERR, err.message));
  }
};
