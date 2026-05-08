import bcrypt from 'bcrypt';
import User from '../models/User.js';

class AuthService {
    async registerUser({ email, password, firstName, lastName }) {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            throw new Error('User with this email already exists.');
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const newUser = await User.create({
            email,
            passwordHash,
            firstName,
            lastName
        });

        return {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName
        };
    }
}

export default new AuthService();