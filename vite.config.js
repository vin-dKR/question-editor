const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
    server: {
        proxy: !isProduction ? {
            '/api': {
                target: isProduction
                    ? 'https://question-banks.netlify.app'
                    : 'http://localhost:3000',
                // ... other options
            }
        } : undefined,
    }
})
