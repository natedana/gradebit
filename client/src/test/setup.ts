const originalError = console.error
beforeAll(() => {
    console.error = (...args: any) => {
        /**
         * Silences warnings about theme.spacing.unit being deprecated
         */
        if (/Warning.*theme\.spacing\.unit/.test(args[0])) {
            return
        }
        /**
         * Silences warnings about not wrapping things in act
         * @see https://github.com/kentcdodds/react-testing-library/issues/281
         */
        if (/Warning.*not wrapped in act/.test(args[0])) {
            return
        }
        originalError.call(console, ...args)
    }
})

afterAll(() => {
    console.error = originalError
})
