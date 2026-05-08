import authService from '../services/auth.service.js';
import { registerSchema } from '../validation/schemas.js';

class AuthController {
    async register(req, res) {
        try {
            const { error, value } = registerSchema.validate(req.body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: error.details[0].message
                    }
                });
            }

            const user = await authService.registerUser(value);

            return res.status(201).json({
                success: true,
                data: user,
                message: "User registered successfully",
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            return res.status(409).json({
                success: false,
                error: {
                    code: 'REGISTRATION_FAILED',
                    message: error.message
                },
                timestamp: new Date().toISOString()
            });
        }
    }
    async login(req, res) {
        try {
            const { error, value } = loginSchema.validate(req.body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'VALIDATION_ERROR', message: error.details[0].message }
                });
            }

            const data = await authService.loginUser(value);

            return res.status(200).json({
                success: true,
                data: data,
                message: "Login successful",
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            return res.status(401).json({
                success: false,
                error: { code: 'AUTHENTICATION_FAILED', message: error.message },
                timestamp: new Date().toISOString()
            });
        }
    }
}

export default new AuthController();