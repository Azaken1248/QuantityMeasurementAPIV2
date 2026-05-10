export const MeasurementType = Object.freeze({
    LENGTH: 'LENGTH',
    VOLUME: 'VOLUME',
    WEIGHT: 'WEIGHT',
    TEMPERATURE: 'TEMPERATURE',
});

export const UnitType = Object.freeze({
    FEET: MeasurementType.LENGTH,
    INCH: MeasurementType.LENGTH,
    YARD: MeasurementType.LENGTH,
    CENTIMETER: MeasurementType.LENGTH,

    GALLON: MeasurementType.VOLUME,
    LITRE: MeasurementType.VOLUME,
    ML: MeasurementType.VOLUME,

    KG: MeasurementType.WEIGHT,
    GRAM: MeasurementType.WEIGHT,
    TONNE: MeasurementType.WEIGHT,

    CELSIUS: MeasurementType.TEMPERATURE,
    FAHRENHEIT: MeasurementType.TEMPERATURE,
    KELVIN: MeasurementType.TEMPERATURE,
});


export const BaseFactors = Object.freeze({
    FEET: 12,
    INCH: 1,
    YARD: 36,
    CENTIMETER: 0.393701,

    GALLON: 3785.41,
    LITRE: 1000,
    ML: 1,

    KG: 1000,
    GRAM: 1,
    TONNE: 1_000_000,
});

export const toKelvin = (value, unit) => {
    switch (unit) {
        case 'CELSIUS': return value + 273.15;
        case 'FAHRENHEIT': return (value - 32) * 5 / 9 + 273.15;
        case 'KELVIN': return value;
        default: throw new Error(`Unknown temperature unit: ${unit}`);
    }
};

export const fromKelvin = (kelvin, unit) => {
    switch (unit) {
        case 'CELSIUS': return kelvin - 273.15;
        case 'FAHRENHEIT': return (kelvin - 273.15) * 9 / 5 + 32;
        case 'KELVIN': return kelvin;
        default: throw new Error(`Unknown temperature unit: ${unit}`);
    }
};

export const VALID_UNITS = Object.keys(UnitType);
