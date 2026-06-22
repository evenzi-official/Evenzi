import { describe, it, expect } from 'vitest'
import { wizardReducer, initialWizardState } from '@/lib/contexts/WizardContext'
import type { WizardState } from '@/lib/contexts/WizardContext'
import type { EventType, SelectedSubEvent } from '@/lib/types/events'

// --- Fixtures ---

const mockEventTypeWithSubEvents: EventType = {
  id: 'evt-1',
  name: 'Wedding',
  slug: 'wedding',
  description: 'A wedding event',
  iconName: 'rings',
  imageUrl: null,
  enabled: true,
  hasSubEvents: true,
  formSchema: [],
  features: [],
  displayOrder: 1,
}

const mockEventTypeWithoutSubEvents: EventType = {
  id: 'evt-2',
  name: 'Birthday',
  slug: 'birthday',
  description: 'A birthday event',
  iconName: 'cake',
  imageUrl: null,
  enabled: true,
  hasSubEvents: false,
  formSchema: [],
  features: [],
  displayOrder: 2,
}

// --- Tests ---

describe('wizardReducer', () => {
  it('SET_EVENT_TYPE sets event type and totalSteps=4 when hasSubEvents is true', () => {
    const next = wizardReducer(initialWizardState, {
      type: 'SET_EVENT_TYPE',
      payload: mockEventTypeWithSubEvents,
    })
    expect(next.eventType).toEqual(mockEventTypeWithSubEvents)
    expect(next.totalSteps).toBe(4)
    // should reset to initial step
    expect(next.currentStep).toBe(1)
  })

  it('SET_EVENT_TYPE sets totalSteps=3 when hasSubEvents is false', () => {
    const next = wizardReducer(initialWizardState, {
      type: 'SET_EVENT_TYPE',
      payload: mockEventTypeWithoutSubEvents,
    })
    expect(next.eventType).toEqual(mockEventTypeWithoutSubEvents)
    expect(next.totalSteps).toBe(3)
  })

  it('SET_BASIC_DETAILS updates basicDetails', () => {
    const details: WizardState['basicDetails'] = {
      primaryDate: '2027-02-14',
      primaryVenue: 'Grand Hall',
      guestCapacity: 200,
      metadata: { theme: 'vintage' },
      coverImageUrl: null,
    }
    const next = wizardReducer(initialWizardState, {
      type: 'SET_BASIC_DETAILS',
      payload: details,
    })
    expect(next.basicDetails).toEqual(details)
  })

  it('TOGGLE_SUB_EVENT on — adds sub-event with name and iconName', () => {
    const next = wizardReducer(initialWizardState, {
      type: 'TOGGLE_SUB_EVENT',
      payload: { subEventTypeId: 'sub-1', name: 'Mehendi', iconName: 'leaf' },
    })
    expect(next.selectedSubEvents).toHaveLength(1)
    expect(next.selectedSubEvents[0]).toEqual({
      subEventTypeId: 'sub-1',
      customName: null,
      name: 'Mehendi',
      iconName: 'leaf',
    })
  })

  it('TOGGLE_SUB_EVENT off — removes sub-event if already selected', () => {
    const stateWithSub: WizardState = {
      ...initialWizardState,
      selectedSubEvents: [
        { subEventTypeId: 'sub-1', customName: null, name: 'Mehendi', iconName: 'leaf' },
      ],
    }
    const next = wizardReducer(stateWithSub, {
      type: 'TOGGLE_SUB_EVENT',
      payload: { subEventTypeId: 'sub-1', name: 'Mehendi', iconName: 'leaf' },
    })
    expect(next.selectedSubEvents).toHaveLength(0)
  })

  it('ADD_CUSTOM_SUB_EVENT adds a custom sub-event with name', () => {
    const next = wizardReducer(initialWizardState, {
      type: 'ADD_CUSTOM_SUB_EVENT',
      payload: { name: 'Cocktail Night' },
    })
    expect(next.selectedSubEvents).toHaveLength(1)
    expect(next.selectedSubEvents[0]).toEqual({
      subEventTypeId: null,
      customName: 'Cocktail Night',
      name: 'Cocktail Night',
      iconName: null,
    })
  })

  it('REMOVE_CUSTOM_SUB_EVENT removes sub-event at given index', () => {
    const stateWithMultiple: WizardState = {
      ...initialWizardState,
      selectedSubEvents: [
        { subEventTypeId: 'sub-1', customName: null, name: 'Mehendi', iconName: 'leaf' },
        { subEventTypeId: null, customName: 'Pool Party', name: 'Pool Party', iconName: null },
      ],
    }
    const next = wizardReducer(stateWithMultiple, {
      type: 'REMOVE_CUSTOM_SUB_EVENT',
      payload: { index: 0 },
    })
    expect(next.selectedSubEvents).toHaveLength(1)
    expect(next.selectedSubEvents[0].name).toBe('Pool Party')
  })

  it('SET_DEFAULT_SUB_EVENTS sets defaults when selectedSubEvents is empty', () => {
    const defaults: SelectedSubEvent[] = [
      { subEventTypeId: 'sub-1', customName: null, name: 'Sangam', iconName: 'music' },
      { subEventTypeId: 'sub-2', customName: null, name: 'Pheras', iconName: 'fire' },
    ]
    const next = wizardReducer(initialWizardState, {
      type: 'SET_DEFAULT_SUB_EVENTS',
      payload: defaults,
    })
    expect(next.selectedSubEvents).toEqual(defaults)
  })

  it('SET_DEFAULT_SUB_EVENTS does NOT overwrite existing user selections', () => {
    const existingSelection: SelectedSubEvent[] = [
      { subEventTypeId: 'sub-1', customName: null, name: 'Mehendi', iconName: 'leaf' },
    ]
    const stateWithSelection: WizardState = {
      ...initialWizardState,
      selectedSubEvents: existingSelection,
    }
    const next = wizardReducer(stateWithSelection, {
      type: 'SET_DEFAULT_SUB_EVENTS',
      payload: [
        { subEventTypeId: 'sub-99', customName: null, name: 'Other', iconName: null },
      ],
    })
    expect(next.selectedSubEvents).toEqual(existingSelection)
  })

  it('GO_TO_STEP sets currentStep', () => {
    const next = wizardReducer(initialWizardState, {
      type: 'GO_TO_STEP',
      payload: 3,
    })
    expect(next.currentStep).toBe(3)
  })

  it('RESET returns initialWizardState', () => {
    const modified: WizardState = {
      currentStep: 3,
      totalSteps: 4,
      eventType: mockEventTypeWithSubEvents,
      basicDetails: {
        primaryDate: '2027-02-14',
        primaryVenue: 'Grand Hall',
        guestCapacity: 200,
        metadata: { theme: 'vintage' },
        coverImageUrl: null,
      },
      selectedSubEvents: [
        { subEventTypeId: 'sub-1', customName: null, name: 'Mehendi', iconName: 'leaf' },
      ],
    }
    const next = wizardReducer(modified, { type: 'RESET' })
    expect(next).toEqual(initialWizardState)
  })
})
