import { Status } from 'Types'

export const sidePanelWidth = 240

export const s3NameRegex = /^[A-Za-z0-9\-\s!_.*'()]*$/

export const statusWhitelist = [
    Status.Clean,
    Status.Approved,
    Status.Transferred
]

export const defaultPageSize = 10

export const pageSizeOptions = [5, 10, 25, 50]