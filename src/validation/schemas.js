import Joi from 'joi';
import { VALID_UNITS } from '../constants/units.js';

const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    role: Joi.string().valid('USER', 'ADMIN').optional(),
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

const quantitySchema = Joi.object({
    value: Joi.number().required(),
    unit: Joi.string().valid(...VALID_UNITS).required()
        .messages({ 'any.only': `unit must be one of: ${VALID_UNITS.join(', ')}` }),
});

const compareSchema = Joi.object({
    qty1: quantitySchema.required(),
    qty2: quantitySchema.required(),
});

const calculateSchema = Joi.object({
    op: Joi.string().valid('ADD', 'SUBTRACT', 'MULTIPLY', 'DIVIDE').required()
        .messages({ 'any.only': 'op must be one of: ADD, SUBTRACT, MULTIPLY, DIVIDE' }),
    qty1: quantitySchema.required(),
    qty2: quantitySchema.required(),
    targetUnit: Joi.string().valid(...VALID_UNITS).required()
        .messages({ 'any.only': `targetUnit must be one of: ${VALID_UNITS.join(', ')}` }),
});

const favoriteSchema = Joi.object({
    label: Joi.string().min(1).max(100).required(),
    sourceUnit: Joi.string().valid(...VALID_UNITS).required()
        .messages({ 'any.only': `sourceUnit must be one of: ${VALID_UNITS.join(', ')}` }),
    targetUnit: Joi.string().valid(...VALID_UNITS).required()
        .messages({ 'any.only': `targetUnit must be one of: ${VALID_UNITS.join(', ')}` }),
});

export { registerSchema, loginSchema, convertSchema, compareSchema, calculateSchema, favoriteSchema };