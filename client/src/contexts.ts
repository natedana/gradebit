import React from 'react'

import { User } from 'Types'

export const UserContext = React.createContext<User | undefined>(undefined)