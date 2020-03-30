import { getByText, Matcher } from '@testing-library/react'

export function getInputByLabel(container: HTMLElement, textMatch: Matcher) {
    const label = getByText(container, textMatch)
    const input = container.querySelector(`#${label.getAttribute('for')}`)
    expect(input).toBeTruthy()
    return input!
}
