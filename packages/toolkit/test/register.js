// we need a custom register function to pass custom extensions
// eslint-disable-next-line prettier/prettier
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('@babel/register')({ extensions: ['.js', '.ts'] })
