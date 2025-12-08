/**
 * Varbe Fee Calculation System
 * 
 * Rules:
 * - Varbe fee: 10% of sale price, maximum 10€ (cap applies at 100€)
 * - Stripe fee: 1.5% + 0.25€ per transaction
 * - Minimum listing price: 10€
 */

export interface FeeBreakdown {
    salePrice: number;
    varbeFee: number;
    stripeFee: number;
    artistEarnings: number;
    artistPercentage: number; // Percentage of sale price kept by artist
}

/**
 * Calculate Varbe platform fee (10% with 10€ cap)
 */
export const calculateVarbeFee = (salePrice: number): number => {
    const fee = salePrice * 0.10; // 10%
    return Math.min(fee, 10); // Cap at 10€
};

/**
 * Calculate Stripe payment processing fee (1.5% + 0.25€)
 */
export const calculateStripeFee = (salePrice: number): number => {
    return salePrice * 0.015 + 0.25; // 1.5% + 0.25€
};

/**
 * Calculate complete fee breakdown for a sale
 */
export const calculateFees = (salePrice: number): FeeBreakdown => {
    const varbeFee = calculateVarbeFee(salePrice);
    const stripeFee = calculateStripeFee(salePrice);
    const artistEarnings = salePrice - varbeFee - stripeFee;
    const artistPercentage = (artistEarnings / salePrice) * 100;

    return {
        salePrice,
        varbeFee,
        stripeFee,
        artistEarnings,
        artistPercentage: Math.round(artistPercentage * 100) / 100, // Round to 2 decimals
    };
};

/**
 * Validate minimum listing price (10€)
 */
export const validateMinimumPrice = (price: number): boolean => {
    return price >= 10;
};

/**
 * Get minimum price error message
 */
export const getMinimumPriceError = (): string => {
    return "Der Mindestpreis beträgt 10€. Dies ist notwendig, damit die Stripe-Gebühren fair sind.";
};






