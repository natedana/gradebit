import axios, { AxiosRequestConfig, CancelToken } from 'axios'
// @ts-ignore
import applyConverters from 'axios-case-converter'
import { snake } from 'change-case'

import { CancellablePromise, DataSource, ListParams, Note, File as PjFile, Stakeholder, Todo, User, Vendor, WritableVendor } from 'Types'
import { defaultPageSize } from 'Constants'

axios.defaults.xsrfCookieName = 'csrftoken'
axios.defaults.xsrfHeaderName = 'X-CSRFToken'

export const client = axios.create()

applyConverters(client)

export const getFileDataUrl = (fileId: string, download = false) => `/api/pj/files/${fileId}/data/${download ? '?download' : ''}`

export interface PageData<T> {
    results: Array<Required<T>>
    count: number
}

export const buildParams = (listParams: ListParams, code?: string) => {
    const params: AxiosRequestConfig['params'] = {
        offset: 0,
        limit: defaultPageSize
    }
    if (!listParams) {
        return params
    }
    params.offset = listParams.page * listParams.pageSize,
    params.limit = listParams.pageSize

    if (code) {
        params.code = code
    }

    params.ordering = listParams.sort
        .map(sort => `${sort.direction === 'asc' ? '' : '-'}${snake(sort.columnName)}`)
        .join(',')

    listParams.debouncedFilter.forEach((filter) => {
        params[filter.columnName] = filter.value
    })
    return params
}

interface Request {
    <T>(method: 'get' | 'delete', url: string, config?: AxiosRequestConfig): CancellablePromise<T>
    <T>(method: 'post' | 'patch' | 'put', url: string, data?: any, config?: AxiosRequestConfig): CancellablePromise<T>
    get: <T>(url: string, config?: AxiosRequestConfig) => CancellablePromise<T>
    post: <T>(url: string, data?: any, config?: AxiosRequestConfig) => CancellablePromise<T>
    patch: <T>(url: string, data?: any, config?: AxiosRequestConfig) => CancellablePromise<T>
    put: <T>(url: string, data?: any, config?: AxiosRequestConfig) => CancellablePromise<T>
    delete: <T>(url: string, config?: AxiosRequestConfig) => CancellablePromise<T>
}

type Method = 'get' | 'delete' | 'post' | 'patch' | 'put'

const request: Request = <T extends {}>(method: Method, url: string, data?: any, config?: AxiosRequestConfig) => {
    const cancelSource = axios.CancelToken.source()
    const cancelToken = cancelSource.token
    let response
    if (method === 'get' || method === 'delete') {
        // There is no data, so data is the config
        response = client[method]<T>(url, { cancelToken, ...data })
    } else {
        response = client[method]<T>(url, data, { cancelToken, ...config })
    }

    const promise = (async () => (await response).data)() as CancellablePromise<T>
    promise.cancel = () => cancelSource.cancel()

    return promise
}

request.get = (...args) => request('get', ...args)
request.post = (...args) => request('post', ...args)
request.put = (...args) => request('put', ...args)
request.patch = (...args) => request('patch', ...args)
request.delete = (...args) => request('delete', ...args)

export const signIn = (username: string, password: string) => request.post<User>('/api/auth/login/', { username, password })
export const signOut = () => request.post<User>('/api/auth/logout/')
export const loadUser = () => request.get<User>('/api/auth/me/')

export const retryFile = (pk: string, fragments?: string[]) => request.post(`/api/pj/files/${pk}/retry/`, fragments)
export const retryFiles = (pks: string[]) => request.post('/api/pj/files/retry_bulk/', pks)
export const approveFile = (pk: string) => request.post(`/api/pj/files/${pk}/approve/`)
export const approveFiles = (pks: string[]) => request.post('/api/pj/files/approve_bulk/', pks)
export const rejectFile = (pk: string, message: string) => request.post(`/api/pj/files/${pk}/reject/`, { message })
export const rejectFiles = (pks: string[], message: string) => request.post('/api/pj/files/reject_bulk/', { pks, message })
export const deleteFile = (pk: string) => request.delete(`/api/pj/files/${pk}/`)
export const deleteFiles = (pks: string[]) => request.post('/api/pj/files/delete_bulk/', pks)
export const loadFiles = (listParams: ListParams, code?: string) => request.get<PageData<PjFile>>('/api/pj/files/', { params: buildParams(listParams, code) })
export const loadFile = (fileId: string) => request.get<PjFile>(`/api/pj/files/${fileId}/`)
export const loadFileContent = <T = ArrayBuffer>(fileId: string, responseType: AxiosRequestConfig['responseType'] = 'arraybuffer') =>
    request.get<T>(getFileDataUrl(fileId), { responseType })
export const uploadFiles = (
    files: File[],
    submitter: string,
    vendorCode: string,
    onUploadProgress: (event: any) => void,
    cancelToken: CancelToken
) => {
    const data = new FormData()
    files.forEach(f => {
        data.append('file', f)
    })
    data.append('submitter', submitter)
    data.append('vendorCode', vendorCode)

    return request.post<Array<[string, string]>>('/api/pj/files/upload/', data, {
        cancelToken,
        onUploadProgress
    })
}

export const loadVendors = (listParams: ListParams) => request.get<PageData<Vendor>>('/api/pj/vendors/', { params: buildParams(listParams) })
export const loadVendor = (vendorPk: string) => request.get<Required<Vendor>>(`/api/pj/vendors/${vendorPk}/`)
export const createVendor = (vendor: WritableVendor) => request.post('/api/pj/vendors/', vendor)
export const editVendor = (vendor: WritableVendor) => request.patch(`/api/pj/vendors/${vendor.pk}/`, vendor)
export const validateVendor = (code: string) => request.post('/api/pj/vendors/validate/', { code })

export const loadStakeholders = (listParams: ListParams) => request.get<PageData<Stakeholder>>('/api/pj/stakeholders/', { params: buildParams(listParams) })

export const createDataSource = (ds: DataSource) => request.post('/api/pj/datasources/', ds)
export const editDatasource = (ds: DataSource) => request.patch(`/api/pj/datasources/${ds.pk}/`, ds)
export const loadDataSource = (pk: string) => request.get<Required<DataSource>>(`/api/pj/datasources/${pk}/`)
export const loadDataSources = (listParams: ListParams) => request.get<PageData<DataSource>>('/api/pj/datasources/', { params: buildParams(listParams) })
export const loadSuggestions = (key: string, value: string) => request.post<string[]>('/api/pj/datasources/suggestions/', { key, value })
export const deleteDataSource = (pk: string) => request.delete(`/api/pj/datasources/${pk}/`)
export const deleteDataSources = (pks: string[]) => request.post('/api/pj/datasources/delete_bulk/', pks)

export const loadTodos = () => request.get<Array<Required<Todo>>>('/api/pj/todos/')
export const createTodo = () => request.post('/api/pj/todos/')
export const editTodo = (todo: Todo) => request.patch(`/api/pj/todos/${todo.pk}/`, todo)
export const deleteTodo = (todo: Todo) => request.delete(`/api/pj/todos/${todo.pk}/`)

export const loadNotes = (source: string) => request.get<Array<Required<Note>>>('/api/pj/notes/', { params: { source } })
export const createNote = (note: Partial<Note>, dataSource: string) => request.post('/api/pj/notes/', { ...note, dataSource })
export const editNote = (todo: Required<Note>) => request.patch(`/api/pj/notes/${todo.pk}/`, todo)
export const deleteNote = (todo: Required<Note>) => request.delete(`/api/pj/notes/${todo.pk}/`)
