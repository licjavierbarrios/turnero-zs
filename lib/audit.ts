import React from 'react'
import { supabase } from './supabase'

export type AuditAction =
  | 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'LOGIN' | 'LOGOUT'
  | 'EXPORT' | 'SEARCH' | 'CALL_PATIENT' | 'CHECKIN' | 'CANCEL_APPOINTMENT'
  | 'GENERATE_SLOTS' | 'VIEW_REPORTS' | 'UNAUTHORIZED_ACCESS'

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical'

export type ResourceType =
  | 'appointment' | 'patient' | 'professional' | 'service' | 'room'
  | 'slot_template' | 'user' | 'report' | 'system' | 'auth'

export interface AuditEntry {
  id?: string
  user_id?: string
  action: AuditAction
  resource_type: ResourceType
  resource_id?: string
  old_data?: Record<string, any>
  new_data?: Record<string, any>
  ip_address?: string
  user_agent?: string
  institution_id?: string
  severity?: AuditSeverity
  created_at?: string
  details?: string
}

export interface SecurityEvent {
  type: 'RATE_LIMIT_EXCEEDED' | 'SUSPICIOUS_ACTIVITY' | 'UNAUTHORIZED_ACCESS' | 'DATA_BREACH_ATTEMPT'
  user_id?: string
  details: Record<string, any>
  severity: AuditSeverity
}

class AuditLogger {
  private static instance: AuditLogger
  private pendingLogs: AuditEntry[] = []
  private batchSize = 10
  private flushInterval = 5000 // 5 seconds

  constructor() {
    if (typeof window !== 'undefined') {
      // Flush logs periodically
      setInterval(() => this.flush(), this.flushInterval)

      // Flush logs before page unload
      window.addEventListener('beforeunload', () => this.flush())

      // Monitor console errors
      const originalError = console.error
      console.error = (...args) => {
        this.logError('CONSOLE_ERROR', args.join(' '))
        originalError.apply(console, args)
      }
    }
  }

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger()
    }
    return AuditLogger.instance
  }

  /**
   * Log an audit event
   */
  async log(entry: Omit<AuditEntry, 'id' | 'created_at'>): Promise<void> {
    try {
      const enrichedEntry: AuditEntry = {
        ...entry,
        ip_address: await this.getClientIP(),
        user_agent: this.getUserAgent(),
        severity: entry.severity || 'info',
        created_at: new Date().toISOString()
      }

      this.pendingLogs.push(enrichedEntry)

      // Flush immediately for high severity events
      if (entry.severity === 'critical' || entry.severity === 'error') {
        await this.flush()
      } else if (this.pendingLogs.length >= this.batchSize) {
        await this.flush()
      }
    } catch (error) {
      console.error('Failed to log audit entry:', error)
    }
  }

  /**
   * Log security event
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    await this.log({
      action: 'UNAUTHORIZED_ACCESS',
      resource_type: 'system',
      new_data: {
        security_event: event.type,
        details: event.details
      },
      user_id: event.user_id,
      severity: event.severity
    })

    // For critical security events, also send to monitoring service
    if (event.severity === 'critical') {
      await this.sendToMonitoring(event)
    }
  }

  /**
   * Log user action with context
   */
  async logUserAction(
    action: AuditAction,
    resourceType: ResourceType,
    resourceId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()

    await this.log({
      user_id: user?.id,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      new_data: details,
      severity: 'info'
    })
  }

  /**
   * Log data change with before/after values
   */
  async logDataChange(
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    resourceType: ResourceType,
    resourceId: string,
    oldData?: Record<string, any>,
    newData?: Record<string, any>,
    institutionId?: string
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()

    await this.log({
      user_id: user?.id,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      old_data: oldData,
      new_data: newData,
      institution_id: institutionId,
      severity: action === 'DELETE' ? 'warning' : 'info'
    })
  }

  /**
   * Log authentication events
   */
  async logAuth(action: 'LOGIN' | 'LOGOUT', userId?: string, success: boolean = true): Promise<void> {
    await this.log({
      user_id: userId,
      action,
      resource_type: 'auth',
      new_data: { success },
      severity: success ? 'info' : 'warning'
    })
  }

  /**
   * Log errors
   */
  async logError(source: string, error: string, context?: Record<string, any>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()

    await this.log({
      user_id: user?.id,
      action: 'VIEW',
      resource_type: 'system',
      new_data: {
        error_source: source,
        error_message: error,
        context
      },
      severity: 'error'
    })
  }

  /**
   * Log report access and exports
   */
  async logReportAccess(reportType: string, filters?: Record<string, any>, exported: boolean = false): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()

    await this.log({
      user_id: user?.id,
      action: exported ? 'EXPORT' : 'VIEW_REPORTS',
      resource_type: 'report',
      new_data: {
        report_type: reportType,
        filters,
        exported
      },
      severity: 'info'
    })
  }

  /**
   * Flush pending logs to database
   */
  private async flush(): Promise<void> {
    if (this.pendingLogs.length === 0) return

    const logsToFlush = [...this.pendingLogs]
    this.pendingLogs = []

    try {
      const { error } = await supabase
        .from('audit_log')
        .insert(logsToFlush)

      if (error) {
        console.error('Failed to flush audit logs:', error)
        // Put logs back in queue for retry
        this.pendingLogs.unshift(...logsToFlush)
      }
    } catch (error) {
      console.error('Failed to flush audit logs:', error)
      this.pendingLogs.unshift(...logsToFlush)
    }
  }

  /**
   * Get client IP address
   */
  private async getClientIP(): Promise<string | undefined> {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch {
      return undefined
    }
  }

  /**
   * Get user agent
   */
  private getUserAgent(): string | undefined {
    return typeof window !== 'undefined' ? window.navigator.userAgent : undefined
  }

  /**
   * Send critical events to external monitoring
   */
  private async sendToMonitoring(event: SecurityEvent): Promise<void> {
    try {
      // In production, this would send to services like Sentry, DataDog, etc.
      console.warn('CRITICAL SECURITY EVENT:', event)

      // Could also send webhook to security team
      // await fetch('/api/security-alert', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event)
      // })
    } catch (error) {
      console.error('Failed to send to monitoring:', error)
    }
  }
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance()

// Rate limiting helper
export class RateLimiter {
  private static limits = new Map<string, { count: number; resetTime: number }>()

  static check(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now()
    const limit = this.limits.get(key)

    if (!limit || now > limit.resetTime) {
      this.limits.set(key, { count: 1, resetTime: now + windowMs })
      return true
    }

    if (limit.count >= maxRequests) {
      // Log rate limit exceeded
      auditLogger.logSecurityEvent({
        type: 'RATE_LIMIT_EXCEEDED',
        details: { key, maxRequests, windowMs, currentCount: limit.count },
        severity: 'warning'
      })
      return false
    }

    limit.count++
    return true
  }
}

// Security monitoring utilities
export const SecurityMonitor = {
  /**
   * Monitor for suspicious patterns
   */
  async detectAnomalies(): Promise<void> {
    try {
      const { data: recentActivity, error } = await supabase
        .from('audit_log')
        .select('user_id, action, created_at')
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
        .order('created_at', { ascending: false })

      if (error) throw error

      // Detect rapid-fire actions from same user
      const userActions = new Map<string, number>()
      recentActivity?.forEach((log: any) => {
        if (log.user_id) {
          userActions.set(log.user_id, (userActions.get(log.user_id) || 0) + 1)
        }
      })

      // Flag users with excessive activity
      for (const [userId, count] of userActions.entries()) {
        if (count > 50) {
          await auditLogger.logSecurityEvent({
            type: 'SUSPICIOUS_ACTIVITY',
            user_id: userId,
            details: { action_count: count, time_window: '1 hour' },
            severity: count > 100 ? 'critical' : 'warning'
          })
        }
      }
    } catch (error) {
      console.error('Failed to detect anomalies:', error)
    }
  },

  /**
   * Check for unauthorized access attempts
   */
  async checkUnauthorizedAccess(): Promise<void> {
    try {
      const { data: errorLogs, error } = await supabase
        .from('audit_log')
        .select('user_id, new_data, created_at')
        .eq('severity', 'error')
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())

      if (error) throw error

      const unauthorizedAttempts = errorLogs?.filter((log: any) =>
        log.new_data?.error_message?.includes('unauthorized') ||
        log.new_data?.error_message?.includes('permission denied')
      )

      if (unauthorizedAttempts && unauthorizedAttempts.length > 5) {
        await auditLogger.logSecurityEvent({
          type: 'UNAUTHORIZED_ACCESS',
          details: { attempts: unauthorizedAttempts.length },
          severity: 'warning'
        })
      }
    } catch (error) {
      console.error('Failed to check unauthorized access:', error)
    }
  }
}

// Enhanced error boundary for React components
export const withAuditLogging = <T extends Record<string, any>>(
  WrappedComponent: React.ComponentType<T>
) => {
  return function AuditedComponent(props: T) {
    const componentName = WrappedComponent.displayName || WrappedComponent.name || 'Component'

    React.useEffect(() => {
      const handleError = (event: ErrorEvent) => {
        auditLogger.logError(`React:${componentName}`, event.message, {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        })
      }

      window.addEventListener('error', handleError)
      return () => window.removeEventListener('error', handleError)
    }, [componentName])

    return React.createElement(WrappedComponent, props)
  }
}

export default auditLogger