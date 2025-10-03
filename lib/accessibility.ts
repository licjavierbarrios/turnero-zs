// Sistema de accesibilidad avanzado para Turnero ZS
// Implementa WCAG 2.1 AA compliance y mejoras específicas para centros de salud

export interface AccessibilitySettings {
  highContrast: boolean
  largeText: boolean
  screenReader: boolean
  keyboardNavigation: boolean
  reducedMotion: boolean
  focusIndicator: boolean
  announcements: boolean
}

export type AnnouncementType = 'polite' | 'assertive' | 'off'
export type AnnouncementPriority = 'low' | 'medium' | 'high' | 'urgent'

class AccessibilityManager {
  private static instance: AccessibilityManager
  private settings: AccessibilitySettings
  private announcer: HTMLElement | null = null
  private politeAnnouncer: HTMLElement | null = null
  private assertiveAnnouncer: HTMLElement | null = null

  constructor() {
    this.settings = this.loadSettings()
    this.initializeAnnouncers()
    this.applySettings()
    this.setupKeyboardNavigation()
    this.detectScreenReader()
  }

  static getInstance(): AccessibilityManager {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager()
    }
    return AccessibilityManager.instance
  }

  private loadSettings(): AccessibilitySettings {
    if (typeof window === 'undefined') {
      return this.getDefaultSettings()
    }

    try {
      const saved = localStorage.getItem('turnero-accessibility-settings')
      if (saved) {
        return { ...this.getDefaultSettings(), ...JSON.parse(saved) }
      }
    } catch (error) {
      console.warn('Failed to load accessibility settings:', error)
    }

    return this.getDefaultSettings()
  }

  private getDefaultSettings(): AccessibilitySettings {
    return {
      highContrast: false,
      largeText: false,
      screenReader: false,
      keyboardNavigation: true,
      reducedMotion: false,
      focusIndicator: true,
      announcements: true
    }
  }

  private saveSettings(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('turnero-accessibility-settings', JSON.stringify(this.settings))
      } catch (error) {
        console.warn('Failed to save accessibility settings:', error)
      }
    }
  }

  private initializeAnnouncers(): void {
    if (typeof document === 'undefined') return

    // Create polite announcer
    this.politeAnnouncer = document.createElement('div')
    this.politeAnnouncer.setAttribute('aria-live', 'polite')
    this.politeAnnouncer.setAttribute('aria-atomic', 'true')
    this.politeAnnouncer.className = 'sr-only'
    this.politeAnnouncer.id = 'polite-announcer'

    // Create assertive announcer
    this.assertiveAnnouncer = document.createElement('div')
    this.assertiveAnnouncer.setAttribute('aria-live', 'assertive')
    this.assertiveAnnouncer.setAttribute('aria-atomic', 'true')
    this.assertiveAnnouncer.className = 'sr-only'
    this.assertiveAnnouncer.id = 'assertive-announcer'

    document.body.appendChild(this.politeAnnouncer)
    document.body.appendChild(this.assertiveAnnouncer)
  }

  private applySettings(): void {
    if (typeof document === 'undefined') return

    const root = document.documentElement

    // High contrast mode
    root.classList.toggle('high-contrast', this.settings.highContrast)

    // Large text mode
    root.classList.toggle('large-text', this.settings.largeText)

    // Reduced motion
    root.classList.toggle('reduced-motion', this.settings.reducedMotion)

    // Focus indicators
    root.classList.toggle('enhanced-focus', this.settings.focusIndicator)

    // Apply CSS custom properties for dynamic theming
    root.style.setProperty('--text-scale', this.settings.largeText ? '1.25' : '1')
    root.style.setProperty('--focus-width', this.settings.focusIndicator ? '3px' : '2px')
    root.style.setProperty('--animation-duration', this.settings.reducedMotion ? '0.01ms' : '200ms')
  }

  private setupKeyboardNavigation(): void {
    if (typeof document === 'undefined') return

    // Skip links for main navigation
    this.createSkipLinks()

    // Enhanced focus management
    document.addEventListener('keydown', (event) => {
      if (!this.settings.keyboardNavigation) return

      // Escape key handling
      if (event.key === 'Escape') {
        this.handleEscapeKey()
      }

      // Arrow key navigation for tables and lists
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        this.handleArrowKeyNavigation(event)
      }

      // F6 for region navigation
      if (event.key === 'F6') {
        event.preventDefault()
        this.navigateToNextRegion(event.shiftKey)
      }
    })

    // Focus trap for modals
    document.addEventListener('focusin', (event) => {
      if (this.isInModal(event.target as Element)) {
        this.trapFocusInModal(event)
      }
    })
  }

  private createSkipLinks(): void {
    if (typeof document === 'undefined') return

    const skipLinksContainer = document.createElement('div')
    skipLinksContainer.className = 'skip-links'
    skipLinksContainer.innerHTML = `
      <a href="#main-content" class="skip-link">Saltar al contenido principal</a>
      <a href="#navigation" class="skip-link">Saltar a la navegación</a>
      <a href="#search" class="skip-link">Saltar a la búsqueda</a>
    `

    document.body.insertAdjacentElement('afterbegin', skipLinksContainer)
  }

  private handleEscapeKey(): void {
    // Close modals, dropdowns, etc.
    const openDialog = document.querySelector('[role="dialog"][open]')
    const openDropdown = document.querySelector('[aria-expanded="true"]')

    if (openDialog) {
      const closeButton = openDialog.querySelector('[data-close]') as HTMLElement
      closeButton?.click()
    } else if (openDropdown) {
      openDropdown.setAttribute('aria-expanded', 'false')
    }
  }

  private handleArrowKeyNavigation(event: KeyboardEvent): void {
    const target = event.target as HTMLElement

    // Navigation within tables
    if (target.closest('table')) {
      this.navigateTable(event)
    }

    // Navigation within lists
    if (target.closest('[role="listbox"], [role="menu"]')) {
      this.navigateList(event)
    }
  }

  private navigateTable(event: KeyboardEvent): void {
    const cell = (event.target as HTMLElement).closest('td, th') as HTMLTableCellElement
    if (!cell) return

    const row = cell.parentElement as HTMLTableRowElement
    const table = row.closest('table') as HTMLTableElement
    const rows = Array.from(table.querySelectorAll('tr'))
    const cells = Array.from(row.cells)

    const currentRowIndex = rows.indexOf(row)
    const currentCellIndex = cells.indexOf(cell)

    let nextElement: HTMLElement | null = null

    switch (event.key) {
      case 'ArrowUp':
        if (currentRowIndex > 0) {
          const nextRow = rows[currentRowIndex - 1]
          nextElement = nextRow.cells[currentCellIndex] as HTMLElement
        }
        break
      case 'ArrowDown':
        if (currentRowIndex < rows.length - 1) {
          const nextRow = rows[currentRowIndex + 1]
          nextElement = nextRow.cells[currentCellIndex] as HTMLElement
        }
        break
      case 'ArrowLeft':
        if (currentCellIndex > 0) {
          nextElement = cells[currentCellIndex - 1] as HTMLElement
        }
        break
      case 'ArrowRight':
        if (currentCellIndex < cells.length - 1) {
          nextElement = cells[currentCellIndex + 1] as HTMLElement
        }
        break
    }

    if (nextElement) {
      event.preventDefault()
      const focusable = nextElement.querySelector('button, a, input, [tabindex]') as HTMLElement
      ;(focusable || nextElement).focus()
    }
  }

  private navigateList(event: KeyboardEvent): void {
    const currentItem = (event.target as HTMLElement).closest('[role="option"], [role="menuitem"]')
    if (!currentItem) return

    const list = currentItem.closest('[role="listbox"], [role="menu"]')
    if (!list) return

    const items = Array.from(list.querySelectorAll('[role="option"], [role="menuitem"]'))
    const currentIndex = items.indexOf(currentItem)

    let nextIndex: number = -1

    switch (event.key) {
      case 'ArrowUp':
        nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1
        break
      case 'ArrowDown':
        nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0
        break
    }

    if (nextIndex !== -1) {
      event.preventDefault()
      ;(items[nextIndex] as HTMLElement).focus()
    }
  }

  private navigateToNextRegion(reverse: boolean = false): void {
    const regions = Array.from(document.querySelectorAll('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], [role="complementary"]'))
    const currentFocus = document.activeElement
    const currentRegion = currentFocus?.closest('[role]')

    if (currentRegion) {
      const currentIndex = regions.indexOf(currentRegion)
      const nextIndex = reverse
        ? (currentIndex - 1 + regions.length) % regions.length
        : (currentIndex + 1) % regions.length

      const nextRegion = regions[nextIndex] as HTMLElement
      const firstFocusable = nextRegion.querySelector('button, a, input, [tabindex]:not([tabindex="-1"])') as HTMLElement
      ;(firstFocusable || nextRegion).focus()
    }
  }

  private isInModal(element: Element): boolean {
    return !!element.closest('[role="dialog"], .modal, [data-modal]')
  }

  private trapFocusInModal(event: FocusEvent): void {
    const modal = (event.target as Element).closest('[role="dialog"], .modal, [data-modal]')
    if (!modal) return

    const focusableElements = modal.querySelectorAll(
      'button:not([disabled]), [href]:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
    )

    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    // Trap focus within modal
    if (event.target === lastElement && event.relatedTarget === firstElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }

  private detectScreenReader(): void {
    if (typeof navigator === 'undefined') return

    // Detect screen readers through various methods
    const hasScreenReader =
      navigator.userAgent.includes('NVDA') ||
      navigator.userAgent.includes('JAWS') ||
      navigator.userAgent.includes('VoiceOver') ||
      'speechSynthesis' in window

    if (hasScreenReader) {
      this.updateSetting('screenReader', true)
      this.updateSetting('announcements', true)
    }
  }

  // Public methods
  updateSetting<K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ): void {
    this.settings[key] = value
    this.applySettings()
    this.saveSettings()

    // Announce setting change
    this.announce(`${key} ${value ? 'activado' : 'desactivado'}`, 'medium', 'polite')
  }

  getSettings(): AccessibilitySettings {
    return { ...this.settings }
  }

  announce(
    message: string,
    priority: AnnouncementPriority = 'medium',
    type: AnnouncementType = 'polite'
  ): void {
    if (!this.settings.announcements) return

    const announcer = type === 'assertive' ? this.assertiveAnnouncer : this.politeAnnouncer
    if (!announcer) return

    // Clear previous announcement
    announcer.textContent = ''

    // Add priority prefix for screen readers
    const priorityPrefix = {
      low: '',
      medium: '',
      high: 'Importante: ',
      urgent: 'Urgente: '
    }[priority]

    // Set new announcement with slight delay to ensure it's read
    setTimeout(() => {
      announcer.textContent = priorityPrefix + message
    }, 100)

    // Clear after announcement is likely read
    setTimeout(() => {
      announcer.textContent = ''
    }, 5000)
  }

  announcePatientCall(patientName: string, roomName?: string): void {
    const message = roomName
      ? `Paciente ${patientName}, diríjase al consultorio ${roomName}`
      : `Paciente ${patientName}, por favor acercarse a recepción`

    this.announce(message, 'urgent', 'assertive')
  }

  announceAppointmentUpdate(status: string, patientName?: string): void {
    const statusMessages = {
      'esperando': 'Turno registrado, en espera',
      'llamado': 'Paciente llamado',
      'en_consulta': 'Paciente en consulta',
      'finalizado': 'Consulta finalizada',
      'cancelado': 'Turno cancelado',
      'ausente': 'Paciente ausente'
    }

    const message = patientName
      ? `${patientName}: ${statusMessages[status as keyof typeof statusMessages]}`
      : statusMessages[status as keyof typeof statusMessages]

    this.announce(message, 'medium', 'polite')
  }

  announceFormValidation(field: string, error: string): void {
    this.announce(`Error en ${field}: ${error}`, 'high', 'assertive')
  }

  announceNavigation(pageName: string): void {
    this.announce(`Navegando a ${pageName}`, 'low', 'polite')
  }

  announceDataUpdate(type: string, count: number): void {
    this.announce(`${type} actualizado, ${count} elementos`, 'low', 'polite')
  }

  // Utility methods for components
  addAriaLabel(element: HTMLElement, label: string): void {
    element.setAttribute('aria-label', label)
  }

  addAriaDescription(element: HTMLElement, description: string): void {
    const descriptionId = `desc-${Math.random().toString(36).substr(2, 9)}`

    const descElement = document.createElement('div')
    descElement.id = descriptionId
    descElement.className = 'sr-only'
    descElement.textContent = description

    element.parentElement?.appendChild(descElement)
    element.setAttribute('aria-describedby', descriptionId)
  }

  makeTableAccessible(table: HTMLTableElement): void {
    // Add table caption if missing
    if (!table.querySelector('caption')) {
      const caption = document.createElement('caption')
      caption.textContent = 'Tabla de datos'
      caption.className = 'sr-only'
      table.insertAdjacentElement('afterbegin', caption)
    }

    // Add scope attributes to headers
    const headers = table.querySelectorAll('th')
    headers.forEach((header) => {
      if (!header.getAttribute('scope')) {
        const isRowHeader = header.closest('tr')?.querySelector('th') === header
        header.setAttribute('scope', isRowHeader ? 'row' : 'col')
      }
    })

    // Add row and column counts
    const rows = table.querySelectorAll('tr').length
    const cols = table.querySelector('tr')?.querySelectorAll('th, td').length || 0

    table.setAttribute('aria-rowcount', rows.toString())
    table.setAttribute('aria-colcount', cols.toString())
  }
}

// Export singleton instance
export const accessibilityManager = AccessibilityManager.getInstance()

// Accessibility utility functions
export const a11yUtils = {
  // Generate unique IDs for ARIA relationships
  generateId: (prefix: string = 'a11y'): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
  },

  // Create accessible loading state
  createLoadingState: (message: string = 'Cargando'): HTMLElement => {
    const loader = document.createElement('div')
    loader.setAttribute('role', 'status')
    loader.setAttribute('aria-live', 'polite')
    loader.setAttribute('aria-label', message)
    loader.textContent = message
    return loader
  },

  // Ensure color contrast meets WCAG standards
  checkColorContrast: (foreground: string, background: string): boolean => {
    // Simplified contrast check - in production, use a proper color contrast library
    const getLuminance = (hex: string): number => {
      const rgb = parseInt(hex.slice(1), 16)
      const r = (rgb >> 16) & 0xff
      const g = (rgb >> 8) & 0xff
      const b = (rgb >> 0) & 0xff

      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
      return luminance
    }

    const foregroundLum = getLuminance(foreground)
    const backgroundLum = getLuminance(background)

    const ratio = (Math.max(foregroundLum, backgroundLum) + 0.05) / (Math.min(foregroundLum, backgroundLum) + 0.05)

    return ratio >= 4.5 // WCAG AA standard
  }
}

export default accessibilityManager