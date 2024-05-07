import mongoose from 'mongoose';
import { DATABASE_URL } from './Config/index.js';

export default class Database {
    static instance = null;

    static async getInstance() {
        if (this.instance == null) {
            try {
                const connection = await mongoose.connect(
                    DATABASE_URL,
                    {}
                );
                this.instance = connection.connection;
                console.log('====== DB STATE: Database connected ======');
                return this.instance;
            } catch (error) {
                console.log('====== DB STATE: Database connection failed ======');
                throw new Error(error.message);
            }
        }

        return this.instance;
    }
}