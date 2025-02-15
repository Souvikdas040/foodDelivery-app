import mongoose from "mongoose";

export const connectDB = async() => {
    await mongoose.connect('mongodb+srv://souvikdas03:fUCaljnJQ1OrZkK3@cluster0.xme1s.mongodb.net/food-del').then(() => console.log("DB Connected"));
}