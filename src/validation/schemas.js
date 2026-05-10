import Joi from 'joi';
import { VALID_UNITS } from '../constants/units.js';

const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

const convertSchema = Joi.object({
    value: Joi.number().required(),
    sourceUnit: Joi.string().valid(...VALID_UNITS).required()
        .messages({ 'any.only': `sourceUnit must be one of: ${VALID_UNITS.join(', ')}` }),
    targetUnit: Joi.string().valid(...VALID_UNITS).required()
        .messages({ 'any.only': `targetUnit must be one of: ${VALID_UNITS.join(', ')}` }),
});

export { registerSchema, loginSchema, convertSchema };