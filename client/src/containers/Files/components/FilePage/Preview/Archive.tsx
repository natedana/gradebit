import React, { useEffect, useState } from 'react'
import JSZip from 'jszip'
import filesize from 'filesize'
import tar from 'tar-stream'

import { DataTypeProvider, FilteringState,
    IntegratedFiltering, IntegratedPaging, IntegratedSorting, PagingState, SortingState } from '@devexpress/dx-react-grid'
import { Grid as DevExGrid, PagingPanel, Table, TableFilterRow, TableHeaderRow } from '@devexpress/dx-react-grid-material-ui'

import { loadFileContent } from 'Api'
import { useApiData } from 'Util'

import { File } from 'Types'

interface ArchiveProps {
    file: File
}

interface FileMetadata {
    name: string
    size?: number
}
const Archive = ({ file }: ArchiveProps) => {
    const [filesMeta, setFilesMeta] = useState<FileMetadata[]>([])
    const content = useApiData(() => loadFileContent(file.pk), [file.pk])

    useEffect(() => {
        const load = async () => {
            if (content.data) {
                if (/\.zip$/.test(file.name)) {
                    const zip = await JSZip.loadAsync(content.data)
                    setFilesMeta(Object.values(zip.files)
                        .filter(f => !f.dir)
                        .map(f => ({ name: f.name, size: (f as any)._data.uncompressedSize }))
                    )
                } else if (/\.tar?/.test(file.name)) {
                    const tarHeaders: tar.Headers[] = []
                    const extract = (tar.extract() as tar.Extract)
                    extract.on('entry', (header, stream, next) => {
                        tarHeaders.push(header)
                        stream.on('end', () => {
                            next()
                        })
                        stream.resume()
                    })
                    extract.on('finish', () => {
                        setFilesMeta(tarHeaders
                            .filter(f => f.type !== 'directory')
                            .map(({ name, size }) => ({ name, size }))
                        )
                    })
                    extract.end(Buffer.from(content.data))
                }
            }
        }

        load()
    }, [content.data, file])

    const columns = [
        { name: 'name', title: 'Name' },
        { name: 'size', title: 'Size' }
    ]

    return (
        <DevExGrid
            rows={ filesMeta }
            columns={ columns }>
            <SortingState defaultSorting={ [{ columnName: 'name', direction: 'asc' }] }/>
            <PagingState
                defaultCurrentPage={ 0 }
                pageSize={ 25 }/>
            <IntegratedSorting/>
            <IntegratedPaging/>
            <FilteringState defaultFilters={ [] }/>
            <IntegratedFiltering/>
            <DataTypeProvider for={ ['size'] } formatterComponent={ props => <span>{ filesize(props.value) }</span> }/>
            <Table/>
            <TableHeaderRow showSortingControls/>
            <TableFilterRow/>
            <PagingPanel/>
        </DevExGrid>
    )
}

export default Archive
