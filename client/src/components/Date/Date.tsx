import React from 'react'

interface DateProps {
    date: string | Date
    verbose?: boolean
}

const DateComponent = ({ date, verbose }: DateProps) => {
    const d = new Date(date)
    return (
        <span>{ d.toDateString() } { verbose && d.toLocaleTimeString() }</span>
    )
}

export default DateComponent
