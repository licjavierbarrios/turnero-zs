// Sistema avanzado de seguridad para Turnero ZS
// Implementa múltiples capas de protección y hardening

import { supabase } from './supabase'

export interface SecurityConfig {
  maxLoginAttempts: number
  lockoutDuration: number
  passwordMinLength: number
  requireStrongPasswords: boolean
  sessionTimeout: number
  enableMFA: boolean
  allowedIPs?: string[]
  blockedIPs: string[]
}

export interface SecurityThreat {
  type: 'brute_force' | 'sql_injection' | 'xss_attempt' | 'unauthorized_access' | 'suspicious_pattern'
  severity: 'low' | 'medium' | 'high' | 'critical'
  source: string
  details: Record<string, any>
  timestamp: string
}

export interface SecurityMetrics {
  threatCount: number
  blockedAttempts: number
  activeThreats: SecurityThreat[]
  riskScore: number
}

class SecurityManager {
  private static instance: SecurityManager
  private config: SecurityConfig
  private threats: SecurityThreat[] = []
  private blockedIPs = new Set<string>()
  private failedAttempts = new Map<string, { count: number; lastAttempt: number }>()

  constructor() {
    this.config = this.getDefaultConfig()
    this.initializeSecurity()
  }

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager()
    }
    return SecurityManager.instance
  }

  private getDefaultConfig(): SecurityConfig {
    return {
      maxLoginAttempts: 5,
      lockoutDuration: 15 * 60 * 1000, // 15 minutes
      passwordMinLength: 12,
      requireStrongPasswords: true,
      sessionTimeout: 8 * 60 * 60 * 1000, // 8 hours
      enableMFA: false, // TODO: Implement MFA
      blockedIPs: []
    }
  }

  private async initializeSecurity(): Promise<void> {
    // Set up periodic security checks
    setInterval(() => this.performSecurityScan(), 5 * 60 * 1000) // Every 5 minutes
    setInterval(() => this.cleanupExpiredBlocks(), 60 * 1000) // Every minute

    // Initialize CSP and security headers
    this.setupSecurityHeaders()

    // Load blocked IPs from database
    await this.loadBlockedIPs()
  }

  private setupSecurityHeaders(): void {
    if (typeof document === 'undefined') return

    // Set security-related meta tags
    const metaTags = [
      { name: 'referrer', content: 'strict-origin-when-cross-origin' },
      { 'http-equiv': 'X-Content-Type-Options', content: 'nosniff' },
      { 'http-equiv': 'X-Frame-Options', content: 'DENY' },
      { 'http-equiv': 'X-XSS-Protection', content: '1; mode=block' }
    ]

    metaTags.forEach(({ name, 'http-equiv': httpEquiv, content }) => {
      const meta = document.createElement('meta')
      if (name) meta.name = name
      if (httpEquiv) meta.httpEquiv = httpEquiv
      meta.content = content
      document.head.appendChild(meta)
    })
  }

  private async loadBlockedIPs(): Promise<void> {
    // TODO: Implementar tabla security_blocks en la base de datos
    // La tabla security_blocks no existe aún, deshabilitado temporalmente
    /*
    try {
      const { data, error } = await supabase
        .from('security_blocks')
        .select('ip_address')
        .eq('is_active', true)  // Cambiado de 'active' a 'is_active'
        .gt('expires_at', new Date().toISOString())

      if (error) throw error

      data?.forEach((block: any) => this.blockedIPs.add(block.ip_address))
    } catch (error) {
      console.error('Failed to load blocked IPs:', error)
    }
    */
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (password.length < this.config.passwordMinLength) {
      errors.push(`La contraseña debe tener al menos ${this.config.passwordMinLength} caracteres`)
    }

    if (this.config.requireStrongPasswords) {
      if (!/[A-Z]/.test(password)) {
        errors.push('La contraseña debe contener al menos una letra mayúscula')
      }
      if (!/[a-z]/.test(password)) {
        errors.push('La contraseña debe contener al menos una letra minúscula')
      }
      if (!/\d/.test(password)) {
        errors.push('La contraseña debe contener al menos un número')
      }
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('La contraseña debe contener al menos un símbolo especial')
      }
    }

    // Check for common weak passwords
    const commonPasswords = [
      'password', '123456', 'qwerty', 'admin', 'letmein',
      'welcome', 'monkey', '1234567890', 'password123'
    ]

    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      errors.push('La contraseña no debe contener palabras comunes')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Check if IP is blocked
   */
  isIPBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip) ||
           this.config.blockedIPs.includes(ip) ||
           (this.config.allowedIPs !== undefined && !this.config.allowedIPs.includes(ip))
  }

  /**
   * Block IP address
   */
  async blockIP(ip: string, reason: string, duration: number = 24 * 60 * 60 * 1000): Promise<void> {
    try {
      this.blockedIPs.add(ip)

      const expiresAt = new Date(Date.now() + duration)

      // TODO: Implementar tabla security_blocks en la base de datos
      // La tabla security_blocks no existe aún, deshabilitado temporalmente
      /*
      await supabase
        .from('security_blocks')
        .insert({
          ip_address: ip,
          reason,
          blocked_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          is_active: true  // Cambiado de 'active' a 'is_active'
        })
      */

      this.reportThreat({
        type: 'unauthorized_access',
        severity: 'high',
        source: ip,
        details: { reason, duration, expires_at: expiresAt },
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to block IP:', error)
    }
  }

  /**
   * Handle login attempt
   */
  async handleLoginAttempt(email: string, ip: string, success: boolean): Promise<{ allowed: boolean; reason?: string }> {
    // Check if IP is blocked
    if (this.isIPBlocked(ip)) {
      return { allowed: false, reason: 'IP address is blocked' }
    }

    const key = `${email}:${ip}`
    const now = Date.now()

    if (!success) {
      // Increment failed attempts
      const attempts = this.failedAttempts.get(key) || { count: 0, lastAttempt: 0 }
      attempts.count++
      attempts.lastAttempt = now
      this.failedAttempts.set(key, attempts)

      // Check if max attempts reached
      if (attempts.count >= this.config.maxLoginAttempts) {
        await this.blockIP(ip, `Too many failed login attempts for ${email}`, this.config.lockoutDuration)

        this.reportThreat({
          type: 'brute_force',
          severity: 'high',
          source: ip,
          details: { email, attempts: attempts.count },
          timestamp: new Date().toISOString()
        })

        return { allowed: false, reason: 'Too many failed attempts. IP blocked.' }
      }

      return { allowed: true }
    } else {
      // Success - clear failed attempts
      this.failedAttempts.delete(key)
      return { allowed: true }
    }
  }

  /**
   * Validate and sanitize input
   */
  sanitizeInput(input: string): string {
    if (typeof input !== 'string') return ''

    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/[<>'"&]/g, (char) => {
        const entities: { [key: string]: string } = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        }
        return entities[char] || char
      })
      .trim()
  }

  /**
   * Check for SQL injection patterns
   */
  detectSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,
      /('|('')|(\-\-)|;|\/\*|\*\/)/gi,
      /(\b(or|and)\b\s+\b(\w+\s*)?\=\s*\b\w+)|\b(or|and)\b\s+\d+\s*\=\s*\d+/gi,
      /\b(having|group\s+by|order\s+by)\b/gi
    ]

    return sqlPatterns.some(pattern => pattern.test(input))
  }

  /**
   * Check for XSS patterns
   */
  detectXSS(input: string): boolean {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
      /vbscript:/gi,
      /data:/gi
    ]

    return xssPatterns.some(pattern => pattern.test(input))
  }

  /**
   * Validate session token
   */
  async validateSession(): Promise<{ valid: boolean; user?: any }> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error || !session) {
        return { valid: false }
      }

      // Check session expiration
      const now = Date.now()
      const sessionStart = new Date(session.expires_at || 0).getTime()

      if (now > sessionStart) {
        await supabase.auth.signOut()
        return { valid: false }
      }

      // Check for session timeout
      const lastActivity = localStorage.getItem('last-activity')
      if (lastActivity) {
        const timeSinceActivity = now - parseInt(lastActivity)
        if (timeSinceActivity > this.config.sessionTimeout) {
          await supabase.auth.signOut()
          return { valid: false }
        }
      }

      // Update last activity
      localStorage.setItem('last-activity', now.toString())

      return { valid: true, user: session.user }
    } catch (error) {
      console.error('Session validation error:', error)
      return { valid: false }
    }
  }

  /**
   * Report security threat
   */
  reportThreat(threat: SecurityThreat): void {
    this.threats.push(threat)

    // Keep only recent threats (last 24 hours)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
    this.threats = this.threats.filter(t =>
      new Date(t.timestamp).getTime() > oneDayAgo
    )

    // Log to audit system
    this.logSecurityEvent(threat)

    // Send alert for high/critical threats
    if (threat.severity === 'high' || threat.severity === 'critical') {
      this.sendSecurityAlert(threat)
    }
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics(): SecurityMetrics {
    const now = Date.now()
    const oneHourAgo = now - 60 * 60 * 1000

    const recentThreats = this.threats.filter(t =>
      new Date(t.timestamp).getTime() > oneHourAgo
    )

    const riskScore = this.calculateRiskScore()

    return {
      threatCount: this.threats.length,
      blockedAttempts: this.blockedIPs.size,
      activeThreats: recentThreats,
      riskScore
    }
  }

  /**
   * Calculate risk score (0-100)
   */
  private calculateRiskScore(): number {
    let score = 0

    // Factor in threat count and severity
    this.threats.forEach(threat => {
      const severityPoints = {
        low: 1,
        medium: 5,
        high: 15,
        critical: 30
      }
      score += severityPoints[threat.severity]
    })

    // Factor in failed attempts
    score += this.failedAttempts.size * 2

    // Factor in blocked IPs
    score += this.blockedIPs.size * 3

    // Cap at 100
    return Math.min(score, 100)
  }

  private async logSecurityEvent(threat: SecurityThreat): Promise<void> {
    try {
      await supabase
        .from('audit_log')
        .insert({
          action: 'SECURITY_THREAT',
          resource_type: 'security',
          new_data: {
            threat_type: threat.type,
            severity: threat.severity,
            source: threat.source,
            details: threat.details
          },
          severity: threat.severity === 'critical' ? 'critical' : 'warning'
        })
    } catch (error) {
      console.error('Failed to log security event:', error)
    }
  }

  private async sendSecurityAlert(threat: SecurityThreat): Promise<void> {
    try {
      // In production, this would send to monitoring service, email, Slack, etc.
      console.warn('🚨 SECURITY ALERT:', {
        type: threat.type,
        severity: threat.severity,
        source: threat.source,
        details: threat.details,
        timestamp: threat.timestamp
      })

      // Log critical alerts
      if (threat.severity === 'critical') {
        await supabase
          .from('security_alerts')
          .insert({
            threat_type: threat.type,
            severity: threat.severity,
            source: threat.source,
            details: threat.details,
            notified_at: new Date().toISOString()
          })
      }
    } catch (error) {
      console.error('Failed to send security alert:', error)
    }
  }

  private async performSecurityScan(): Promise<void> {
    try {
      // Check for suspicious patterns in recent logs
      const { data: recentLogs, error } = await supabase
        .from('audit_log')
        .select('*')
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
        .order('created_at', { ascending: false })
        .limit(1000)

      if (error) throw error

      // Analyze patterns
      const userActions = new Map<string, number>()
      const suspiciousActions = ['DELETE', 'UPDATE', 'EXPORT']

      recentLogs?.forEach((log: any) => {
        if (log.user_id && suspiciousActions.includes(log.action)) {
          userActions.set(log.user_id, (userActions.get(log.user_id) || 0) + 1)
        }
      })

      // Flag users with excessive activity
      userActions.forEach((count, userId) => {
        if (count > 50) {
          this.reportThreat({
            type: 'suspicious_pattern',
            severity: count > 100 ? 'high' : 'medium',
            source: userId,
            details: {
              action_count: count,
              time_window: '1 hour',
              actions: suspiciousActions
            },
            timestamp: new Date().toISOString()
          })
        }
      })
    } catch (error) {
      console.error('Security scan failed:', error)
    }
  }

  private cleanupExpiredBlocks(): void {
    const now = Date.now()

    // Clean up failed attempts
    for (const [key, attempts] of this.failedAttempts.entries()) {
      if (now - attempts.lastAttempt > this.config.lockoutDuration) {
        this.failedAttempts.delete(key)
      }
    }

    // Clean up expired IP blocks (database cleanup is handled by scheduled function)
  }

  /**
   * Encrypt sensitive data
   */
  encryptSensitiveData(data: string, key?: string): string {
    // Simple XOR encryption for demo - use proper encryption in production
    const encryptionKey = key || 'turnero-zs-default-key'
    let encrypted = ''

    for (let i = 0; i < data.length; i++) {
      encrypted += String.fromCharCode(
        data.charCodeAt(i) ^ encryptionKey.charCodeAt(i % encryptionKey.length)
      )
    }

    return btoa(encrypted)
  }

  /**
   * Decrypt sensitive data
   */
  decryptSensitiveData(encryptedData: string, key?: string): string {
    try {
      const encryptionKey = key || 'turnero-zs-default-key'
      const data = atob(encryptedData)
      let decrypted = ''

      for (let i = 0; i < data.length; i++) {
        decrypted += String.fromCharCode(
          data.charCodeAt(i) ^ encryptionKey.charCodeAt(i % encryptionKey.length)
        )
      }

      return decrypted
    } catch (error) {
      console.error('Decryption failed:', error)
      return ''
    }
  }

  /**
   * Generate secure token
   */
  generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let token = ''

    for (let i = 0; i < length; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    return token
  }
}

// Export singleton instance
export const securityManager = SecurityManager.getInstance()

// React hook for security features
export function useSecurity() {
  const validateInput = (input: string) => {
    const sanitized = securityManager.sanitizeInput(input)

    if (securityManager.detectSQLInjection(input)) {
      securityManager.reportThreat({
        type: 'sql_injection',
        severity: 'high',
        source: 'user_input',
        details: { original_input: input.substring(0, 100) },
        timestamp: new Date().toISOString()
      })
      throw new Error('Invalid input detected')
    }

    if (securityManager.detectXSS(input)) {
      securityManager.reportThreat({
        type: 'xss_attempt',
        severity: 'high',
        source: 'user_input',
        details: { original_input: input.substring(0, 100) },
        timestamp: new Date().toISOString()
      })
      throw new Error('Invalid input detected')
    }

    return sanitized
  }

  const validatePassword = (password: string) => {
    return securityManager.validatePassword(password)
  }

  const getSecurityMetrics = () => {
    return securityManager.getSecurityMetrics()
  }

  return {
    validateInput,
    validatePassword,
    getSecurityMetrics
  }
}

export default securityManager