import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// create new order
const placeOrder = async(req, res) => {

    const frontend_url = "https://fooddelivery-app-frontend-ql8o.onrender.com"
    
    try {
        const newOrder = new orderModel({
            userId: req.body.userId,
            items: req.body.items,
            amount: req.body.amount,
            address: req.body.address,
            payment: req.body.paymentMethod === "COD" ? true : req.body.paymentMethod === "Online" ? true : false,
            paymentMethod: req.body.paymentMethod
        })

        await newOrder.save();
        await userModel.findByIdAndUpdate(req.body.userId, {cartData: {}});

        // Handle Cash on Delivery (COD) case
        if (req.body.paymentMethod === "COD") {
            return res.json({ success: true, message: "Order placed successfully with COD", orderId: newOrder._id });
        }

        // Proceed with Stripe payment for online transactions
        const line_items = req.body.items.map((item) => ({
            price_data: {
                currency: "inr",
                product_data: {
                    name: item.name
                },
                unit_amount: item.price*100*86
            },
            quantity: item.quantity
        }))

        line_items.push({
            price_data: {
                currency: "inr",
                product_data: {
                    name: "Delivery Fee"
                },
                unit_amount: 2*100*86
            },
            quantity: 1
        })

        const session = await stripe.checkout.sessions.create({
            line_items: line_items,
            mode: 'payment',
            success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`,
        });

        res.json({success: true, session_url: session.url})

    } catch (error) {
        console.log(error);
        res.json({success: false, message: "Payment error"})
    }
};

// verify order
const verifyOrder = async(req, res) => {
    const {orderId, success} = req.body;
    try {
        if(success=="true") {
            await orderModel.findByIdAndUpdate(orderId, {payment: true});
            res.json({success: true, message: "Payment successful"})
        }
        else {
            await orderModel.findByIdAndDelete(orderId);
            res.json({success: false, message: "Payment failed"})
        }
    } catch (error) {
        console.log(error);
        res.json({success: false, message: "Error"})
    }
}

// user order model
const userOrders = async(req, res) => {
    try {
        const orders = await orderModel.find({userId: req.body.userId})
        res.json({success: true, data: orders})
    } catch (error) {
        console.log(error);
        res.json({success: false, message: "Error"})
    }
}

// Listing orders for a user
const listOrders = async(req, res) => {
    try {
        const orders = await orderModel.find({});
        res.json({success: true, data: orders})
    } catch (error) {
        console.log(error);
        res.json({success: false, message: {Error}});
    }
}

// update order status
const updateStatus = async(req, res) => {
    try {
        await orderModel.findByIdAndUpdate(req.body.orderId, {status: req.body.status})
        res.json({success: true, message: "Order status updated successfully"})
    } catch (error) {
        console.log(error);
        res.json({success: false, message: "Error updating order status"})
    }
}

export {placeOrder, verifyOrder, userOrders, listOrders, updateStatus}
