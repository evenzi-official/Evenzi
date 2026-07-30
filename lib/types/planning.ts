export interface TaskPriorityOption {
  id: string
  slug: 'low' | 'med' | 'high'
  name: string
  iconName: string | null
}

export interface TaskStatusOption {
  id: string
  slug: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  name: string
  category: 'open' | 'done' | 'dropped'
  iconName: string | null
}

export interface ExpenseTypeOption {
  id: string
  name: string
  iconName: string | null
  isCustom: boolean
}

export interface SubEventOption {
  id: string
  label: string
}

export interface TaskRow {
  id: string
  title: string
  description: string | null
  dueDate: string | null
  subEventId: string | null
  priorityId: string
  statusId: string
}

export interface ExpenseRow {
  id: string
  amount: number
  expenseTypeId: string
  vendorName: string | null
  subEventId: string | null
  expenseDate: string | null
  description: string | null
}

export interface BudgetSummary {
  totalAmount: number
  spent: number
  remaining: number
}

export interface PlanningInitialData {
  eventName: string
  tasks: TaskRow[]
  expenses: ExpenseRow[]
  budget: BudgetSummary | null
  taskPriorities: TaskPriorityOption[]
  taskStatuses: TaskStatusOption[]
  expenseTypes: ExpenseTypeOption[]
  subEvents: SubEventOption[]
}
