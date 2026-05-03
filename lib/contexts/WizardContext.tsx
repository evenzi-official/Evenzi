'use client'

import React, { createContext, useContext, useReducer } from 'react'
import type { EventType, SelectedSubEvent } from '@/lib/types/events'

// --- State ---

export interface WizardState {
  currentStep: number
  totalSteps: number
  eventType: EventType | null
  basicDetails: {
    primaryDate: string | null
    primaryVenue: string | null
    guestCapacity: number | null
    metadata: Record<string, string>
  }
  selectedSubEvents: SelectedSubEvent[]
}

export const initialWizardState: WizardState = {
  currentStep: 1,
  totalSteps: 3,
  eventType: null,
  basicDetails: {
    primaryDate: null,
    primaryVenue: null,
    guestCapacity: null,
    metadata: {},
  },
  selectedSubEvents: [],
}

// --- Actions ---

export type WizardAction =
  | { type: 'SET_EVENT_TYPE'; payload: EventType }
  | { type: 'SET_BASIC_DETAILS'; payload: WizardState['basicDetails'] }
  | { type: 'TOGGLE_SUB_EVENT'; payload: { subEventTypeId: string; name: string; iconName: string | null } }
  | { type: 'ADD_CUSTOM_SUB_EVENT'; payload: { name: string } }
  | { type: 'REMOVE_CUSTOM_SUB_EVENT'; payload: { index: number } }
  | { type: 'SET_DEFAULT_SUB_EVENTS'; payload: SelectedSubEvent[] }
  | { type: 'GO_TO_STEP'; payload: number }
  | { type: 'RESET' }

// --- Reducer ---

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_EVENT_TYPE': {
      const hasSubEvents = action.payload.hasSubEvents
      return {
        ...initialWizardState,
        eventType: action.payload,
        totalSteps: hasSubEvents ? 4 : 3,
      }
    }

    case 'SET_BASIC_DETAILS': {
      return {
        ...state,
        basicDetails: action.payload,
      }
    }

    case 'TOGGLE_SUB_EVENT': {
      const { subEventTypeId, name, iconName } = action.payload
      const exists = state.selectedSubEvents.some(
        (se) => se.subEventTypeId === subEventTypeId
      )
      if (exists) {
        // Toggle off — remove it
        return {
          ...state,
          selectedSubEvents: state.selectedSubEvents.filter(
            (se) => se.subEventTypeId !== subEventTypeId
          ),
        }
      } else {
        // Toggle on — add it
        return {
          ...state,
          selectedSubEvents: [
            ...state.selectedSubEvents,
            { subEventTypeId, customName: null, name, iconName },
          ],
        }
      }
    }

    case 'ADD_CUSTOM_SUB_EVENT': {
      return {
        ...state,
        selectedSubEvents: [
          ...state.selectedSubEvents,
          {
            subEventTypeId: null,
            customName: action.payload.name,
            name: action.payload.name,
            iconName: null,
          },
        ],
      }
    }

    case 'REMOVE_CUSTOM_SUB_EVENT': {
      const { index } = action.payload
      return {
        ...state,
        selectedSubEvents: state.selectedSubEvents.filter((_, i) => i !== index),
      }
    }

    case 'SET_DEFAULT_SUB_EVENTS': {
      // Only applies if selectedSubEvents is empty — won't overwrite user selections
      if (state.selectedSubEvents.length > 0) {
        return state
      }
      return {
        ...state,
        selectedSubEvents: action.payload,
      }
    }

    case 'GO_TO_STEP': {
      return {
        ...state,
        currentStep: action.payload,
      }
    }

    case 'RESET': {
      return initialWizardState
    }

    default: {
      return state
    }
  }
}

// --- Context ---

interface WizardContextValue {
  state: WizardState
  dispatch: React.Dispatch<WizardAction>
}

const WizardContext = createContext<WizardContextValue | null>(null)

// --- Provider ---

export function WizardProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [state, dispatch] = useReducer(wizardReducer, initialWizardState)
  return (
    <WizardContext.Provider value={{ state, dispatch }}>
      {children}
    </WizardContext.Provider>
  )
}

// --- Hook ---

export function useWizard(): WizardContextValue {
  const ctx = useContext(WizardContext)
  if (!ctx) {
    throw new Error('useWizard must be used within a WizardProvider')
  }
  return ctx
}
