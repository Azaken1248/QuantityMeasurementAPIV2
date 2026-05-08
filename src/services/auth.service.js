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

    async loginUser({ email, password }) {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            throw new Error('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }

        const accessToken = jwt.sign(
            { id: user.id }, 
            process.env.JWT_ACCESS_SECRET, 
            { expiresIn: '15m' }
        );

        const refreshTokenString = jwt.sign(
            { id: user.id }, 
            process.env.JWT_REFRESH_SECRET, 
            { expiresIn: '7d' }
        );

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); 

        await RefreshToken.create({
            userId: user.id,
            token: refreshTokenString,
            expiresAt: expiresAt
        });

        return {
            user: { id: user.id, email: user.email, firstName: user.firstName },
            accessToken,
            refreshToken: refreshTokenString
        };
    }
}

export default new AuthService();