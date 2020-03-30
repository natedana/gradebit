import React from 'react'
import mime from 'mime-types'

import External from './External'
import Archive from './Archive'
import CSV from './CSV'

import { File } from 'Types'

interface PreviewProps {
    file: File
}

const typeMap: Array<[RegExp, React.ComponentType<{ file: File }>]> = [
    [/\/(zip|x-tar)/, Archive],
    [/(csv|tsv)/, CSV],
    [/.*/, External]
]

const Preview = ({ file }: PreviewProps) => {
    const contentType = mime.lookup(file.name)

    const Component = contentType && typeMap.find(([re]) => re.test(contentType))![1]

    if (!Component) {
        return null
    }

    return <Component file={ file }/>
}

export default Preview
