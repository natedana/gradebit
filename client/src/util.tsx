import React, { DependencyList, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import axios from 'axios'
import qs from 'querystring'
import { QueryParamConfig, useQueryParam } from 'use-query-params'

import { Filter, FilteringState, PagingState, Sorting, SortingState } from '@devexpress/dx-react-grid'

import { PageData } from 'Api'
import { UserContext } from 'Contexts'

import { AsyncBase, AsyncData, CancellablePromise, Permission, TableState } from 'Types'

/**
 * Concatenates an 's' character or uses the pluralForm if the count parameter is not equal to 1.
 * Omitting the count parameter will result in the plural form always being returned.
 */
export function pluralize(value: string, count?: number, pluralForm?: string) {
    const useSingular = count === 1

    if (useSingular) {
        return value
    }

    return pluralForm || `${value}s`
}

interface AsyncHook extends AsyncBase {
    submit: () => any
    cancel: () => void
}

interface UseApiOptions {
    initialLoadingState?: boolean
    unauthorizedReload?: boolean
    debug?: boolean
}

/**
 * Executes action asynchronously, tracking the loading and error state.
 * @param action The async function.
 * @param deps List of dependencies for the previous argument.
 * @param options Object containing options
 * - initialLoadingState - Whether or not the hook inits in a loading state
 * - unauthorizedReload - Whether or not to reload the page on a 401 request (default to true)
 */
export function useApi<T, Args extends any[]>(action: (...args: Args) => CancellablePromise<T>, deps: DependencyList = [], options?: UseApiOptions): AsyncHook {
    const defaultedOptions = {
        initialLoadingState: false,
        unauthorizedReload: true,
        debug: false,
        ...(options || {})
    }

    const [loading, setLoading] = useState(defaultedOptions.initialLoadingState)
    const [error, setError] = useState<Error | undefined>(undefined)

    const promise = useRef<CancellablePromise<T>>()
    const promiseId = useRef(0)
    const safeAction = useCallback(action, deps)

    const cancel = useCallback(() => {
        setLoading(false)
        if (promise.current && promise.current.cancel) {
            promise.current.cancel()
        }
        if (promise.current) {
            promise.current = undefined
            promiseId.current++
        }
    }, [])

    const submit = useCallback(async (...args: Args) => {
        if (promise.current) {
            cancel()
        }
        let result
        setError(undefined)
        setLoading(true)
        const currentPromiseId = promiseId.current
        try {
            promise.current = safeAction(...args)
            result = await promise.current
        } catch (e) {
            if (defaultedOptions.debug) {
                console.error(e)
            }
            if (!axios.isCancel(e)) {
                if (defaultedOptions.unauthorizedReload && e.response && e.response.status === 401) {
                    window.location.reload()
                }
                setError(e)
            }
        }
        setLoading(false)
        if (currentPromiseId === promiseId.current) {
            return result
        }
    }, [cancel, defaultedOptions.debug, defaultedOptions.unauthorizedReload, safeAction])

    const clearError = () => {
        setError(undefined)
    }

    useEffect(() => cancel, [cancel])

    return { loading, error, submit, cancel, clearError }
}

interface UseApiDataOptions<T> extends UseApiOptions {
    initialValue?: T
}

/**
 * Loads data asynchronously, tracking the loading and error state.
 * @param action A function that loads the data.
 * @param deps List of dependencies for the previous argument.
 * @param options Object containing options
 * - initialLoadingState - Whether or not the hook inits in a loading state
 * - unauthorizedReload - Whether or not to reload the page on a 401 request (default to true)
 * - initialValue - The initial value of the data
 * - debug - Console error any error in the action call
 */
export function useApiData<T>(action: () => CancellablePromise<T>, deps: DependencyList = [], options?: UseApiDataOptions<T>): AsyncData<T> {
    const initialValue = options && options.initialValue
    const [data, setData] = useState(initialValue)
    const { loading, error, submit, cancel, clearError } = useApi(action, deps, { ...options, initialLoadingState: true })

    const reload = useCallback(async () => {
        const d = await submit()
        if (d) {
            setData(d)
        }
    }, [submit])

    useEffect(() => {
        reload()
        return cancel
    }, [cancel, reload])

    const clearData = () => {
        setData(initialValue)
    }

    const dataLoading = loading || (!data && !error)

    return { loading: dataLoading, error, reload, data, clearData, clearError }
}

/**
 *
 * @param action A function to load the paged data.
 * @param listParams The sort, filter of the page etc.
 */
export function usePageData<T>(action: () => Promise<PageData<T>>, deps: DependencyList) {
    const initialValue = { results: [], count: 0 }
    const result = useApiData(action, deps, { initialValue })
    const data = result.data ? result.data.results : []
    const total = result.data ? result.data.count : 0
    return { ...result, data, total }
}

interface PageStateArgs {
    initialSort?: Sorting[]
    initialFilter?: Filter[]
    initialPage?: number
    initialPageSize?: number
    initialColumns?: string[]
    filterDebounceTime?: number
}

const first = <T extends any>(input: T | T[]) => {
    if (Array.isArray(input)) {
        return input[0]
    } else {
        return input
    }
}

const decodeSort: Decode<Sorting[]> = input => {
    if (!input) {
        return []
    }
    let col = input
    if (Array.isArray(input)) {
        col = input[0]
    }
    const direction = col[0] !== '-' ? 'asc' : 'desc'
    const columnName = direction === 'asc' ? col as string : (col as string).slice(1)
    return [{
        columnName,
        direction
    }]
}
const encodeSort: Encode<Sorting[]> = sort => {
    if (!sort) {
        return ''
    }
    const columnName = sort[0] && sort[0].columnName
    const asc = sort[0] && sort[0].direction === 'asc'
    return `${asc ? '' : '-'}${columnName}`
}
const compareSort: Compare<Sorting[]> = (a, b) => {
    if (a.length !== b.length || a.length > 1 || b.length > 1) {
        return false
    } else if (a.length === 0) {
        return true
    } else if (a.length === 1 && a[0].columnName === b[0].columnName && a[0].direction === b[0].direction) {
        return true
    } else {
        return false
    }
}
function encodeFilter(filters: Filter[] | undefined) {
    if (!filters) {
        return []
    }
    return filters
        .map(filter => [filter.columnName, filter.operation, filter.value]
            .map(v => v || '')
            .join(':')
        )
}
const decodeFilter: Decode<Filter[]> = input => {
    if (!input) {
        return []
    }

    if (!Array.isArray(input)) {
        input = [input]
    }

    const ret = input
        .map(i => i.match(/^([^:]*):([^:]*):(.*)/))
        .filter(v => v)
        .map(match => {
            const [, columnName, operation, value] = match!
            return { columnName, operation, value }
        })
    return ret
}

const compareFilter: Compare<Filter[]> = (a, b) => {
    if (a.length !== b.length || a.length > 1 || b.length > 1) {
        return false
    } else if (a.length === 0) {
        return true
    } else if (a.length === 1 && a[0].columnName === b[0].columnName && a[0].value === b[0].value) {
        return true
    } else {
        return false
    }
}
const encodeNumber: Encode<number> = number => {
    if (!number) {
        return ''
    } else {
        return number.toString()
    }
}
const decodeNumber: Decode<number> = input => {
    if (!input) {
        return 0
    } else {
        return parseInt(first(input))
    }
}
const compareNumber: Compare<number> = (a, b) => {
    return a === b
}
const encodeColumns: Encode<string[]> = (columns: string[] | undefined) => {
    return columns ? columns.join(',') : ''
}
const decodeColumns: Decode<string[]> = input => {
    if (!input) {
        return []
    } else if (Array.isArray(input)) {
        return []
    } else {
        return input.split(',')
    }
}
const compareColumns: Compare<string[]> = (a, b) => {
    return a.join(',') === b.join(',')
}

type Encode<T> = (input: T | undefined) => string | string[]
type Decode<T> = (param: string[] | string | null | undefined) => T
type Compare<T> = (a: T, b: T) => boolean
type Setter<T> = (newValue: T) => void
const buildParam = <T extends {}>(encode: Encode<T>, decode: Decode<T>): QueryParamConfig<T> => ({ encode, decode })

const sortParam = buildParam<Sorting[]>(encodeSort, decodeSort)
const columnsParam = buildParam<string[]>(encodeColumns, decodeColumns)
const filterParam = buildParam<Filter[]>(encodeFilter, decodeFilter)
const numberParam = buildParam<number>(encodeNumber, decodeNumber)

const useEnsuredQueryParam = <T extends unknown>(key: string, config: QueryParamConfig<T>, initialValue: T, compare: Compare<T>): [T, Setter<T>] => {
    const [value, setQueryValue] = useQueryParam<T>(key, config)
    const setValue = useCallback((value: T) => setQueryValue(value, 'pushIn'), [setQueryValue])

    // useQueryParam has issues with memoization, see: https://github.com/pbeshai/use-query-params/issues/20
    const ref = useRef(initialValue)
    if (!value && !compare(ref.current, initialValue)) {
        ref.current = initialValue
    } else if (value && !compare(value, ref.current)) {
        ref.current = value
    }

    return [ref.current, setValue]
}

interface LocationDictionary extends qs.ParsedUrlQuery {
    columns: string
    filter: string
    page: string
    pageSize: string
    sort: string
}

export function useTableState({ initialSort = [], initialFilter = [], initialPage = 0, initialPageSize = 10, filterDebounceTime = 500, initialColumns = [] }: PageStateArgs): TableState {
    const [sort, setSort] = useEnsuredQueryParam<Sorting[]>('sort', sortParam, initialSort, compareSort)
    const [columns, setColumns] = useEnsuredQueryParam<string[]>('columns', columnsParam, initialColumns, compareColumns)
    const [queryFilter, setQueryFilter] = useEnsuredQueryParam<Filter[]>('filter', filterParam, initialFilter, compareFilter)
    const [page, setPage] = useEnsuredQueryParam<number>('page', numberParam, initialPage, compareNumber)
    const [pageSize, setPageSize] = useEnsuredQueryParam<number>('pageSize', numberParam, initialPageSize, compareNumber)

    const [filter, setStateFilter] = useState<Filter[]>(queryFilter)
    const [debouncedSetQueryFilter] = useDebouncedCallback(setQueryFilter, filterDebounceTime)

    const setFilter = (f: Filter[]) => {
        debouncedSetQueryFilter(f)
        setStateFilter(f)
    }

    const deps: DependencyList = [queryFilter, page, pageSize, sort]

    return {
        columns,
        deps,
        debouncedFilter: queryFilter,
        filter,
        page,
        pageSize,
        setColumns,
        setFilter,
        setPage,
        setPageSize,
        setSort,
        sort
    }
}

export function getTableState(tableState: TableState, extensions?: {
    filterExtensions?: FilteringState.ColumnExtension[]
    sortingExtensions?: SortingState.ColumnExtension[]
}) {
    const handleOnSortingChange = (sort: Sorting[]) => {
        tableState.setSort(sort)
        // tableState.setPage(0) TODO: THIS BREAKS IF YOU UNCOMMENT IT
    }

    const handleOnFiltersChange = (filter: Filter[]) => {
        tableState.setFilter(filter)
    }

    return [
        <SortingState
            key="sort"
            columnExtensions={ extensions && extensions.sortingExtensions }
            sorting={ tableState.sort }
            onSortingChange={ handleOnSortingChange }/>,
        <PagingState
            key="page"
            currentPage={ tableState.page }
            pageSize={ tableState.pageSize }
            onCurrentPageChange={ tableState.setPage }
            onPageSizeChange={ tableState.setPageSize }/>,
        <FilteringState
            key="filter"
            columnExtensions={ extensions && extensions.filterExtensions }
            filters={ tableState.filter }
            onFiltersChange={ handleOnFiltersChange }/>
    ]
}

export function isValidPriority(value: string) {
    const num = parseInt(value)
    if (Number.isNaN(num)) {
        return false
    } else {
        return num > -1 && num < 11
    }
}

export function isValidRegex(value: string) {
    const parts = value.split('/')
    let regex = value,
        options = ''
    if (parts.length > 1) {
        regex = parts[1]
        options = parts[2]
    }
    try {
        new RegExp(regex, options)
        return true
    } catch (e) {
        return false
    }
}

type ErrorInput = AsyncBase | [AsyncBase, string]

/**
 * Combine erros
 * @param errors A set of AsyncBase or array like [AsyncBase, errorMessage] items
 */
export function combineErrors(...inputErrors: ErrorInput[]) {
    const errors: Array<[AsyncBase, string]> = inputErrors.map(s => Array.isArray(s) ? s : [s, ''])
    const errorState = errors.find(([state]) => !!state.error)
    const open = !!errorState
    const message = errorState ? (errorState[1] || errorState[0].error!.message) : ''
    const clearError = errorState ? errorState[0].clearError : () => null
    return {
        open,
        message,
        clearError
    }
}

/**
 * Use Permission
 */
export function usePermission(permission: Permission) {
    const user = useContext(UserContext)
    if (user) {
        return user.permissions.includes(permission)
    } else {
        return false
    }
}
