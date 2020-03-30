import mockAxios from 'jest-mock-axios'

const axios = mockAxios as any

axios.defaults.transformRequest = []
axios.defaults.transformResponse = []

axios.isCancel = () => {
    return false
}

axios.CancelToken = {
    source() {
        return {
            token: 'token',
            cancel() {
                return
            }
        }
    }
}

export default mockAxios
