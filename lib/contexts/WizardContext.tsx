'use client'

import React, { createContext, useContext, useReducer } from 'react'
import type { EventType, SelectedSubEvent } from '@/lib/types/events'

// Per-celebration scheduling captured in Step 3 modals (M5). Extends the shared
// SelectedSubEvent (lib/types) with the optional date / time / venue / custom
// description fields the create payload persists into `event_sub_events`.
export interface WizardSubEvent extends SelectedSubEvent {
  clientId: string
  eventDate: string | null  // ISO YYYY-MM-DD
  startTime: string | null  // 24h HH:MM
  endTime: string | null    // 24h HH:MM
  venue: string | null
  venueAddress: string | null
  customDesc: string | null
}

let subEventSeq = 0
function nextClientId(): string {
  subEventSeq += 1
  return `se_${Date.now().toString(36)}_${subEventSeq}`
}

// --- State ---

export interface WizardState {
  currentStep: number
  totalSteps: number
  eventType: EventType | null
  basicDetails: {
    /** Optional explicit event title (M3). Falls back to auto-derived name when blank. */
    eventTitle: string | null
    primaryDate: string | null
    primaryVenue: string | null
    guestCapacity: number | null
    metadata: Record<string, string>
    coverImageUrl: string | null
  }
  selectedSubEvents: WizardSubEvent[]
}

export const initialWizardState: WizardState = {
  currentStep: 1,
  totalSteps: 3,
  eventType: null,
  basicDetails: {
    eventTitle: null,
    primaryDate: null,
    primaryVenue: null,
    guestCapacity: null,
    metadata: {},
    coverImageUrl: null,
  },
  selectedSubEvents: [],
}

// --- Actions ---

export interface SubEventMetaPayload {
  eventDate?: string | null
  startTime?: string | null
  endTime?: string | null
  venue?: string | null
  venueAddress?: string | null
}

export type WizardAction =
  | { type: 'SET_EVENT_TYPE'; payload: EventType }
  | { type: 'SET_BASIC_DETAILS'; payload: WizardState['basicDetails'] }
  | { type: 'TOGGLE_SUB_EVENT'; payload: { subEventTypeId: string; name: string; iconName: string | null } }
  | { type: 'ADD_CUSTOM_SUB_EVENT'; payload: { name: string; customDesc?: string | null } }
  | { type: 'REMOVE_CUSTOM_SUB_EVENT'; payload: { clientId: string } }
  | { type: 'SET_SUB_EVENT_META'; payload: { clientId: string } & SubEventMetaPayload }
  | { type: 'SET_DEFAULT_SUB_EVENTS'; payload: SelectedSubEvent[] }
  | { type: 'GO_TO_STEP'; payload: number }
  | { type: 'RESET' }

function toWizardSubEvent(se: SelectedSubEvent): WizardSubEvent {
  return {
    ...se,
    clientId: nextClientId(),
    eventDate: null,
    startTime: null,
    endTime: null,
    venue: null,
    venueAddress: null,
    customDesc: null,
  }
}

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
            toWizardSubEvent({ subEventTypeId, customName: null, name, iconName }),
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
            ...toWizardSubEvent({
              subEventTypeId: null,
              customName: action.payload.name,
              name: action.payload.name,
              iconName: null,
            }),
            customDesc: action.payload.customDesc ?? null,
          },
        ],
      }
    }

    case 'REMOVE_CUSTOM_SUB_EVENT': {
      const { clientId } = action.payload
      return {
        ...state,
        selectedSubEvents: state.selectedSubEvents.filter((se) => se.clientId !== clientId),
      }
    }

    case 'SET_SUB_EVENT_META': {
      const { clientId, ...meta } = action.payload
      return {
        ...state,
        selectedSubEvents: state.selectedSubEvents.map((se) => {
          if (se.clientId !== clientId) return se
          return {
            ...se,
            ...(meta.eventDate !== undefined ? { eventDate: meta.eventDate } : {}),
            ...(meta.startTime !== undefined ? { startTime: meta.startTime } : {}),
            ...(meta.endTime !== undefined ? { endTime: meta.endTime } : {}),
            ...(meta.venue !== undefined ? { venue: meta.venue } : {}),
            ...(meta.venueAddress !== undefined ? { venueAddress: meta.venueAddress } : {}),
          }
        }),
      }
    }

    case 'SET_DEFAULT_SUB_EVENTS': {
      // Only applies if selectedSubEvents is empty — won't overwrite user selections
      if (state.selectedSubEvents.length > 0) {
        return state
      }
      return {
        ...state,
        selectedSubEvents: action.payload.map(toWizardSubEvent),
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
