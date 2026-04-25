/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as newOrder } from './new-order.tsx'
import { template as orderCompleted } from './order-completed.tsx'
import { template as orderNote } from './order-note.tsx'
import { template as stockAvailable } from './stock-available.tsx'
import { template as tasksCompletedAdmin } from './tasks-completed-admin.tsx'
import { template as tasksOverdueAlert } from './tasks-overdue-alert.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'new-order': newOrder,
  'order-completed': orderCompleted,
  'order-note': orderNote,
  'stock-available': stockAvailable,
  'tasks-completed-admin': tasksCompletedAdmin,
  'tasks-overdue-alert': tasksOverdueAlert,
}
