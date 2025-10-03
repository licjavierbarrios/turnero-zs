'use client'

import { useEffect, useCallback } from 'react'
import { useUserMembership } from './useUserMembership'
import { auditLogger, AuditAction, ResourceType, SecurityMonitor } from '@/lib/audit'

export function useAuditLogging() {
  const { userMembership } = useUserMembership()

  // Initialize security monitoring
  useEffect(() => {
    if (userMembership) {
      // Log user session start
      auditLogger.logAuth('LOGIN', userMembership.user_id, true)

      // Start security monitoring (run every 5 minutes)
      const monitoringInterval = setInterval(async () => {
        await SecurityMonitor.detectAnomalies()
        await SecurityMonitor.checkUnauthorizedAccess()
      }, 5 * 60 * 1000) // 5 minutes

      // Cleanup on unmount
      return () => {
        clearInterval(monitoringInterval)
        auditLogger.logAuth('LOGOUT', userMembership.user_id, true)
      }
    }
  }, [userMembership])

  // Log page views
  const logPageView = useCallback((pagePath: string) => {
    auditLogger.logUserAction('VIEW', 'system', undefined, {
      page_path: pagePath,
      institution_id: userMembership?.institution_id
    })
  }, [userMembership])

  // Log appointment actions
  const logAppointmentAction = useCallback((
    action: AuditAction,
    appointmentId: string,
    details?: Record<string, any>
  ) => {
    auditLogger.logUserAction(action, 'appointment', appointmentId, {
      ...details,
      institution_id: userMembership?.institution_id
    })
  }, [userMembership])

  // Log patient actions (with privacy considerations)
  const logPatientAction = useCallback((
    action: AuditAction,
    patientId: string,
    details?: Record<string, any>
  ) => {
    // Don't log sensitive patient data, only actions
    auditLogger.logUserAction(action, 'patient', patientId, {
      action_type: details?.action_type,
      institution_id: userMembership?.institution_id
      // Explicitly exclude patient personal data
    })
  }, [userMembership])

  // Log report access
  const logReportAccess = useCallback((
    reportType: string,
    filters?: Record<string, any>,
    exported: boolean = false
  ) => {
    auditLogger.logReportAccess(reportType, {
      ...filters,
      institution_id: userMembership?.institution_id
    }, exported)
  }, [userMembership])

  // Log search actions
  const logSearch = useCallback((
    searchType: string,
    query: string,
    resultsCount: number
  ) => {
    auditLogger.logUserAction('SEARCH', 'system', undefined, {
      search_type: searchType,
      query_length: query.length, // Don't log actual query for privacy
      results_count: resultsCount,
      institution_id: userMembership?.institution_id
    })
  }, [userMembership])

  // Log critical actions with enhanced details
  const logCriticalAction = useCallback((
    action: AuditAction,
    resourceType: ResourceType,
    resourceId: string,
    details: Record<string, any>
  ) => {
    auditLogger.log({
      user_id: userMembership?.user_id,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      new_data: {
        ...details,
        institution_id: userMembership?.institution_id,
        user_role: userMembership?.role
      },
      institution_id: userMembership?.institution_id,
      severity: 'warning'
    })
  }, [userMembership])

  // Log data changes (create, update, delete)
  const logDataChange = useCallback((
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    resourceType: ResourceType,
    resourceId: string,
    oldData?: Record<string, any>,
    newData?: Record<string, any>
  ) => {
    auditLogger.logDataChange(
      action,
      resourceType,
      resourceId,
      oldData,
      newData,
      userMembership?.institution_id
    )
  }, [userMembership])

  // Log errors with context
  const logError = useCallback((
    source: string,
    error: string,
    context?: Record<string, any>
  ) => {
    auditLogger.logError(source, error, {
      ...context,
      institution_id: userMembership?.institution_id,
      user_role: userMembership?.role
    })
  }, [userMembership])

  return {
    logPageView,
    logAppointmentAction,
    logPatientAction,
    logReportAccess,
    logSearch,
    logCriticalAction,
    logDataChange,
    logError
  }
}

// Hook for monitoring performance
export function usePerformanceMonitoring() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Monitor page load performance
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navigationEntry = entry as PerformanceNavigationTiming

            // Log slow page loads
            if (navigationEntry.loadEventEnd - navigationEntry.fetchStart > 5000) {
              auditLogger.logError('PERFORMANCE', 'Slow page load detected', {
                load_time: navigationEntry.loadEventEnd - navigationEntry.fetchStart,
                page: window.location.pathname
              })
            }
          }

          if (entry.entryType === 'largest-contentful-paint') {
            // Log poor LCP scores
            if (entry.startTime > 4000) {
              auditLogger.logError('PERFORMANCE', 'Poor LCP score', {
                lcp_time: entry.startTime,
                page: window.location.pathname
              })
            }
          }
        })
      })

      observer.observe({ entryTypes: ['navigation', 'largest-contentful-paint'] })

      return () => observer.disconnect()
    }
  }, [])
}

// Hook for security event monitoring
export function useSecurityMonitoring() {
  const { logError } = useAuditLogging()

  useEffect(() => {
    // Monitor for potential XSS attempts
    const originalDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML') ||
                              Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'innerHTML')

    if (originalDescriptor && originalDescriptor.set) {
      Object.defineProperty(Element.prototype, 'innerHTML', {
        set: function(value: string) {
          if (typeof value === 'string' && (
            value.includes('<script>') ||
            value.includes('javascript:') ||
            value.includes('onload=') ||
            value.includes('onerror=')
          )) {
            logError('SECURITY', 'Potential XSS attempt detected', {
              element: this.tagName,
              attempted_content: value.substring(0, 100) // First 100 chars only
            })
          }
          return originalDescriptor.set!.call(this, value)
        },
        get: originalDescriptor.get,
        enumerable: originalDescriptor.enumerable,
        configurable: originalDescriptor.configurable
      })
    }

    // Monitor for console manipulation attempts
    const originalLog = console.log
    console.log = function(...args: any[]) {
      const message = args.join(' ')
      if (message.includes('password') || message.includes('token') || message.includes('secret')) {
        logError('SECURITY', 'Sensitive data logged to console', {
          message_length: message.length
        })
      }
      return originalLog.apply(console, args)
    }

    // Cleanup
    return () => {
      if (originalDescriptor) {
        Object.defineProperty(Element.prototype, 'innerHTML', originalDescriptor)
      }
      console.log = originalLog
    }
  }, [logError])
}

export default useAuditLogging