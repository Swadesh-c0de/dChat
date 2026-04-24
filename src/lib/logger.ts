export const logError = (context: string, error: unknown) => {
    console.error(`[dChat] Error in ${context}:`, error);

    if (error && typeof error === 'object' && Object.keys(error).length === 0) {
        console.error('Empty error object detected. Requires deeper inspection.');
        // Try to log generic properties if they exist but are not enumerable
        try {
            console.error('Stringified:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        } catch (e) {
            console.error('Could not stringify error');
        }
    }
};
