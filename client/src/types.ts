import { DependencyList } from 'react'

import { Filter, Sorting } from '@devexpress/dx-react-grid'

export type CancellablePromise<T = void> = Promise<T> & {
    cancel?: () => void
}

export interface AsyncBase {
    loading: boolean
    error: Error | undefined
    clearError: () => void
}

export interface AsyncData<T> extends AsyncBase {
    data: T | undefined
    reload: () => Promise<void>
    clearData: () => void
}

export interface AsyncPageData<T> extends AsyncData<T> {
    data: T
}

export interface ListParams {
    page: number
    pageSize: number
    sort: Sorting[]
    debouncedFilter: Filter[]
}

export interface ColumnInfo {
    name: string
    title: string
    ratio: number
}

export interface TableState {
    sort: Sorting[]
    setSort: (sort: Sorting[]) => void
    deps: DependencyList
    filter: Filter[]
    debouncedFilter: Filter[]
    setFilter: (filter: Filter[]) => void
    page: number
    setPage: (page: number) => void
    pageSize: number
    setPageSize: (pageSize: number) => void
    columns: string[]
    setColumns: (c: string[]) => void
}

export type Permission = 'approve_file' | 'add_logentry' | 'change_logentry' | 'delete_logentry' | 'view_logentry' | 'add_group' | 'change_group' | 'delete_group' | 'view_group' | 'add_permission' | 'change_permission' | 'delete_permission' | 'view_permission' | 'add_token' | 'change_token' | 'delete_token' | 'view_token' | 'add_accessattempt' | 'change_accessattempt' | 'delete_accessattempt' | 'view_accessattempt' | 'add_accesslog' | 'change_accesslog' | 'delete_accesslog' | 'view_accesslog' | 'add_contenttype' | 'change_contenttype' | 'delete_contenttype' | 'view_contenttype' | 'add_user' | 'change_user' | 'delete_user' | 'view_user' | 'add_datasource' | 'change_datasource' | 'delete_datasource' | 'view_datasource' | 'add_file' | 'approve_file' | 'change_file' | 'delete_file' | 'view_file' | 'add_note' | 'change_note' | 'delete_note' | 'view_note' | 'add_stakeholder' | 'change_stakeholder' | 'delete_stakeholder' | 'view_stakeholder' | 'add_todo' | 'change_todo' | 'delete_todo' | 'view_todo' | 'add_vendor' | 'change_vendor' | 'delete_vendor' | 'view_vendor' | 'add_session' | 'change_session' | 'delete_session' | 'view_session'

export interface User {
    username: string
    firstName: string
    lastName: string
    email: string
    isStaff: boolean
    permissions: Permission[]
}

export interface Stakeholder {
    pk?: string
    name: string
    phone: string
    email: string
}

export interface Vendor {
    pk?: string
    name: string
    shortName: string
    approvalRegex: string
    readonly code: string
    readonly dateAdded: string
    readonly fileCount: number
    autoApprove: boolean
    priority: number
    pocs: Stakeholder[]
}

export type WritableVendor = Pick<Vendor, 'pk' | 'name' | 'shortName' | 'autoApprove' | 'pocs' | 'approvalRegex' | 'priority'>

export enum Status {
    Unscanned = 'unscanned',
    Clean = 'clean',
    Quarantined = 'quarantined',
    Approved = 'approved',
    Transferred = 'transferred',
    Failed = 'failed',
    Rejected = 'rejected'
}

export interface File {
    pk: string
    name: string
    location: string
    key: string
    size: number
    vendor: Vendor
    readonly url: string
    submitter: string
    priority: number
    dateUploaded: string
    dateApproved: string
    status: Status
    fragments: string[]
}

export interface DataSource {
    pk?: string
    name: string
    dataOrigin: string
    dataType: string
    dateInformation: string | null
    dateIngest: string | null
    entities: string
    frequency: string
    leads: string
    portfolio: string
    priority: number
    requestMethod: string
    status: string
    theme: string
    updatePeriodically: string
}

export interface Todo {
    pk: string
    lead: string
    text: string
    complete: boolean
    createdBy: User
    createdAt: string
}

export interface Note {
    pk: string
    status: string
    note: string
    createdBy: User
    createdAt: string
}
