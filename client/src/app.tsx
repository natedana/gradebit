import React from 'react'
import { hot } from 'react-hot-loader'
import { BrowserRouter, Route } from 'react-router-dom'
import { QueryParamProvider } from 'use-query-params'

import './api'

import App from './containers/App'

export default hot(module)(() => (
    <BrowserRouter>
        <QueryParamProvider ReactRouterRoute={ Route }>
            <App/>
        </QueryParamProvider>
    </BrowserRouter>
))
