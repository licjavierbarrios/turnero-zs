import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  test('should render button with text', () => {
    render(<Button>Click me</Button>)

    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
  })

  test('should handle click events', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(<Button onClick={handleClick}>Click me</Button>)

    const button = screen.getByRole('button', { name: /click me/i })
    await user.click(button)

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  test('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>)

    const button = screen.getByRole('button', { name: /disabled button/i })
    expect(button).toBeDisabled()
  })

  test('should not trigger click when disabled', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>
    )

    const button = screen.getByRole('button', { name: /disabled/i })
    await user.click(button)

    expect(handleClick).not.toHaveBeenCalled()
  })

  test('should render with different variants', () => {
    const { rerender } = render(<Button variant="default">Default</Button>)
    let button = screen.getByRole('button')
    expect(button).toBeInTheDocument()

    rerender(<Button variant="destructive">Destructive</Button>)
    button = screen.getByRole('button')
    expect(button).toBeInTheDocument()

    rerender(<Button variant="outline">Outline</Button>)
    button = screen.getByRole('button')
    expect(button).toBeInTheDocument()

    rerender(<Button variant="secondary">Secondary</Button>)
    button = screen.getByRole('button')
    expect(button).toBeInTheDocument()

    rerender(<Button variant="ghost">Ghost</Button>)
    button = screen.getByRole('button')
    expect(button).toBeInTheDocument()

    rerender(<Button variant="link">Link</Button>)
    button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  test('should render with different sizes', () => {
    const { rerender } = render(<Button size="default">Default</Button>)
    let button = screen.getByRole('button')
    expect(button).toBeInTheDocument()

    rerender(<Button size="sm">Small</Button>)
    button = screen.getByRole('button')
    expect(button).toBeInTheDocument()

    rerender(<Button size="lg">Large</Button>)
    button = screen.getByRole('button')
    expect(button).toBeInTheDocument()

    rerender(<Button size="icon">Icon</Button>)
    button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  test('should render as child component when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    )

    const link = screen.getByRole('link', { name: /link button/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/test')
  })

  test('should pass through additional props', () => {
    render(
      <Button data-testid="custom-button" aria-label="Custom button">
        Custom
      </Button>
    )

    const button = screen.getByTestId('custom-button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('aria-label', 'Custom button')
  })

  test('should apply custom className', () => {
    render(<Button className="custom-class">Custom Class</Button>)

    const button = screen.getByRole('button', { name: /custom class/i })
    expect(button).toHaveClass('custom-class')
  })
})
